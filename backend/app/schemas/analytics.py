from typing import List

from pydantic import BaseModel


class BusyHour(BaseModel):
    hour: str
    count: int


class PopularFacility(BaseModel):
    name: str
    count: int
    percentage: int


class ServiceHealth(BaseModel):
    active_requests: int
    approval_rate: int
    average_wait_time_minutes: int
    cancellation_rate: int


class AnalyticsOut(BaseModel):
    busy_hours: List[BusyHour]
    popular_facilities: List[PopularFacility]
    service_health: ServiceHealth

class PublicStatsOut(BaseModel):
    total_fasilitas: int
    peminjaman_aktif: int
    kecepatan_layanan_menit: int
