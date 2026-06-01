from typing import Optional, List

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    nim: Optional[str] = None
    role: UserRole
    managed_ruangan_ids: Optional[List[str]] = []

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    nim: Optional[str] = None
    email: Optional[EmailStr] = None
    managed_ruangan_ids: Optional[List[str]] = None
