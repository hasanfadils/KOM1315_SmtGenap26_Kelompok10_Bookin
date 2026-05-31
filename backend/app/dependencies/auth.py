"""Dependensi autentikasi untuk FastAPI."""

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.exceptions.handlers import UnauthorizedException, ForbiddenException

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validasi token JWT, kembalikan user saat ini."""
    payload = AuthService.decode_token(credentials.credentials)
    user_id: str = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token tidak valid")

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("Pengguna tidak ditemukan")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Wajib role Admin."""
    if current_user.role != UserRole.admin:
        raise ForbiddenException("Hanya Admin yang diizinkan")
    return current_user


def require_tendik(current_user: User = Depends(get_current_user)) -> User:
    """Wajib role Tendik."""
    if current_user.role != UserRole.staff:
        raise ForbiddenException("Hanya Tendik yang diizinkan")
    return current_user


def require_admin_or_staff(
    current_user: User = Depends(get_current_user),
) -> User:
    """Wajib role Admin atau Tendik."""
    if current_user.role not in [UserRole.admin, UserRole.staff]:
        raise ForbiddenException("Hanya Admin atau Tendik yang diizinkan")
    return current_user
