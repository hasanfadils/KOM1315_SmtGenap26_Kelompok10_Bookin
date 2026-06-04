"""Pydantic schemas untuk fitur Laporan Rekapitulasi."""

from typing import List, Dict

from pydantic import BaseModel

from app.schemas.pengajuan import PengajuanOut


class LaporanOut(BaseModel):
    data_peminjaman: List[PengajuanOut]
    ringkasan: Dict[str, Dict[str, float]]

    model_config = {"from_attributes": True}
