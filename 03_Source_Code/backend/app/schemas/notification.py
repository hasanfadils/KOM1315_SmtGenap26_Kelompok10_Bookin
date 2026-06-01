from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import NotificationType


class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    related_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
