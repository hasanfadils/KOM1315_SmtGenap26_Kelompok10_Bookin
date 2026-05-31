from typing import Optional, List

from pydantic import BaseModel

from app.models.enums import RuanganType, RuanganStatus


class RuanganCreate(BaseModel):
    name: str
    type: RuanganType
    status: RuanganStatus = RuanganStatus.AVAILABLE
    capacity: int
    location: str
    description: str
    image_url: str
    features: List[str] = []


class RuanganUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[RuanganType] = None
    status: Optional[RuanganStatus] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    features: Optional[List[str]] = None


class RuanganOut(BaseModel):
    id: str
    name: str
    type: RuanganType
    status: RuanganStatus
    capacity: int
    location: str
    description: str
    image_url: str
    features: List[str]

    model_config = {"from_attributes": True}
