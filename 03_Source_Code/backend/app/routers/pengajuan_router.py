from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException

from app.dependencies.auth import (
    get_current_user,
    require_admin,
    require_tendik,
    require_admin_or_staff,
)
from app.dependencies.services import get_pengajuan_service
from app.services.pengajuan_service import PengajuanService
from app.models.user import User
from app.schemas.pengajuan import PengajuanCreate, PengajuanOut, PublicPengajuanOut, RejectionPayload
from app.schemas.common import MessageResponse
from pydantic import BaseModel

router = APIRouter(prefix="/pengajuan", tags=["Pengajuan"])
bookings_router = APIRouter(prefix="/bookings", tags=["Bookings"])


class StatusUpdatePayload(BaseModel):
    status: str


@router.post("", response_model=PengajuanOut, status_code=201)
@bookings_router.post("", response_model=PengajuanOut, status_code=201)
async def submit(
    ruangan_id: Optional[str] = Form(None),
    facility_id: Optional[str] = Form(None),
    event_name: str = Form(...),
    event_description: str = Form(...),
    date: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    attendees: int = Form(...),
    documents: Optional[List[UploadFile]] = File(None),
    document: Optional[UploadFile] = File(None),
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(get_current_user),
):
    """Mahasiswa mengajukan peminjaman ruangan baru."""
    target_ruangan_id = ruangan_id or facility_id
    if not target_ruangan_id:
        raise HTTPException(
            status_code=422, detail="ruangan_id atau facility_id wajib diisi"
        )

    target_documents = documents or ([document] if document else None)

    data = PengajuanCreate(
        ruangan_id=target_ruangan_id,
        event_name=event_name,
        event_description=event_description,
        date=date,
        start_time=start_time,
        end_time=end_time,
        attendees=attendees,
    )
    return pengajuan_service.submit(current_user, data, target_documents)


@router.get("", response_model=List[PengajuanOut])
@bookings_router.get("", response_model=List[PengajuanOut])
def get_all(
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    _: User = Depends(require_admin_or_staff),
):
    """Ambil semua pengajuan (Khusus Admin/Tendik)."""
    return pengajuan_service.get_all()


@router.get("/me", response_model=List[PengajuanOut])
@bookings_router.get("/me", response_model=List[PengajuanOut])
def get_mine(
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(get_current_user),
):
    """Ambil pengajuan milik user yang sedang login."""
    return pengajuan_service.get_user_pengajuan(str(current_user.id))


@router.get("/public", response_model=List[PublicPengajuanOut])
@bookings_router.get("/public", response_model=List[PublicPengajuanOut])
def get_public(
    ruangan_id: Optional[str] = None,
    facility_id: Optional[str] = None,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
):
    """Ambil jadwal yang sudah disetujui (publik, tanpa autentikasi)."""
    target_ruangan_id = ruangan_id or facility_id
    return pengajuan_service.get_public_schedule(target_ruangan_id)


@router.get("/{pengajuan_id}", response_model=PengajuanOut)
@bookings_router.get("/{pengajuan_id}", response_model=PengajuanOut)
def get_one(
    pengajuan_id: str,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail pengajuan berdasarkan ID."""
    return pengajuan_service.get_by_id(pengajuan_id, current_user)


@router.put("/{pengajuan_id}/verify", response_model=PengajuanOut)
@bookings_router.put("/{pengajuan_id}/verify", response_model=PengajuanOut)
def verify(
    pengajuan_id: str,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(require_tendik),
):
    """Tendik memverifikasi dokumen pengajuan."""
    return pengajuan_service.verify(current_user, pengajuan_id)


@router.put("/{pengajuan_id}/approve", response_model=PengajuanOut)
@bookings_router.put("/{pengajuan_id}/approve", response_model=PengajuanOut)
def approve(
    pengajuan_id: str,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(require_admin),
):
    """Admin memberikan persetujuan final."""
    return pengajuan_service.approve(current_user, pengajuan_id)


@router.put("/{pengajuan_id}/reject", response_model=PengajuanOut)
@bookings_router.put("/{pengajuan_id}/reject", response_model=PengajuanOut)
def reject(
    pengajuan_id: str,
    payload: RejectionPayload,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(require_admin_or_staff),
):
    """Tendik atau Admin menolak pengajuan dengan alasan."""
    return pengajuan_service.reject(current_user, pengajuan_id, payload.reason)


@router.put("/{pengajuan_id}/status", response_model=PengajuanOut)
@bookings_router.put("/{pengajuan_id}/status", response_model=PengajuanOut)
def update_status(
    pengajuan_id: str,
    payload: StatusUpdatePayload,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(require_admin_or_staff),
):
    """Jembatan update status peminjaman dari frontend ke alur persetujuan bertingkat."""
    status_lower = payload.status.lower()

    if status_lower in ["sedang direview", "in_review", "in-review"]:
        return pengajuan_service.verify(current_user, pengajuan_id)
    elif status_lower in ["disetujui", "approved"]:
        return pengajuan_service.approve(current_user, pengajuan_id)
    elif status_lower in ["ditolak", "rejected"]:
        return pengajuan_service.reject(
            current_user, pengajuan_id,
            reason=f"Ditolak oleh {current_user.name} ({current_user.role.value})"
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Status '{payload.status}' tidak didukung untuk alur persetujuan bertingkat"
        )


@router.delete("/{pengajuan_id}", response_model=MessageResponse)
@bookings_router.delete("/{pengajuan_id}", response_model=MessageResponse)
def delete(
    pengajuan_id: str,
    pengajuan_service: PengajuanService = Depends(get_pengajuan_service),
    current_user: User = Depends(get_current_user),
):
    """Hapus pengajuan (pemilik atau admin)."""
    pengajuan_service.delete(pengajuan_id, current_user)
    return MessageResponse(message="Pengajuan berhasil dihapus")
