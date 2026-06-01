from typing import List, Optional

from app.models.notification import Notification
from app.models.enums import NotificationType
from app.repositories.notification_repository import NotificationRepository
from app.exceptions.handlers import NotFoundException, ForbiddenException


class NotificationService:
    def __init__(self, notification_repo: NotificationRepository):
        self._notification_repo = notification_repo

    def get_user_notifications(self, user_id: str) -> List[Notification]:
        return self._notification_repo.get_by_user(user_id)

    def mark_as_read(self, notification_id: str, user_id: str) -> Notification:
        notif = self._notification_repo.get_by_id(notification_id)
        if not notif:
            raise NotFoundException("Notifikasi", notification_id)
        if notif.user_id != user_id:
            raise ForbiddenException()

        notif.is_read = True
        self._notification_repo.commit()
        return notif

    def mark_all_read(self, user_id: str) -> None:
        self._notification_repo.mark_all_read(user_id)
        self._notification_repo.commit()

    def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notif_type: NotificationType,
        related_id: Optional[str] = None,
    ) -> Notification:
        """Buat notifikasi baru (tanpa melakukan commit)."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            related_id=related_id,
        )
        self._notification_repo.create(notification)
        return notification
