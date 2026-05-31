import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    nim = Column(String, nullable=True)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    managed_ruangan_ids = Column(JSON, nullable=True, default=list)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relasi
    pengajuan_list = relationship(
        "Pengajuan", back_populates="user", foreign_keys="Pengajuan.user_id"
    )
    notifications = relationship("Notification", back_populates="user")
