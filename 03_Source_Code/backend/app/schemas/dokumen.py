from datetime import datetime

from pydantic import BaseModel


class DokumenOut(BaseModel):
    id: str
    pengajuan_id: str
    filename: str
    file_url: str
    file_type: str
    file_size: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}
