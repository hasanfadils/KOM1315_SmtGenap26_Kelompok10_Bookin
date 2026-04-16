import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from database import get_db
from auth import get_current_user, require_admin_or_staff
import models
import schemas

router = APIRouter(prefix="/bookings", tags=["Bookings"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ===========================
# DOMAIN HELPERS
# ===========================

def _check_conflict(
    db: Session,
    facility_id: str,
    start: datetime,
    end: datetime,
    exclude_booking_id: Optional[str] = None
) -> bool:
    """Cek apakah ada booking yang konflik waktu untuk fasilitas tertentu."""
    excluded_statuses = [models.BookingStatus.REJECTED, models.BookingStatus.COMPLETED]

    query = db.query(models.Booking).filter(
        models.Booking.facility_id == facility_id,
        models.Booking.status.notin_(excluded_statuses),
        or_(
            and_(models.Booking.start_time <= start, models.Booking.end_time > start),
            and_(models.Booking.start_time < end, models.Booking.end_time >= end),
            and_(models.Booking.start_time >= start, models.Booking.end_time <= end),
        )
    )
    if exclude_booking_id:
        query = query.filter(models.Booking.id != exclude_booking_id)

    return query.first() is not None


def _calculate_queue(booking: models.Booking, pending_bookings: List[models.Booking]) -> dict:
    """Hitung posisi antrian dan estimasi konfirmasi."""
    if booking.status != models.BookingStatus.PENDING:
        return {}

    sorted_pending = sorted(pending_bookings, key=lambda b: b.created_at)
    position = next((i + 1 for i, b in enumerate(sorted_pending) if b.id == booking.id), 0)
    estimated_time = datetime.utcnow() + timedelta(minutes=position * 30)

    return {
        "queue_position": position,
        "estimated_confirmation_date": estimated_time,
    }


# ===========================
# ENDPOINTS
# ===========================

@router.post("", response_model=schemas.BookingOut, status_code=201)
async def create_booking(
    facility_id: str = Form(...),
    event_name: str = Form(...),
    event_description: str = Form(...),
    date: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    attendees: int = Form(...),
    document: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Buat pengajuan peminjaman fasilitas baru."""
    # Validasi fasilitas
    facility = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan")

    if facility.status != models.FacilityStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Fasilitas tidak tersedia, status: {facility.status.value}")

    # Parse dan validasi waktu
    try:
        start_dt = datetime.fromisoformat(f"{date}T{start_time}:00")
        end_dt = datetime.fromisoformat(f"{date}T{end_time}:00")
    except ValueError:
        raise HTTPException(status_code=400, detail="Format tanggal atau waktu salah (gunakan YYYY-MM-DD dan HH:MM)")

    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="Waktu selesai harus setelah waktu mulai")

    if start_dt < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Tidak dapat meminjam untuk waktu yang sudah lewat")

    # Validasi konflik jadwal
    if _check_conflict(db, facility_id, start_dt, end_dt):
        raise HTTPException(status_code=409, detail="Fasilitas sudah dipesan pada jam tersebut")

    # Upload dokumen jika ada
    document_url = None
    if document and document.filename:
        ext = os.path.splitext(document.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            content = await document.read()
            f.write(content)
        document_url = f"/uploads/{filename}"

    # Buat booking
    booking = models.Booking(
        facility_id=facility_id,
        user_id=current_user.id,
        user_name=current_user.name,
        event_name=event_name,
        event_description=event_description,
        start_time=start_dt,
        end_time=end_dt,
        attendees=attendees,
        status=models.BookingStatus.PENDING,
        document_url=document_url,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@router.get("", response_model=List[schemas.BookingOut])
def get_all_bookings(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff)
):
    """Ambil semua booking (Admin/Tendik only)."""
    bookings = db.query(models.Booking).order_by(models.Booking.created_at.desc()).all()
    return bookings


@router.get("/me", response_model=List[schemas.BookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Ambil booking milik user yang sedang login, dengan info antrian."""
    user_bookings = (
        db.query(models.Booking)
        .filter(models.Booking.user_id == current_user.id)
        .order_by(models.Booking.created_at.desc())
        .all()
    )

    # Ambil semua pending untuk kalkulasi antrian
    pending_bookings = (
        db.query(models.Booking)
        .filter(models.Booking.status == models.BookingStatus.PENDING)
        .all()
    )

    result = []
    for booking in user_bookings:
        queue_info = _calculate_queue(booking, pending_bookings)
        # Buat dict dari ORM object dan tambahkan info antrian
        booking_dict = {
            "id": booking.id,
            "facility_id": booking.facility_id,
            "user_id": booking.user_id,
            "user_name": booking.user_name,
            "event_name": booking.event_name,
            "event_description": booking.event_description,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "status": booking.status,
            "attendees": booking.attendees,
            "document_url": booking.document_url,
            "created_at": booking.created_at,
            **queue_info,
        }
        result.append(schemas.BookingOut(**booking_dict))

    return result


@router.get("/public", response_model=List[schemas.PublicBookingOut])
def get_public_bookings(
    facility_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Ambil semua booking yang sudah disetujui (publik, tanpa autentikasi)."""
    query = db.query(models.Booking).filter(
        models.Booking.status == models.BookingStatus.APPROVED
    )
    if facility_id:
        query = query.filter(models.Booking.facility_id == facility_id)

    bookings = query.order_by(models.Booking.start_time.asc()).all()
    return bookings


@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Ambil detail booking berdasarkan ID."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    is_owner = booking.user_id == current_user.id
    is_staff_or_admin = current_user.role in [models.UserRole.admin, models.UserRole.staff]
    if not is_owner and not is_staff_or_admin:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    return booking


@router.put("/{booking_id}/status", response_model=schemas.BookingOut)
def update_booking_status(
    booking_id: str,
    payload: schemas.BookingStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff)
):
    """Update status booking (Admin/Tendik only) — otomatis buat notifikasi."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    old_status = booking.status
    booking.status = payload.status
    db.commit()
    db.refresh(booking)

    # Buat notifikasi jika status berubah
    if old_status != payload.status:
        notification = models.Notification(
            user_id=booking.user_id,
            title=f"Status Peminjaman Berubah: {payload.status.value}",
            message=(
                f"Status pengajuan peminjaman Anda untuk acara \"{booking.event_name}\" "
                f"telah diperbarui menjadi: {payload.status.value}."
            ),
            type=models.NotificationType.BOOKING_STATUS,
            related_id=booking_id,
        )
        db.add(notification)
        db.commit()

    return booking


@router.delete("/{booking_id}", response_model=schemas.MessageResponse)
def delete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Hapus booking (pemilik atau admin)."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")

    is_owner = booking.user_id == current_user.id
    is_admin = current_user.role == models.UserRole.admin
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    db.delete(booking)
    db.commit()
    return {"message": "Booking berhasil dihapus"}
