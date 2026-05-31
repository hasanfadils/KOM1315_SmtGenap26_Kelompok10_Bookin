import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class DokumenPengajuan(Base):
    """Model untuk dokumen unggahan yang dilampirkan pada pengajuan."""

    __tablename__ = "dokumen_pengajuan"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pengajuan_id = Column(
        String, ForeignKey("pengajuan.id", ondelete="CASCADE"), nullable=False
    )
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # dalam bytes
    uploaded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relasi
    pengajuan = relationship("Pengajuan", back_populates="dokumen_list")
