from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.enums import PengajuanStatus
from app.schemas.dokumen import DokumenOut


class PengajuanCreate(BaseModel):
    ruangan_id: str
    event_name: str
    event_description: str
    date: str        # "YYYY-MM-DD"
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"
    attendees: int


class PengajuanStatusUpdate(BaseModel):
    status: PengajuanStatus


class RejectionPayload(BaseModel):
    reason: str


class PengajuanOut(BaseModel):
    id: str
    ruangan_id: str
    user_id: str
    user_name: str
    event_name: str
    event_description: str
    start_time: datetime
    end_time: datetime
    status: PengajuanStatus
    attendees: int
    queue_position: Optional[int] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    dokumen_list: List[DokumenOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PublicPengajuanOut(BaseModel):
    """Schema publik untuk tampilan jadwal publik."""

    id: str
    ruangan_id: str
    event_name: str
    start_time: datetime
    end_time: datetime
    attendees: int
    status: PengajuanStatus

    model_config = {"from_attributes": True}
