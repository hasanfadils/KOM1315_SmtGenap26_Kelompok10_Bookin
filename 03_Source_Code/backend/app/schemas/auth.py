from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

from app.schemas.user import UserOut


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    nim: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Nama tidak boleh kosong")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
