import uuid

from sqlalchemy import Column, String, Integer, Text, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import RuanganType, RuanganStatus


class Ruangan(Base):
    __tablename__ = "ruangan"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(SAEnum(RuanganType), nullable=False)
    status = Column(
        SAEnum(RuanganStatus), nullable=False, default=RuanganStatus.AVAILABLE
    )
    capacity = Column(Integer, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=False)
    features = Column(JSON, nullable=False, default=list)

    # Relasi
    pengajuan_list = relationship("Pengajuan", back_populates="ruangan")
