import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_admin
import models
import schemas

router = APIRouter(prefix="/facilities", tags=["Facilities"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


@router.post("/upload-image", status_code=201)
def upload_facility_image(
    file: UploadFile = File(...),
    _: models.User = Depends(require_admin)
):
    """Upload gambar fasilitas (Admin only)."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/{UPLOAD_DIR}/{filename}"}


@router.get("", response_model=List[schemas.FacilityOut])
def get_all_facilities(db: Session = Depends(get_db)):
    """Ambil semua fasilitas (publik)."""
    return db.query(models.Facility).all()


@router.get("/{facility_id}", response_model=schemas.FacilityOut)
def get_facility(facility_id: str, db: Session = Depends(get_db)):
    """Ambil detail fasilitas berdasarkan ID (publik)."""
    facility = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")
    return facility


@router.post("", response_model=schemas.FacilityOut, status_code=201)
def create_facility(
    payload: schemas.FacilityCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    """Tambah fasilitas baru (Admin only)."""
    facility = models.Facility(**payload.model_dump())
    db.add(facility)
    db.commit()
    db.refresh(facility)
    return facility


@router.put("/{facility_id}", response_model=schemas.FacilityOut)
def update_facility(
    facility_id: str,
    payload: schemas.FacilityUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    """Update fasilitas (Admin only)."""
    facility = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(facility, key, value)

    db.commit()
    db.refresh(facility)
    return facility


@router.delete("/{facility_id}", response_model=schemas.MessageResponse)
def delete_facility(
    facility_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin)
):
    """Hapus fasilitas (Admin only)."""
    facility = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    db.delete(facility)
    db.commit()
    return {"message": f"Fasilitas '{facility.name}' berhasil dihapus"}
