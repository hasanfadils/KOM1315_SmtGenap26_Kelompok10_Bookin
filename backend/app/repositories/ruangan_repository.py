from typing import Optional
from sqlalchemy.orm import Session

from app.models.ruangan import Ruangan
from app.repositories.base import BaseRepository


class RuanganRepository(BaseRepository[Ruangan]):
    def __init__(self, db: Session):
        super().__init__(Ruangan, db)

    def get_by_id_for_update(self, entity_id: str) -> Optional[Ruangan]:
        return self._db.query(Ruangan).filter(Ruangan.id == entity_id).with_for_update().first()
