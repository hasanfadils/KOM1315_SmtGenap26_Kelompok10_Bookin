"""Konfigurasi database engine, session factory, dan base model."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session

from app.config import settings


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class untuk model SQLAlchemy ORM."""
    pass


def get_db():
    """Dependensi FastAPI untuk sesi database per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
