"""Dependensi service factory untuk FastAPI."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import (
    UserRepository,
    RuanganRepository,
    PengajuanRepository,
    DokumenRepository,
    NotificationRepository,
)
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.ruangan_service import RuanganService
from app.services.pengajuan_service import PengajuanService
from app.services.notification_service import NotificationService
from app.services.dokumen_service import DokumenService
from app.services.analytics_service import AnalyticsService


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


def get_ruangan_service(db: Session = Depends(get_db)) -> RuanganService:
    return RuanganService(RuanganRepository(db))


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(NotificationRepository(db))


def get_dokumen_service(db: Session = Depends(get_db)) -> DokumenService:
    return DokumenService(DokumenRepository(db))


def get_pengajuan_service(db: Session = Depends(get_db)) -> PengajuanService:
    return PengajuanService(
        pengajuan_repo=PengajuanRepository(db),
        ruangan_repo=RuanganRepository(db),
        notification_service=NotificationService(NotificationRepository(db)),
        dokumen_service=DokumenService(DokumenRepository(db)),
    )


def get_analytics_service(db: Session = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(
        pengajuan_repo=PengajuanRepository(db),
        ruangan_repo=RuanganRepository(db),
    )
