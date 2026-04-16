from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from models import UserRole, FacilityType, FacilityStatus, BookingStatus, NotificationType


# ===========================
# USER SCHEMAS
# ===========================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    nim: Optional[str] = None
    role: UserRole = UserRole.student


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    nim: Optional[str] = None
    email: Optional[EmailStr] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    nim: Optional[str] = None
    role: UserRole

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ===========================
# FACILITY SCHEMAS
# ===========================

class FacilityCreate(BaseModel):
    name: str
    type: FacilityType
    status: FacilityStatus = FacilityStatus.AVAILABLE
    capacity: int
    location: str
    description: str
    image_url: str
    features: List[str] = []


class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[FacilityType] = None
    status: Optional[FacilityStatus] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    features: Optional[List[str]] = None


class FacilityOut(BaseModel):
    id: str
    name: str
    type: FacilityType
    status: FacilityStatus
    capacity: int
    location: str
    description: str
    image_url: str
    features: List[str]

    class Config:
        from_attributes = True


# ===========================
# BOOKING SCHEMAS
# ===========================

class BookingCreate(BaseModel):
    facility_id: str
    event_name: str
    event_description: str
    date: str        # "YYYY-MM-DD"
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"
    attendees: int


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingOut(BaseModel):
    id: str
    facility_id: str
    user_id: str
    user_name: str
    event_name: str
    event_description: str
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    attendees: int
    document_url: Optional[str] = None
    created_at: datetime
    queue_position: Optional[int] = None
    estimated_confirmation_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class PublicBookingOut(BaseModel):
    """Schema publik — tanpa info user sensitif, untuk kalender beranda."""
    id: str
    facility_id: str
    event_name: str
    start_time: datetime
    end_time: datetime
    attendees: int
    status: BookingStatus

    class Config:
        from_attributes = True


# ===========================
# NOTIFICATION SCHEMAS
# ===========================

class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    related_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===========================
# ANALYTICS SCHEMAS
# ===========================

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


# ===========================
# GENERIC RESPONSE
# ===========================

class MessageResponse(BaseModel):
    message: str
