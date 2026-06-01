from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.dependencies.services import get_auth_service
from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, TokenOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(
    payload: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Registrasi pengguna baru."""
    user, token = auth_service.register(payload)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(
    payload: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login dan dapatkan JWT token."""
    user, token = auth_service.login(payload.email, payload.password)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Ambil profil pengguna yang sedang login."""
    return current_user
