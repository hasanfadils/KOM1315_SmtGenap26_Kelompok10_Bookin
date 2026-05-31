"""
Layanan pengajuan — logika bisnis peminjaman ruangan.
Mengatur siklus pengajuan: Submit → Verifikasi (Tendik) → Setujui (Admin) / Tolak.
"""

from datetime import datetime, timezone
from typing import Optional, List

from fastapi import UploadFile

from app.models.pengajuan import Pengajuan
from app.models.user import User
from app.models.enums import (
    PengajuanStatus,
    UserRole,
    NotificationType,
    RuanganStatus,
)
from app.schemas.pengajuan import PengajuanCreate
from app.repositories.pengajuan_repository import PengajuanRepository
from app.repositories.ruangan_repository import RuanganRepository
from app.services.notification_service import NotificationService
from app.services.dokumen_service import DokumenService
from app.exceptions.handlers import (
    NotFoundException,
    ConflictException,
    ForbiddenException,
    AppException,
    ValidationException,
)


class PengajuanService:
    """Mengelola seluruh siklus pengajuan dengan persetujuan bertingkat."""

    def __init__(
        self,
        pengajuan_repo: PengajuanRepository,
        ruangan_repo: RuanganRepository,
        notification_service: NotificationService,
        dokumen_service: DokumenService,
    ):
        self._pengajuan_repo = pengajuan_repo
        self._ruangan_repo = ruangan_repo
        self._notification_svc = notification_service
        self._dokumen_svc = dokumen_service

    # ── Metode Alur Utama ──

    def submit(
        self,
        user: User,
        data: PengajuanCreate,
        documents: Optional[List[UploadFile]] = None,
    ) -> Pengajuan:
        """Mahasiswa mengajukan peminjaman ruangan baru."""
        # 1. Validasi keberadaan dan ketersediaan ruangan 
        ruangan = self._ruangan_repo.get_by_id_for_update(data.ruangan_id)
        if not ruangan:
            raise NotFoundException("Ruangan", data.ruangan_id)
        if ruangan.status != RuanganStatus.AVAILABLE:
            raise AppException(
                f"Ruangan tidak tersedia, status: {ruangan.status.value}", 400
            )

        # 2. Parse dan validasi rentang waktu
        start_dt, end_dt = self._parse_times(data.date, data.start_time, data.end_time)

        # 3. Cek bentrok jadwal
        if self._pengajuan_repo.check_conflict(data.ruangan_id, start_dt, end_dt):
            raise ConflictException("Ruangan sudah dipesan pada jam tersebut")

        # 4. Hitung posisi antrean
        pending_count = len(self._pengajuan_repo.get_pending_queue())

        # 5. Buat pengajuan
        pengajuan = Pengajuan(
            ruangan_id=data.ruangan_id,
            user_id=user.id,
            user_name=user.name,
            event_name=data.event_name,
            event_description=data.event_description,
            start_time=start_dt,
            end_time=end_dt,
            attendees=data.attendees,
            status=PengajuanStatus.MENUNGGU_VERIFIKASI,
            queue_position=pending_count + 1,
        )
        self._pengajuan_repo.create(pengajuan)

        # 6. Unggah dokumen jika ada
        if documents:
            self._dokumen_svc.upload_documents(pengajuan.id, documents)

        # 7. Commit transaksi secara atomik
        self._pengajuan_repo.commit()
        return pengajuan

    def verify(self, tendik: User, pengajuan_id: str) -> Pengajuan:
        """Tendik memverifikasi dokumen dan mengubah status pengajuan."""
        if tendik.role != UserRole.staff:
            raise ForbiddenException(
                "Hanya Tendik yang dapat memverifikasi pengajuan"
            )

        pengajuan = self._pengajuan_repo.get_by_id(pengajuan_id)
        if not pengajuan:
            raise NotFoundException("Pengajuan", pengajuan_id)

        # Validasi wewenang Tendik Stakeholder
        if tendik.managed_ruangan_ids and pengajuan.ruangan_id not in tendik.managed_ruangan_ids:
            raise ForbiddenException(
                "Anda bukan penanggung jawab (stakeholder) untuk fasilitas ini"
            )

        if pengajuan.status != PengajuanStatus.MENUNGGU_VERIFIKASI:
            raise AppException(
                f"Pengajuan tidak dalam status 'Menunggu Verifikasi', "
                f"status saat ini: {pengajuan.status.value}",
                400,
            )

        pengajuan.status = PengajuanStatus.DIVERIFIKASI_TENDIK
        pengajuan.verified_by = tendik.id
        pengajuan.verified_at = datetime.now(timezone.utc)

        # Beri notifikasi ke mahasiswa
        self._notification_svc.create_notification(
            user_id=str(pengajuan.user_id),
            title="Pengajuan Diverifikasi Tendik",
            message=(
                f'Pengajuan Anda untuk acara "{pengajuan.event_name}" '
                f"telah diverifikasi oleh Tendik dan menunggu persetujuan Admin."
            ),
            notif_type=NotificationType.VERIFICATION,
            related_id=pengajuan_id,
        )

        self._pengajuan_repo.commit()  # Commit atomik tunggal
        return pengajuan

    def approve(self, admin: User, pengajuan_id: str) -> Pengajuan:
        """Admin memberikan persetujuan akhir (butuh verifikasi Tendik)."""
        if admin.role != UserRole.admin:
            raise ForbiddenException("Hanya Admin yang dapat menyetujui pengajuan")

        pengajuan = self._pengajuan_repo.get_by_id(pengajuan_id)
        if not pengajuan:
            raise NotFoundException("Pengajuan", pengajuan_id)

        # Row-level lock pada ruangan terkait untuk menserialisasi persetujuan secara konkuren
        self._ruangan_repo.get_by_id_for_update(pengajuan.ruangan_id)

        if pengajuan.status != PengajuanStatus.DIVERIFIKASI_TENDIK:
            raise AppException(
                f"Pengajuan harus diverifikasi Tendik terlebih dahulu. "
                f"Status saat ini: {pengajuan.status.value}",
                400,
            )

        # Cek ulang bentrok (proteksi race condition)
        if self._pengajuan_repo.check_conflict(
            pengajuan.ruangan_id,
            pengajuan.start_time,
            pengajuan.end_time,
            exclude_id=pengajuan.id,
        ):
            raise ConflictException(
                "Konflik jadwal terdeteksi. Ruangan sudah dipesan pada jam tersebut."
            )

        pengajuan.status = PengajuanStatus.DISETUJUI
        pengajuan.approved_by = admin.id
        pengajuan.approved_at = datetime.now(timezone.utc)

        # Beri notifikasi ke mahasiswa
        self._notification_svc.create_notification(
            user_id=str(pengajuan.user_id),
            title="Pengajuan Disetujui",
            message=(
                f'Pengajuan Anda untuk acara "{pengajuan.event_name}" '
                f"telah disetujui oleh Admin."
            ),
            notif_type=NotificationType.BOOKING_STATUS,
            related_id=pengajuan_id,
        )

        self._pengajuan_repo.commit()  # Commit atomik tunggal
        return pengajuan

    def reject(
        self, staff: User, pengajuan_id: str, reason: str
    ) -> Pengajuan:
        """Tendik atau Admin menolak pengajuan dengan alasan."""
        if staff.role not in [UserRole.staff, UserRole.admin]:
            raise ForbiddenException(
                "Hanya Admin atau Tendik yang dapat menolak pengajuan"
            )

        pengajuan = self._pengajuan_repo.get_by_id(pengajuan_id)
        if not pengajuan:
            raise NotFoundException("Pengajuan", pengajuan_id)

        # Validasi wewenang Tendik Stakeholder
        if staff.role == UserRole.staff and staff.managed_ruangan_ids:
            if pengajuan.ruangan_id not in staff.managed_ruangan_ids:
                raise ForbiddenException(
                    "Anda bukan penanggung jawab (stakeholder) untuk fasilitas ini"
                )

        if pengajuan.status in [PengajuanStatus.DITOLAK, PengajuanStatus.SELESAI]:
            raise AppException(
                f"Pengajuan sudah dalam status final: {pengajuan.status.value}",
                400,
            )

        pengajuan.status = PengajuanStatus.DITOLAK
        pengajuan.rejection_reason = reason

        # Atur field audit sesuai dengan pihak yang menolak
        if staff.role == UserRole.staff:
            pengajuan.verified_by = staff.id
            pengajuan.verified_at = datetime.now(timezone.utc)
        else:
            pengajuan.approved_by = staff.id
            pengajuan.approved_at = datetime.now(timezone.utc)

        # Beri notifikasi ke mahasiswa
        self._notification_svc.create_notification(
            user_id=pengajuan.user_id,
            title="Pengajuan Ditolak",
            message=(
                f'Pengajuan Anda untuk acara "{pengajuan.event_name}" '
                f"telah ditolak. Alasan: {reason}"
            ),
            notif_type=NotificationType.BOOKING_STATUS,
            related_id=pengajuan_id,
        )

        self._pengajuan_repo.commit()  # Commit atomik tunggal
        return pengajuan

    # ── Metode Query ──

    def get_user_pengajuan(self, user_id: str) -> List[Pengajuan]:
        return self._pengajuan_repo.get_by_user(user_id)

    def get_all(self) -> List[Pengajuan]:
        return self._pengajuan_repo.get_all_ordered()

    def get_by_id(self, pengajuan_id: str, current_user: User) -> Pengajuan:
        pengajuan = self._pengajuan_repo.get_by_id(pengajuan_id)
        if not pengajuan:
            raise NotFoundException("Pengajuan", pengajuan_id)

        is_owner = pengajuan.user_id == current_user.id
        is_staff = current_user.role in [UserRole.admin, UserRole.staff]
        if not is_owner and not is_staff:
            raise ForbiddenException()

        return pengajuan

    def get_public_schedule(
        self, ruangan_id: Optional[str] = None
    ) -> List[Pengajuan]:
        return self._pengajuan_repo.get_approved_schedule(ruangan_id)

    def delete(self, pengajuan_id: str, current_user: User) -> None:
        pengajuan = self._pengajuan_repo.get_by_id(pengajuan_id)
        if not pengajuan:
            raise NotFoundException("Pengajuan", pengajuan_id)

        is_owner = pengajuan.user_id == current_user.id
        is_admin = current_user.role == UserRole.admin
        if not is_owner and not is_admin:
            raise ForbiddenException()

        # Proteksi: Mahasiswa hanya boleh menghapus fisik jika status masih 'MENUNGGU_VERIFIKASI'
        if not is_admin and pengajuan.status != PengajuanStatus.MENUNGGU_VERIFIKASI:
            raise AppException(
                f"Pengajuan dengan status '{pengajuan.status.value}' tidak dapat dihapus. "
                "Hanya pengajuan dalam status 'Menunggu Persetujuan' yang dapat dihapus secara fisik.",
                400,
            )

        self._pengajuan_repo.delete(pengajuan)
        self._pengajuan_repo.commit()

    # ── Helper Privat ──

    @staticmethod
    def _parse_times(
        date: str, start: str, end: str
    ) -> tuple[datetime, datetime]:
        """Mengubah string tanggal/waktu ke objek datetime dengan validasi."""
        try:
            start_dt = datetime.fromisoformat(f"{date}T{start}:00")
            end_dt = datetime.fromisoformat(f"{date}T{end}:00")
        except ValueError:
            raise ValidationException(
                "Format tanggal atau waktu salah (gunakan YYYY-MM-DD dan HH:MM)"
            )

        if start_dt >= end_dt:
            raise ValidationException(
                "Waktu selesai harus setelah waktu mulai"
            )

        if start_dt < datetime.now():
            raise ValidationException(
                "Tidak dapat meminjam untuk waktu yang sudah lewat"
            )

        return start_dt, end_dt
