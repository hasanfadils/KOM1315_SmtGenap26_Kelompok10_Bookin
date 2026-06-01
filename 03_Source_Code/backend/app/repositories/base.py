"""
Repositori base generik untuk operasi CRUD dasar (OOP).
"""

from typing import TypeVar, Generic, Type, Optional, List

from sqlalchemy.orm import Session

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Repositori generik dengan operasi CRUD umum."""

    def __init__(self, model: Type[T], db: Session):
        self._model = model
        self._db = db

    @property
    def session(self) -> Session:
        """Ekspos sesi database untuk query kompleks."""
        return self._db

    def get_by_id(self, entity_id: str) -> Optional[T]:
        return self._db.query(self._model).filter(self._model.id == entity_id).first()

    def get_all(self) -> List[T]:
        return self._db.query(self._model).all()

    def create(self, entity: T) -> T:
        self._db.add(entity)
        self._db.flush()  # Flush untuk mendapatkan ID tanpa commit
        self._db.refresh(entity)
        return entity

    def update(self, entity: T, data: dict) -> T:
        for key, value in data.items():
            setattr(entity, key, value)
        self._db.flush()
        return entity

    def delete(self, entity: T) -> None:
        self._db.delete(entity)

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()
