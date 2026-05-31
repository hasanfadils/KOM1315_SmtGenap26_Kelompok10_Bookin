from typing import List

from fastapi import UploadFile

from app.config import settings
from app.models.ruangan import Ruangan
from app.schemas.ruangan import RuanganCreate, RuanganUpdate
from app.repositories.ruangan_repository import RuanganRepository
from app.exceptions.handlers import NotFoundException, AppException


class RuanganService:
    def __init__(self, ruangan_repo: RuanganRepository):
        self._ruangan_repo = ruangan_repo

    def get_all(self) -> List[Ruangan]:
        return self._ruangan_repo.get_all()

    def get_by_id(self, ruangan_id: str) -> Ruangan:
        ruangan = self._ruangan_repo.get_by_id(ruangan_id)
        if not ruangan:
            raise NotFoundException("Ruangan", ruangan_id)
        return ruangan

    def create(self, data: RuanganCreate) -> Ruangan:
        ruangan = Ruangan(**data.model_dump())
        self._ruangan_repo.create(ruangan)
        self._ruangan_repo.commit()
        return ruangan

    def update(self, ruangan_id: str, data: RuanganUpdate) -> Ruangan:
        ruangan = self._ruangan_repo.get_by_id(ruangan_id)
        if not ruangan:
            raise NotFoundException("Ruangan", ruangan_id)

        update_data = data.model_dump(exclude_unset=True)
        self._ruangan_repo.update(ruangan, update_data)
        self._ruangan_repo.commit()
        return ruangan

    def delete(self, ruangan_id: str) -> str:
        """Hapus ruangan. Mengembalikan nama ruangan yang dihapus."""
        ruangan = self._ruangan_repo.get_by_id(ruangan_id)
        if not ruangan:
            raise NotFoundException("Ruangan", ruangan_id)

        # Cegah penghapusan jika ruangan memiliki pengajuan/peminjaman aktif
        from app.models.enums import PengajuanStatus
        has_active = any(
            p.status not in [PengajuanStatus.DITOLAK, PengajuanStatus.SELESAI]
            for p in ruangan.pengajuan_list
        )
        if has_active:
            raise AppException(
                "Ruangan tidak dapat dihapus karena memiliki pengajuan/peminjaman aktif. "
                "Silakan batalkan atau selesaikan pengajuan terlebih dahulu, atau ubah status ruangan.",
                400,
            )

        name = str(ruangan.name)
        self._ruangan_repo.delete(ruangan)
        self._ruangan_repo.commit()
        return name

    def upload_image(self, file: UploadFile) -> str:
        """Unggah gambar ke Cloudinary atau fallback ke penyimpanan lokal."""
        if not file.content_type or not file.content_type.startswith("image/"):
            raise AppException("File harus berupa gambar", 400)

        # Jika API key Cloudinary dikonfigurasi, gunakan Cloudinary
        if settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_KEY.strip():
            try:
                import cloudinary
                import cloudinary.uploader

                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True,
                )
                upload_result = cloudinary.uploader.upload(file.file)
                return upload_result.get("secure_url", "")
            except Exception as e:
                raise AppException(f"Gagal mengupload gambar ke Cloudinary: {str(e)}", 500)
        
        # Fallback ke penyimpanan lokal
        try:
            import os
            import uuid
            
            # Buat direktori jika belum ada
            public_dir = os.path.join(settings.UPLOAD_DIR, "public")
            os.makedirs(public_dir, exist_ok=True)
            
            # Generate nama file unik
            ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
            filename = f"{uuid.uuid4()}{ext}"
            file_path = os.path.join(public_dir, filename)
            
            # Tulis file secara lokal
            with open(file_path, "wb") as f:
                f.write(file.file.read())
                
            return f"/uploads/public/{filename}"
        except Exception as e:
            raise AppException(f"Gagal menyimpan gambar secara lokal: {str(e)}", 500)
