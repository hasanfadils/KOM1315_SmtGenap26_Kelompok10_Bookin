import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, JSON, Text
)
from sqlalchemy.orm import relationship
from database import Base
import enum


# ===========================
# ENUMS
# ===========================

class UserRole(str, enum.Enum):
    student = "student"
    staff = "staff"
    admin = "admin"


class FacilityType(str, enum.Enum):
    AUDITORIUM = "Auditorium"
    CLASSROOM = "Ruang Kelas"
    FIELD = "Lapangan"
    LABORATORY = "Laboratorium"
    MEETING_ROOM = "Ruang Rapat"


class FacilityStatus(str, enum.Enum):
    AVAILABLE = "Tersedia"
    MAINTENANCE = "Pemeliharaan"
    RENOVATION = "Renovasi"
    CLOSED = "Ditutup Sementara"


class BookingStatus(str, enum.Enum):
    PENDING = "Menunggu Persetujuan"
    IN_REVIEW = "Sedang Direview"
    APPROVED = "Disetujui"
    REJECTED = "Ditolak"
    COMPLETED = "Selesai"


class NotificationType(str, enum.Enum):
    BOOKING_STATUS = "BOOKING_STATUS"
    SYSTEM = "SYSTEM"


# ===========================
# MODELS
# ===========================

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    nim = Column(String, nullable=True)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)

    bookings = relationship("Booking", back_populates="user", foreign_keys="Booking.user_id")
    notifications = relationship("Notification", back_populates="user")


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(SAEnum(FacilityType), nullable=False)
    status = Column(SAEnum(FacilityStatus), nullable=False, default=FacilityStatus.AVAILABLE)
    capacity = Column(Integer, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=False)
    features = Column(JSON, nullable=False, default=list)

    bookings = relationship("Booking", back_populates="facility")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_name = Column(String, nullable=False)
    event_name = Column(String, nullable=False)
    event_description = Column(Text, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(SAEnum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    attendees = Column(Integer, nullable=False)
    document_url = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    facility = relationship("Facility", back_populates="bookings")
    user = relationship("User", back_populates="bookings", foreign_keys=[user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SAEnum(NotificationType), nullable=False)
    related_id = Column(String, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
