"""
Seed script untuk mengisi data ruangan/fasilitas IPB.
Jalankan dari backend/: python -m scripts.seed_ruangan
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Ruangan, RuanganType, RuanganStatus

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Cek apakah ruangan sudah ada
existing = db.query(Ruangan).count()
if existing > 0:
    print(f"Sudah ada {existing} ruangan di database. Melewati seeding.")
    db.close()
    sys.exit(0)

ruangan_data = [
    {
        "name": "Auditorium Andi Hakim Nasoetion (AHN)",
        "type": RuanganType.AUDITORIUM,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 800,
        "location": "Gedung Rektorat IPB Dramaga",
        "description": "Auditorium utama IPB yang sering digunakan untuk acara protokoler, wisuda, seminar internasional, dan kuliah umum tingkat universitas.",
        "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Auditorium+AHN",
        "features": ["Sound System Standar Konser", "Panggung Besar", "AC Central", "Kursi VIP", "Proyektor 4K"],
    },
    {
        "name": "Graha Widya Wisuda (GWW)",
        "type": RuanganType.AUDITORIUM,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 3000,
        "location": "Kampus IPB Dramaga",
        "description": "Gedung ikonik IPB dengan kapasitas raksasa. Cocok untuk acara skala besar seperti pameran, inaugurasi mahasiswa, hingga konser.",
        "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Gedung+GWW",
        "features": ["Panggung Serbaguna", "Area Pameran", "Tribun", "Parkir Luas"],
    },
    {
        "name": "Ruang Kelas CCR 1.01",
        "type": RuanganType.CLASSROOM,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 200,
        "location": "Gedung Common Class Room (CCR)",
        "description": "Ruang kelas modern dengan desain teater yang mendukung pembelajaran interaktif, berlokasi di pusat perkuliahan mahasiswa TPB.",
        "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=CCR+1.01",
        "features": ["Kursi Teater", "AC Sentral", "Whiteboard 3 Sisi", "Sound System Ruangan"],
    },
    {
        "name": "Laboratorium Komputer Ilkom 1",
        "type": RuanganType.LABORATORY,
        "status": RuanganStatus.MAINTENANCE,
        "capacity": 40,
        "location": "Gedung FMIPA (Ilmu Komputer)",
        "description": "Laboratorium dilengkapi iMac dan PC berspesifikasi tinggi untuk kebutuhan praktikum programming dan rendering grafis.",
        "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=Lab+Ilkom+1",
        "features": ["Komputer High-end", "Jaringan LAN Gigabit", "Proyektor", "Papan Tulis"],
    },
    {
        "name": "Auditorium Fakultas Pertanian (Faperta)",
        "type": RuanganType.AUDITORIUM,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 300,
        "location": "Gedung Faperta IPB Dramaga",
        "description": "Ruangan megah di Fakultas Pertanian IPB untuk seminar tesis, rapat dewan dosen, maupun lokakarya.",
        "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Auditorium+Faperta",
        "features": ["Panggung Standar", "Sound System", "Kursi Sofa VIP", "Proyektor Utama"],
    },
    {
        "name": "Ruang Diskusi RK U 2.01",
        "type": RuanganType.CLASSROOM,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 80,
        "location": "Ruang Kuliah U (RK U)",
        "description": "Ruangan kelas sedang bergaya klasik IPB dengan dominasi kayu yang sangat ideal untuk diskusi kelompok skala sedang.",
        "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=RK+U+2.01",
        "features": ["Kursi Lipat Tunggal", "Papan Tulis Kayu", "Proyektor VGA/HDMI"],
    },
    {
        "name": "Ruang Rapat Senat Akademik",
        "type": RuanganType.MEETING_ROOM,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 50,
        "location": "Gedung Rektorat IPB Lantai 2",
        "description": "Ruang rapat prestise berstandar eksekutif, menggunakan meja melingkar (round table) dengan mic individual di tiap kursi.",
        "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=R.Rapat+Senat",
        "features": ["Mic Individual", "Meja Melingkar VIP", "Full AC", "Smart TV Interaktif"],
    },
    {
        "name": "Gymnasium IPB",
        "type": RuanganType.FIELD,
        "status": RuanganStatus.RENOVATION,
        "capacity": 1500,
        "location": "Kawasan Olahraga IPB Dramaga",
        "description": "Fasilitas olahraga dalam gedung multi-fungsi (basket, voli, bulutangkis) dan tempat kegiatan kompetisi tingkat provinsi mahasiswa.",
        "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Gymnasium+IPB",
        "features": ["Lapangan Kayu Standar Internasional", "Tribun Penonton", "Kamar Ganti", "Shower Room"],
    },
    {
        "name": "Lapangan Sepakbola IPB",
        "type": RuanganType.FIELD,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 2000,
        "location": "Kawasan Olahraga Dekat GWW",
        "description": "Lapangan rumput terbuka seluas lapangan sepakbola standar untuk aktivitas UKM, pertandingan sepakbola, hingga jogging warga IPB.",
        "image_url": "https://placehold.co/800x600/22c55e/ffffff?text=Lapangan+Sepakbola",
        "features": ["Rumput Alami Standar", "Lintasan Lari Tersedia", "Gawang dan Pembatas"],
    },
    {
        "name": "Agribusiness Cyber Room (ACR)",
        "type": RuanganType.LABORATORY,
        "status": RuanganStatus.AVAILABLE,
        "capacity": 60,
        "location": "Fakultas Ekonomi dan Manajemen (FEM)",
        "description": "Laboratorium mini bergaya cafe khusus untuk riset marketing, simulasi perdagangan efek, serta e-commerce di F.E.M.",
        "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=Cyber+Room",
        "features": ["Komputer Trading Dual Monitor", "Wifi Prioritas Tinggi", "Coffee Counter"],
    },
]

print("Memulai proses seeding ruangan...")

for data in ruangan_data:
    ruangan = Ruangan(id=str(uuid.uuid4()), **data)
    db.add(ruangan)

try:
    db.commit()
    print(f"[OK] Berhasil memasukkan {len(ruangan_data)} ruangan ke database!")
except Exception as e:
    db.rollback()
    print(f"[FAIL] Gagal melakukan seeding: {e}")
finally:
    db.close()
