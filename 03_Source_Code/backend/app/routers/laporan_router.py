"""Router untuk fitur Laporan Rekapitulasi Data Peminjaman (Admin only)."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.laporan import LaporanOut
from app.services.laporan_service import Laporan


router = APIRouter(prefix="/laporan", tags=["Laporan"])


@router.get("/generate", response_model=LaporanOut)
def generate_laporan(
    status: Optional[str] = Query(None, description="Filter berdasarkan status peminjaman"),
    start_date: Optional[date] = Query(None, description="Filter tanggal mulai (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter tanggal selesai (YYYY-MM-DD)"),
    ruangan_id: Optional[str] = Query(None, description="Filter berdasarkan ID ruangan"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Men-generate laporan rekapitulasi data peminjaman beserta ringkasan statusnya.
    Khusus untuk Administrator.
    """
    laporan = Laporan()
    return laporan.generate(
        db=db,
        status=status,
        start_date=start_date,
        end_date=end_date,
        ruangan_id=ruangan_id,
    )
