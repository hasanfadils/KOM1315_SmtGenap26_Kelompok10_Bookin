from fastapi import APIRouter, Depends

from app.dependencies.auth import require_admin_or_staff
from app.dependencies.services import get_analytics_service
from app.services.analytics_service import AnalyticsService
from app.models.user import User
from app.schemas.analytics import AnalyticsOut, PublicStatsOut

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsOut)
def get_analytics(
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: User = Depends(require_admin_or_staff),
):
    """Ambil data analitik sistem peminjaman (Khusus Admin/Tendik)."""
    return analytics_service.get_analytics()


@router.get("/public", response_model=PublicStatsOut)
def get_public_stats(
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Ambil data statistik untuk halaman utama (publik)."""
    return analytics_service.get_public_stats()
