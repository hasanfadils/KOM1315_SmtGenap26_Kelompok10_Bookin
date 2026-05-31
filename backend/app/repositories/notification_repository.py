from typing import List

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def get_by_user(self, user_id: str) -> List[Notification]:
        return (
            self._db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .all()
        )

    def mark_all_read(self, user_id: str) -> int:
        """Tandai semua notifikasi pengguna sebagai terbaca. Mengembalikan jumlah data terupdate."""
        updated = (
            self._db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .update({"is_read": True})
        )
        return updated
