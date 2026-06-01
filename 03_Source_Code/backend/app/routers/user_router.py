from typing import List

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user, require_admin
from app.dependencies.services import get_user_service
from app.services.user_service import UserService
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserOut])
def get_all_users(
    user_service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    """Ambil semua pengguna (Khusus Admin)."""
    return user_service.get_all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail pengguna berdasarkan ID (user sendiri atau admin)."""
    return user_service.get_by_id(user_id, current_user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    """Update profil pengguna (user sendiri atau admin)."""
    return user_service.update(user_id, payload, current_user)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    _: User = Depends(require_admin),
):
    """Hapus pengguna (Khusus Admin)."""
    name = user_service.delete(user_id)
    return MessageResponse(message=f"Pengguna '{name}' berhasil dihapus")
