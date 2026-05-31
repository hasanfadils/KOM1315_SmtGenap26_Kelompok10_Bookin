from typing import List

from app.models.user import User
from app.models.enums import UserRole
from app.schemas.user import UserUpdate
from app.repositories.user_repository import UserRepository
from app.exceptions.handlers import NotFoundException, ForbiddenException, AppException


class UserService:
    def __init__(self, user_repo: UserRepository):
        self._user_repo = user_repo

    def get_all(self) -> List[User]:
        return self._user_repo.get_all()

    def get_by_id(self, user_id: str, current_user: User) -> User:
        if current_user.id != user_id and current_user.role != UserRole.admin:
            raise ForbiddenException()

        user = self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Pengguna", user_id)
        return user

    def update(self, user_id: str, data: UserUpdate, current_user: User) -> User:
        if current_user.id != user_id and current_user.role != UserRole.admin:
            raise ForbiddenException()

        user = self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Pengguna", user_id)

        update_data = data.model_dump(exclude_unset=True)

        # Validasi keunikan email jika diubah
        if "email" in update_data and update_data["email"] != user.email:
            existing = self._user_repo.get_by_email(update_data["email"])
            if existing:
                raise AppException("Email sudah digunakan", 400)

        self._user_repo.update(user, update_data)
        self._user_repo.commit()
        return user

    def delete(self, user_id: str) -> str:
        """Hapus pengguna. Mengembalikan nama pengguna yang dihapus."""
        user = self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("Pengguna", user_id)

        name = user.name
        self._user_repo.delete(user)
        self._user_repo.commit()
        return name
