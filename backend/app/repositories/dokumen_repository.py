from typing import List

from sqlalchemy.orm import Session

from app.models.dokumen_pengajuan import DokumenPengajuan
from app.repositories.base import BaseRepository


class DokumenRepository(BaseRepository[DokumenPengajuan]):
    def __init__(self, db: Session):
        super().__init__(DokumenPengajuan, db)

    def get_by_pengajuan(self, pengajuan_id: str) -> List[DokumenPengajuan]:
        return (
            self._db.query(DokumenPengajuan)
            .filter(DokumenPengajuan.pengajuan_id == pengajuan_id)
            .all()
        )
