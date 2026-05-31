import os
import uuid
from typing import List

from fastapi import UploadFile

from app.config import settings
from app.models.dokumen_pengajuan import DokumenPengajuan
from app.repositories.dokumen_repository import DokumenRepository
from app.exceptions.handlers import AppException


class DokumenService:
    def __init__(self, dokumen_repo: DokumenRepository):
        self._dokumen_repo = dokumen_repo

    def upload_documents(
        self, pengajuan_id: str, files: List[UploadFile]
    ) -> List[DokumenPengajuan]:
        """Unggah beberapa dokumen untuk pengajuan (tanpa melakukan commit)."""
        uploaded: List[DokumenPengajuan] = []
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)

        for file in files:
            if not file.filename:
                continue

            # Validasi ukuran berkas
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)

            max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
            if file_size > max_size:
                raise AppException(
                    f"File '{file.filename}' melebihi batas ukuran "
                    f"{settings.MAX_FILE_SIZE_MB}MB",
                    400,
                )

            ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{ext}"
            file_path = os.path.join(upload_dir, unique_filename)

            with open(file_path, "wb") as f:
                content = file.file.read()
                f.write(content)

            dokumen = DokumenPengajuan(
                pengajuan_id=pengajuan_id,
                filename=file.filename,
                file_url=f"/uploads/{unique_filename}",
                file_type=file.content_type or "application/octet-stream",
                file_size=file_size,
            )
            self._dokumen_repo.create(dokumen)
            uploaded.append(dokumen)

        return uploaded
