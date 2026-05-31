"""Konfigurasi aplikasi berbasis Pydantic BaseSettings."""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Pengaturan aplikasi yang dimuat dari file .env."""

    # ── Database ──
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ipb_fasilitas"

    # ── JWT ──
    SECRET_KEY: str = "changeme-super-secret-key-ipb-fasilitas"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 jam

    # ── File Upload ──
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # ── Cloudinary ──
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ── CORS ──
    ALLOWED_ORIGINS: str = "*"

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        # Ubah postgres:// ke postgresql:// untuk SQLAlchemy 2.x
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql://", 1)
        # Tambahkan sslmode=require otomatis untuk Neon
        if "neon.tech" in v and "sslmode" not in v:
            separator = "&" if "?" in v else "?"
            v += f"{separator}sslmode=require"
        return v

    model_config = {"env_file": ".env", "extra": "ignore"}


# Instance singleton settings
settings = Settings()
