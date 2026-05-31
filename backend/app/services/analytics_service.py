from typing import List

from app.models.enums import PengajuanStatus
from app.repositories.pengajuan_repository import PengajuanRepository
from app.repositories.ruangan_repository import RuanganRepository
from app.schemas.analytics import AnalyticsOut, BusyHour, PopularFacility, ServiceHealth


class AnalyticsService:
    def __init__(
        self,
        pengajuan_repo: PengajuanRepository,
        ruangan_repo: RuanganRepository,
    ):
        self._pengajuan_repo = pengajuan_repo
        self._ruangan_repo = ruangan_repo

    def get_analytics(self) -> AnalyticsOut:
        pengajuan_list = self._pengajuan_repo.get_all()
        ruangan_list = self._ruangan_repo.get_all()

        ruangan_map = {r.id: r.name for r in ruangan_list}

        # ── Jam Sibuk (24 jam) ──
        hours_count = [0] * 24
        for p in pengajuan_list:
            hours_count[p.start_time.hour] += 1

        busy_hours = [
            BusyHour(hour=f"{i:02d}:00", count=hours_count[i]) for i in range(24)
        ]

        # ── Ruangan Populer ──
        ruangan_count: dict[str, int] = {}
        for p in pengajuan_list:
            ruangan_count[p.ruangan_id] = ruangan_count.get(p.ruangan_id, 0) + 1

        total = len(pengajuan_list)
        popular = sorted(
            [
                PopularFacility(
                    name=ruangan_map.get(rid, rid),
                    count=cnt,
                    percentage=round((cnt / total) * 100) if total > 0 else 0,
                )
                for rid, cnt in ruangan_count.items()
            ],
            key=lambda x: x.count,
            reverse=True,
        )[:5]

        # ── Kesehatan Layanan ──
        active = sum(
            1
            for p in pengajuan_list
            if p.status == PengajuanStatus.MENUNGGU_VERIFIKASI
        )
        approved = sum(
            1
            for p in pengajuan_list
            if p.status in [PengajuanStatus.DISETUJUI, PengajuanStatus.SELESAI]
        )
        rejected = sum(
            1 for p in pengajuan_list if p.status == PengajuanStatus.DITOLAK
        )
        total_processed = approved + rejected

        approval_rate = (
            round((approved / total_processed) * 100) if total_processed > 0 else 0
        )
        cancellation_rate = (
            round((rejected / total) * 100) if total > 0 else 0
        )

        # ── Estimasi Rata-rata Waktu Tunggu ──
        pending = [
            p
            for p in pengajuan_list
            if p.status == PengajuanStatus.MENUNGGU_VERIFIKASI
        ]
        if pending:
            wait_times = [
                15 + (i + 1) * 5 + min(p.attendees / 50, 2) * 5
                for i, p in enumerate(pending)
            ]
            avg_wait = round(sum(wait_times) / len(wait_times))
        else:
            avg_wait = 15

        return AnalyticsOut(
            busy_hours=busy_hours,
            popular_facilities=popular,
            service_health=ServiceHealth(
                active_requests=active,
                approval_rate=approval_rate,
                average_wait_time_minutes=avg_wait,
                cancellation_rate=cancellation_rate,
            ),
        )
