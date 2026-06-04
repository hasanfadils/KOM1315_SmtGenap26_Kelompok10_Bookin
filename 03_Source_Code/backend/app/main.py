"""
Factory aplikasi FastAPI — entry point utama.

Jalankan dengan: python -m uvicorn app.main:app --reload --port 8000
"""

import os
import re
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base
from app.exceptions.handlers import AppException
from app.routers import (
    auth_router,
    user_router,
    ruangan_router,
    pengajuan_router,
    notification_router,
    analytics_router,
    laporan_router,
)
from app.routers.ruangan_router import facilities_router
from app.routers.pengajuan_router import bookings_router

# Impor semua model untuk didaftarkan ke Base.metadata
from app.models import (  # noqa: F401
    User,
    Ruangan,
    Pengajuan,
    DokumenPengajuan,
    Notification,
)

logger = logging.getLogger("uvicorn.error")


# ── Siklus Hidup (Lifespan) ──


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Siklus hidup startup/shutdown aplikasi."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified successfully")
    except Exception as e:
        logger.error(f"⚠️ Failed to create database tables: {e}")
    yield
    logger.info("Shutting down...")


# ── Factory Aplikasi ──

app = FastAPI(
    title="Sistem Peminjaman Fasilitas IPB",
    description=(
        "REST API untuk manajemen peminjaman fasilitas kampus IPB. "
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── Handler Exception Global ──


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Ubah subclass AppException menjadi respons JSON."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


# ── Middleware CORS (Bulletproof Custom CORS) ──

ALLOWED_ORIGINS = [
    "https://tls-ipb.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

@app.middleware("http")
async def custom_cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    
    if request.method == "OPTIONS":
        if origin in ALLOWED_ORIGINS:
            response = Response("OK", status_code=200)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = request.headers.get("access-control-request-headers", "*")
            return response
        return Response("Forbidden", status_code=403)
    
    response = await call_next(request)
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# ── Berkas Statis (Uploads)  ──

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "public"), exist_ok=True)
app.mount("/uploads/public", StaticFiles(directory=os.path.join(settings.UPLOAD_DIR, "public")), name="public_uploads")

from fastapi import Depends
from fastapi.responses import FileResponse
from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.dokumen_pengajuan import DokumenPengajuan
from app.models.enums import UserRole
from app.exceptions.handlers import ForbiddenException, NotFoundException
from sqlalchemy.orm import Session

@app.get("/uploads/{filename}", tags=["Dokumen"])
def get_secure_upload(
    filename: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mengunduh berkas proposal peminjaman secara aman jika pengguna terotentikasi dan memiliki otorisasi."""
    # 1. Cari dokumen di database untuk memverifikasi asosiasi dengan pengajuan
    file_url = f"/uploads/{filename}"
    dokumen = db.query(DokumenPengajuan).filter(DokumenPengajuan.file_url == file_url).first()
    if not dokumen:
        raise NotFoundException("Dokumen", filename)

    # 2. Periksa otorisasi: pemilik pengajuan, tendik (staff), atau admin
    pengajuan = dokumen.pengajuan
    is_owner = pengajuan.user_id == current_user.id
    is_staff = current_user.role in [UserRole.staff, UserRole.admin]

    if not is_owner and not is_staff:
        raise ForbiddenException("Anda tidak berhak mengakses dokumen ini")

    # 3. Kembalikan file secara aman dari server
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise NotFoundException("File fisik", filename)

    return FileResponse(
        file_path,
        media_type=str(dokumen.file_type),
        filename=str(dokumen.filename)
    )


# ── Registrasi Router ──

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(ruangan_router.router)
app.include_router(facilities_router)
app.include_router(pengajuan_router.router)
app.include_router(bookings_router)
app.include_router(notification_router.router)
app.include_router(analytics_router.router)
app.include_router(laporan_router.router)


# ── Endpoint Root ──


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Selamat datang di API Sistem Peminjaman Fasilitas IPB 🏛️",
        "docs": "/docs",
        "version": "2.0.0",
    }


@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "ok"}


@app.get("/health/db", tags=["Root"])
def health_check_db():
    masked_url = re.sub(
        r"://([^:]+):([^@]+)@", r"://\1:***@", settings.DATABASE_URL
    )
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": masked_url}
    except Exception as e:
        return {"status": "error", "database": masked_url, "error": str(e)}
