import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import PengajuanStatus


class Pengajuan(Base):
    """
    Model untuk pengajuan peminjaman ruangan dengan alur persetujuan bertingkat.
    """

    __tablename__ = "pengajuan"

    id: str = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ruangan_id: str = Column(String, ForeignKey("ruangan.id", ondelete="RESTRICT"), nullable=False, index=True)
    user_id: str = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Denormalisasi untuk performa baca (menghindari JOIN)
    user_name: str = Column(String, nullable=False)

    event_name: str = Column(String, nullable=False)
    event_description: str = Column(Text, nullable=False)
    start_time: datetime = Column(DateTime(timezone=True), nullable=False)
    end_time: datetime = Column(DateTime(timezone=True), nullable=False)
    attendees: int = Column(Integer, nullable=False)

    status: PengajuanStatus = Column(
        SAEnum(PengajuanStatus),
        nullable=False,
        default=PengajuanStatus.MENUNGGU_VERIFIKASI,
        index=True,
    )
    queue_position: Optional[int] = Column(Integer, nullable=True)

    # ── Audit trail persetujuan bertingkat ──
    verified_by: Optional[str] = Column(String, ForeignKey("users.id"), nullable=True)
    verified_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True)
    approved_by: Optional[str] = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True)
    rejection_reason: Optional[str] = Column(Text, nullable=True)

    created_at: datetime = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relasi ──
    ruangan = relationship("Ruangan", back_populates="pengajuan_list")
    user = relationship(
        "User", back_populates="pengajuan_list", foreign_keys=[user_id]
    )
    verifier = relationship("User", foreign_keys=[verified_by])
    approver = relationship("User", foreign_keys=[approved_by])
    dokumen_list = relationship(
        "DokumenPengajuan",
        back_populates="pengajuan",
        cascade="all, delete-orphan",
        lazy="selectin",  # Load otomatis dokumen saat pengajuan di-query
    )
