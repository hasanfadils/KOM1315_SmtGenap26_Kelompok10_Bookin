import sys
import os
import random
from datetime import datetime, timedelta

# Add backend/ to path so app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, Ruangan, Pengajuan
from app.models.enums import PengajuanStatus
from app.services.auth_service import AuthService

db = SessionLocal()

print("=" * 50)
print("  Membuat 10 Mahasiswa Dummy")
print("=" * 50)

students = []
for i in range(1, 11):
    email = f"mahasiswa{i}@apps.ipb.ac.id"
    nim = f"G641900{i:02d}"
    name = f"Mahasiswa Dummy {i}"
    
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"[SKIP] {email} sudah ada.")
        students.append(existing)
        continue
    
    user = User(
        name=name,
        email=email,
        password_hash=AuthService.hash_password("password123"),
        nim=nim,
        role=UserRole.student
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    students.append(user)
    print(f"[OK] Dibuat: {name} ({email})")

print("=" * 50)
print("  Membuat 10 Peminjaman Dummy")
print("=" * 50)

rooms = db.query(Ruangan).all()

if not rooms:
    print("Ruangan kosong! Harap jalankan seed_ruangan.py terlebih dahulu.")
else:
    event_names = [
        "Rapat BEM Fakultas",
        "Latihan Paduan Suara",
        "Kuliah Pengganti",
        "Seminar Nasional Teknologi",
        "Workshop Pemrograman",
        "Kajian Rutin",
        "Lomba Debat Bahasa Inggris",
        "Persiapan Wisuda",
        "Gladi Resik",
        "Rapat Himpunan"
    ]
    
    # Menghapus dummy peminjaman jika diperlukan (kita akan biarkan saja biar tambah banyak jika di-run ulang, atau tidak usah dihapus)
    
    for i in range(10):
        student = random.choice(students)
        room = random.choice(rooms)
        event_name = event_names[i % len(event_names)]
        
        # Random start time in the next 14 days
        days_ahead = random.randint(1, 14)
        hour = random.randint(8, 16)
        start_time = datetime.now().replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)
        end_time = start_time + timedelta(hours=random.randint(1, 4))
        
        # Random status
        status = random.choice([
            PengajuanStatus.MENUNGGU_VERIFIKASI,
            PengajuanStatus.MENUNGGU_VERIFIKASI,
            PengajuanStatus.DIVERIFIKASI_TENDIK,
            PengajuanStatus.DISETUJUI,
            PengajuanStatus.DITOLAK,
            PengajuanStatus.SELESAI
        ])
        
        pengajuan = Pengajuan(
            ruangan_id=room.id,
            user_id=student.id,
            user_name=student.name,
            event_name=f"{event_name} - {i+1}",
            event_description=f"Deskripsi acara {event_name} oleh {student.name}",
            start_time=start_time,
            end_time=end_time,
            status=status,
            attendees=random.randint(20, 200),
            dokumen_list=[]
        )
        
        admin = db.query(User).filter(User.role == UserRole.admin).first()
        admin_id = admin.id if admin else None

        if status in [PengajuanStatus.DISETUJUI, PengajuanStatus.SELESAI]:
            pengajuan.approved_by = admin_id
            pengajuan.approved_at = datetime.now()
        elif status == PengajuanStatus.DITOLAK:
            pengajuan.rejection_reason = "Jadwal bentrok dengan acara lain"
            
        db.add(pengajuan)
        
    db.commit()
    print("[OK] 10 Peminjaman Dummy berhasil dibuat!")

print("=" * 50)
print("Selesai.")
db.close()
