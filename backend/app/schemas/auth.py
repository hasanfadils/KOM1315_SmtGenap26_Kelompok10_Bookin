from typing import Optional, List

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole
from app.schemas.user import UserOut


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    nim: Optional[str] = None
    role: UserRole = UserRole.student
    managed_ruangan_ids: Optional[List[str]] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
