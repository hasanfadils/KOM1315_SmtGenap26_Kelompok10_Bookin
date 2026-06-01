"""
Layanan autentikasi — pendaftaran, login, hashing password, dan token JWT.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import bcrypt
from jose import JWTError, jwt

from app.config import settings
from app.models.user import User
from app.schemas.auth import UserRegister
from app.repositories.user_repository import UserRepository
from app.exceptions.handlers import AppException, UnauthorizedException


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self._user_repo = user_repo

    # ── Metode utilitas statis ──

    @staticmethod
    def hash_password(plain: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

    @staticmethod
    def create_access_token(
        data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            return jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
        except JWTError:
            raise UnauthorizedException("Token tidak valid atau sudah kedaluwarsa")

    # ── Logika bisnis ──

    def register(self, data: UserRegister) -> Tuple[User, str]:
        """Daftarkan pengguna baru. Mengembalikan (user, access_token)."""
        if self._user_repo.get_by_email(data.email):
            raise AppException("Email sudah terdaftar", 400)

        user = User(
            name=data.name,
            email=data.email,
            password_hash=self.hash_password(data.password),
            nim=data.nim,
            role=data.role,
            managed_ruangan_ids=data.managed_ruangan_ids,
        )
        self._user_repo.create(user)
        self._user_repo.commit()

        token = self.create_access_token({"sub": user.id})
        return user, token

    def login(self, email: str, password: str) -> Tuple[User, str]:
        """Autentikasi pengguna. Mengembalikan (user, access_token)."""
        user = self._user_repo.get_by_email(email)
        if not user or not self.verify_password(password, user.password_hash):
            raise UnauthorizedException("Email atau password salah")

        token = self.create_access_token({"sub": user.id})
        return user, token
