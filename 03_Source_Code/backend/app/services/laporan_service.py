"""
Kelas OOP Laporan untuk fitur rekapitulasi data peminjaman.

Alur:
  1. Admin memanggil Laporan.generate()
  2. Laporan mengambil semua Pengajuan dari database (List[Pengajuan])
  3. Untuk setiap Pengajuan, memanggil get_status() untuk menghitung ringkasan
  4. Mengembalikan data list Peminjaman dan ringkasan metrik status (jumlah & persentase)
"""

from datetime import date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.enums import PengajuanStatus
from app.models.pengajuan import Pengajuan
from app.repositories.pengajuan_repository import PengajuanRepository


class Peminjaman:
    """Kelas OOP yang membungkus model Pengajuan dan menyediakan metode domain get_status."""

    def __init__(self, pengajuan: Pengajuan):
        self.pengajuan = pengajuan

    def get_status(self) -> PengajuanStatus:
        """Mengambil status peminjaman/pengajuan."""
        return self.pengajuan.status


class Laporan:
    """Kelas OOP untuk menghasilkan laporan rekapitulasi data peminjaman."""

    def generate(
        self,
        db: Session,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        ruangan_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Men-generate laporan rekapitulasi data peminjaman berdasarkan filter.
        
        Alur OOP:
          1. Ambil data pengajuan dari repository.
          2. Bungkus ke kelas Peminjaman.
          3. Panggil get_status() pada objek Peminjaman untuk statistik.
        """
        pengajuan_repo = PengajuanRepository(db)
        query = pengajuan_repo.session.query(Pengajuan)

        # Terapkan filter opsional
        if status:
            query = query.filter(Pengajuan.status == status)
        if start_date:
            # Bandingkan tanggal secara inklusif dengan start_time
            query = query.filter(Pengajuan.start_time >= start_date)
        if end_date:
            # Bandingkan tanggal secara inklusif dengan end_time
            query = query.filter(Pengajuan.end_time <= end_date)
        if ruangan_id:
            query = query.filter(Pengajuan.ruangan_id == ruangan_id)

        pengajuans = query.order_by(Pengajuan.created_at.desc()).all()

        # Alur OOP: Bungkus ke List[Peminjaman]
        peminjamans = [Peminjaman(p) for p in pengajuans]
        total = len(peminjamans)

        # Inisialisasi ringkasan untuk semua status
        ringkasan = {}
        for s in PengajuanStatus:
            # Gunakan key name (misal MENUNGGU_VERIFIKASI) dan value (misal Menunggu Persetujuan)
            # agar kompatibel dengan berbagai cara akses di frontend.
            ringkasan[s.name] = {"jumlah": 0, "persentase": 0.0}
            ringkasan[s.value] = {"jumlah": 0, "persentase": 0.0}

        # Hitung jumlah per status menggunakan get_status()
        for p in peminjamans:
            status_obj = p.get_status()
            ringkasan[status_obj.name]["jumlah"] += 1
            ringkasan[status_obj.value]["jumlah"] += 1

        # Hitung persentase
        if total > 0:
            for s in PengajuanStatus:
                pct = round((ringkasan[s.name]["jumlah"] / total) * 100, 2)
                ringkasan[s.name]["persentase"] = pct
                ringkasan[s.value]["persentase"] = pct

        return {
            "data_peminjaman": [p.pengajuan for p in peminjamans],
            "ringkasan": ringkasan,
        }
