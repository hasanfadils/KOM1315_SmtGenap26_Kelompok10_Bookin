from fastapi import APIRouter, Depends

from app.dependencies.auth import require_admin_or_staff
from app.dependencies.services import get_analytics_service
from app.services.analytics_service import AnalyticsService
from app.models.user import User
from app.schemas.analytics import AnalyticsOut

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsOut)
def get_analytics(
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    _: User = Depends(require_admin_or_staff),
):
    """Ambil data analitik sistem peminjaman (Khusus Admin/Tendik)."""
    return analytics_service.get_analytics()
