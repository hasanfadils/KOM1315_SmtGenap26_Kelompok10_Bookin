import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from database import engine, Base
import models  # noqa: F401 — ini memastikan semua model terdaftar ke Base

from routers import auth_router, user_router, facility_router, booking_router, notification_router, analytics_router

load_dotenv()

logger = logging.getLogger("uvicorn.error")


# ===========================
# LIFESPAN: INISIALISASI DB SAAT STARTUP
# ===========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: coba buat tabel database
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"⚠️ Failed to create database tables: {e}")
        logger.error("App will start but database operations may fail")
    yield
    # Shutdown: cleanup jika diperlukan
    logger.info("Shutting down...")


# ===========================
# FASTAPI APP
# ===========================
app = FastAPI(
    title="Sistem Peminjaman Fasilitas IPB",
    description=(
        "REST API untuk manajemen peminjaman fasilitas kampus IPB. "
        "Menggantikan Firebase Firestore dengan PostgreSQL + FastAPI."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ===========================
# CORS MIDDLEWARE
# ===========================
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# STATIC FILES (UPLOADS)
# ===========================
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ===========================
# REGISTER ROUTERS
# ===========================
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(facility_router.router)
app.include_router(booking_router.router)
app.include_router(notification_router.router)
app.include_router(analytics_router.router)


# ===========================
# ROOT ENDPOINT
# ===========================
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Selamat datang di API Sistem Peminjaman Fasilitas IPB 🏛️",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "ok"}
