from typing import List

from fastapi import APIRouter, Depends, UploadFile, File

from app.dependencies.auth import require_admin
from app.dependencies.services import get_ruangan_service
from app.services.ruangan_service import RuanganService
from app.models.user import User
from app.schemas.ruangan import RuanganCreate, RuanganUpdate, RuanganOut
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/ruangan", tags=["Ruangan"])
facilities_router = APIRouter(prefix="/facilities", tags=["Facilities"])


@router.post("/upload-image", status_code=201)
@facilities_router.post("/upload-image", status_code=201)
def upload_image(
    file: UploadFile = File(...),
    ruangan_service: RuanganService = Depends(get_ruangan_service),
    _: User = Depends(require_admin),
):
    """Unggah gambar ruangan ke Cloudinary (Khusus Admin)."""
    url = ruangan_service.upload_image(file)
    return {"url": url}


@router.get("", response_model=List[RuanganOut])
@facilities_router.get("", response_model=List[RuanganOut])
def get_all(
    ruangan_service: RuanganService = Depends(get_ruangan_service),
):
    """Ambil semua ruangan (publik)."""
    return ruangan_service.get_all()


@router.get("/{ruangan_id}", response_model=RuanganOut)
@facilities_router.get("/{ruangan_id}", response_model=RuanganOut)
def get_one(
    ruangan_id: str,
    ruangan_service: RuanganService = Depends(get_ruangan_service),
):
    """Ambil detail ruangan berdasarkan ID (publik)."""
    return ruangan_service.get_by_id(ruangan_id)


@router.post("", response_model=RuanganOut, status_code=201)
@facilities_router.post("", response_model=RuanganOut, status_code=201)
def create(
    payload: RuanganCreate,
    ruangan_service: RuanganService = Depends(get_ruangan_service),
    _: User = Depends(require_admin),
):
    """Tambah ruangan baru (Khusus Admin)."""
    return ruangan_service.create(payload)


@router.put("/{ruangan_id}", response_model=RuanganOut)
@facilities_router.put("/{ruangan_id}", response_model=RuanganOut)
def update(
    ruangan_id: str,
    payload: RuanganUpdate,
    ruangan_service: RuanganService = Depends(get_ruangan_service),
    _: User = Depends(require_admin),
):
    """Update ruangan (Khusus Admin)."""
    return ruangan_service.update(ruangan_id, payload)


@router.delete("/{ruangan_id}", response_model=MessageResponse)
@facilities_router.delete("/{ruangan_id}", response_model=MessageResponse)
def delete(
    ruangan_id: str,
    ruangan_service: RuanganService = Depends(get_ruangan_service),
    _: User = Depends(require_admin),
):
    """Hapus ruangan (Khusus Admin)."""
    name = ruangan_service.delete(ruangan_id)
    return MessageResponse(message=f"Ruangan '{name}' berhasil dihapus")
