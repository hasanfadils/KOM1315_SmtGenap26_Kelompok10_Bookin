from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin_or_staff
import models
import schemas

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=schemas.AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin_or_staff)
):
    """Ambil data analitik sistem peminjaman (Admin/Tendik only)."""
    bookings = db.query(models.Booking).all()
    facilities = db.query(models.Facility).all()

    facilities_map = {f.id: f.name for f in facilities}

    # ---- Jam Sibuk (24 jam) ----
    hours_count = [0] * 24
    for b in bookings:
        hours_count[b.start_time.hour] += 1

    busy_hours = [
        schemas.BusyHour(hour=f"{i:02d}:00", count=hours_count[i])
        for i in range(24)
    ]

    # ---- Fasilitas Populer ----
    facility_count: dict[str, int] = {}
    for b in bookings:
        facility_count[b.facility_id] = facility_count.get(b.facility_id, 0) + 1

    total_bookings = len(bookings)
    popular_facilities = sorted(
        [
            schemas.PopularFacility(
                name=facilities_map.get(fid, fid),
                count=cnt,
                percentage=round((cnt / total_bookings) * 100) if total_bookings > 0 else 0,
            )
            for fid, cnt in facility_count.items()
        ],
        key=lambda x: x.count,
        reverse=True,
    )[:5]

    # ---- Service Health ----
    active_requests = sum(1 for b in bookings if b.status == models.BookingStatus.PENDING)
    approved = sum(
        1 for b in bookings
        if b.status in [models.BookingStatus.APPROVED, models.BookingStatus.COMPLETED]
    )
    rejected = sum(1 for b in bookings if b.status == models.BookingStatus.REJECTED)
    total_processed = approved + rejected

    approval_rate = round((approved / total_processed) * 100) if total_processed > 0 else 0
    cancellation_rate = round((rejected / total_bookings) * 100) if total_bookings > 0 else 0

    # ---- Estimasi Rata-rata Waktu Tunggu ----
    pending_bookings = [b for b in bookings if b.status == models.BookingStatus.PENDING]
    if pending_bookings:
        wait_times = [
            15 + (i + 1) * 5 + min(b.attendees / 50, 2) * 5
            for i, b in enumerate(pending_bookings)
        ]
        avg_wait = round(sum(wait_times) / len(wait_times))
    else:
        avg_wait = 15

    return schemas.AnalyticsOut(
        busy_hours=busy_hours,
        popular_facilities=popular_facilities,
        service_health=schemas.ServiceHealth(
            active_requests=active_requests,
            approval_rate=approval_rate,
            average_wait_time_minutes=avg_wait,
            cancellation_rate=cancellation_rate,
        ),
    )
