from typing import List

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.services import get_notification_service
from app.services.notification_service import NotificationService
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/me", response_model=List[NotificationOut])
def get_mine(
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user),
):
    """Ambil semua notifikasi milik user yang sedang login."""
    return notification_service.get_user_notifications(current_user.id)


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user),
):
    """Tandai satu notifikasi sebagai sudah dibaca."""
    return notification_service.mark_as_read(notification_id, current_user.id)


@router.put("/read-all", response_model=MessageResponse)
def mark_all_read(
    notification_service: NotificationService = Depends(get_notification_service),
    current_user: User = Depends(get_current_user),
):
    """Tandai semua notifikasi user sebagai sudah dibaca."""
    notification_service.mark_all_read(current_user.id)
    return MessageResponse(message="Semua notifikasi telah ditandai sebagai dibaca")
