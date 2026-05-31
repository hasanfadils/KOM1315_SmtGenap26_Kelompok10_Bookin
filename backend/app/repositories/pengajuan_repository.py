from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.pengajuan import Pengajuan
from app.models.enums import PengajuanStatus
from app.repositories.base import BaseRepository


class PengajuanRepository(BaseRepository[Pengajuan]):
    def __init__(self, db: Session):
        super().__init__(Pengajuan, db)

    def check_conflict(
        self,
        ruangan_id: str,
        start: datetime,
        end: datetime,
        exclude_id: Optional[str] = None,
    ) -> bool:
        """Cek bentrok jadwal pengajuan yang aktif."""
        excluded_statuses = [PengajuanStatus.DITOLAK, PengajuanStatus.SELESAI]

        query = self._db.query(Pengajuan).filter(
            Pengajuan.ruangan_id == ruangan_id,
            Pengajuan.status.notin_(excluded_statuses),
            or_(
                and_(Pengajuan.start_time <= start, Pengajuan.end_time > start),
                and_(Pengajuan.start_time < end, Pengajuan.end_time >= end),
                and_(Pengajuan.start_time >= start, Pengajuan.end_time <= end),
            ),
        )
        if exclude_id:
            query = query.filter(Pengajuan.id != exclude_id)

        return query.first() is not None

    def get_by_user(self, user_id: str) -> List[Pengajuan]:
        """Dapatkan semua pengajuan pengguna, dari yang terbaru."""
        return (
            self._db.query(Pengajuan)
            .filter(Pengajuan.user_id == user_id)
            .order_by(Pengajuan.created_at.desc())
            .all()
        )

    def get_all_ordered(self) -> List[Pengajuan]:
        """Dapatkan semua pengajuan diurutkan dari yang terbaru."""
        return (
            self._db.query(Pengajuan)
            .order_by(Pengajuan.created_at.desc())
            .all()
        )

    def get_pending_queue(self) -> List[Pengajuan]:
        """Dapatkan antrean pengajuan menunggu verifikasi."""
        return (
            self._db.query(Pengajuan)
            .filter(Pengajuan.status == PengajuanStatus.MENUNGGU_VERIFIKASI)
            .order_by(Pengajuan.created_at.asc())
            .all()
        )

    def get_verified_queue(self) -> List[Pengajuan]:
        """Dapatkan antrean pengajuan terverifikasi Tendik, menunggu Admin."""
        return (
            self._db.query(Pengajuan)
            .filter(Pengajuan.status == PengajuanStatus.DIVERIFIKASI_TENDIK)
            .order_by(Pengajuan.created_at.asc())
            .all()
        )

    def get_approved_schedule(
        self, ruangan_id: Optional[str] = None
    ) -> List[Pengajuan]:
        """Dapatkan jadwal pengajuan yang disetujui."""
        query = self._db.query(Pengajuan).filter(
            Pengajuan.status == PengajuanStatus.DISETUJUI
        )
        if ruangan_id:
            query = query.filter(Pengajuan.ruangan_id == ruangan_id)
        return query.order_by(Pengajuan.start_time.asc()).all()
