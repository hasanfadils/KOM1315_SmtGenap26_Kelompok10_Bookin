import os
import uuid
import random
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models

def seed_data():
    # Buat tabel jika belum ada
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    # Cek apakah fasilitas sudah ada
    existing = db.query(models.Facility).count()
    if existing > 0:
        print(f"Sudah ada {existing} fasilitas di database. Melanjutkan tanpa seeding awal...")
        db.close()
        return

    facilities_data = [
        {
            "name": "Auditorium Andi Hakim Nasoetion (AHN)",
            "type": models.FacilityType.AUDITORIUM,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 800,
            "location": "Gedung Rektorat IPB Dramaga",
            "description": "Auditorium utama IPB yang sering digunakan untuk acara protokoler, wisuda, seminar internasional, dan kuliah umum tingkat universitas.",
            "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Auditorium+AHN",
            "features": ["Sound System Standar Konser", "Panggung Besar", "AC Central", "Kursi VIP", "Proyektor 4K"]
        },
        {
            "name": "Graha Widya Wisuda (GWW)",
            "type": models.FacilityType.AUDITORIUM,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 3000,
            "location": "Kampus IPB Dramaga",
            "description": "Gedung ikonik IPB dengan kapasitas raksasa. Cocok untuk acara skala besar seperti pameran, inaugurasi mahasiswa, hingga konser.",
            "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Gedung+GWW",
            "features": ["Panggung Serbaguna", "Area Pameran", "Tribun", "Parkir Luas"]
        },
        {
            "name": "Ruang Kelas CCR 1.01",
            "type": models.FacilityType.CLASSROOM,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 200,
            "location": "Gedung Common Class Room (CCR)",
            "description": "Ruang kelas modern dengan desain teater yang mendukung pembelajaran interaktif, berlokasi di pusat perkuliahan mahasiswa TPB.",
            "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=CCR+1.01",
            "features": ["Kursi Teater", "AC Sentral", "Whiteboard 3 Sisi", "Sound System Ruangan"]
        },
        {
            "name": "Laboratorium Komputer Ilkom 1",
            "type": models.FacilityType.LABORATORY,
            "status": models.FacilityStatus.MAINTENANCE,
            "capacity": 40,
            "location": "Gedung FMIPA (Ilmu Komputer)",
            "description": "Laboratorium dilengkapi iMac dan PC berspesifikasi tinggi untuk kebutuhan praktikum programming dan rendering grafis.",
            "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=Lab+Ilkom+1",
            "features": ["Komputer High-end", "Jaringan LAN Gigabit", "Proyektor", "Papan Tulis"]
        },
        {
            "name": "Auditorium Fakultas Pertanian (Faperta)",
            "type": models.FacilityType.AUDITORIUM,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 300,
            "location": "Gedung Faperta IPB Dramaga",
            "description": "Ruangan megah di Fakultas Pertanian IPB untuk seminar tesis, rapat dewan dosen, maupun lokakarya.",
            "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Auditorium+Faperta",
            "features": ["Panggung Standar", "Sound System", "Kursi Sofa VIP", "Proyektor Utama"]
        },
        {
            "name": "Ruang Diskusi RK U 2.01",
            "type": models.FacilityType.CLASSROOM,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 80,
            "location": "Ruang Kuliah U (RK U)",
            "description": "Ruangan kelas sedang bergaya klasik IPB dengan dominasi kayu yang sangat ideal untuk diskusi kelompok skala sedang.",
            "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=RK+U+2.01",
            "features": ["Kursi Lipat Tunggal", "Papan Tulis Kayu", "Proyektor VGA/HDMI"]
        },
        {
            "name": "Ruang Rapat Senat Akademik",
            "type": models.FacilityType.MEETING_ROOM,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 50,
            "location": "Gedung Rektorat IPB Lantai 2",
            "description": "Ruang rapat prestise berstandar eksekutif, menggunakan meja melingkar (round table) dengan mic individual di tiap kursi.",
            "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=R.Rapat+Senat",
            "features": ["Mic Individual", "Meja Melingkar VIP", "Full AC", "Smart TV Interaktif"]
        },
        {
            "name": "Gymnasium IPB",
            "type": models.FacilityType.FIELD,
            "status": models.FacilityStatus.RENOVATION,
            "capacity": 1500,
            "location": "Kawasan Olahraga IPB Dramaga",
            "description": "Fasilitas olahraga dalam gedung multi-fungsi (basket, voli, bulutangkis) dan tempat kegiatan kompetisi tingkat provinsi mahasiswa.",
            "image_url": "https://placehold.co/800x600/1e3a8a/ffffff?text=Gymnasium+IPB",
            "features": ["Lapangan Kayu Standar Internasional", "Tribun Penonton", "Kamar Ganti", "Shower Room"]
        },
        {
            "name": "Lapangan Sepakbola IPB",
            "type": models.FacilityType.FIELD,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 2000,
            "location": "Kawasan Olahraga Dekat GWW",
            "description": "Lapangan rumput terbuka seluas lapangan sepakbola standar untuk aktivitas UKM, pertandingan sepakbola, hingga jogging warga IPB.",
            "image_url": "https://placehold.co/800x600/22c55e/ffffff?text=Lapangan+Sepakbola",
            "features": ["Rumput Alami Standar", "Lintasan Lari Tersedia", "Gawang dan Pembatas"]
        },
        {
            "name": "Agribusiness Cyber Room (ACR)",
            "type": models.FacilityType.LABORATORY,
            "status": models.FacilityStatus.AVAILABLE,
            "capacity": 60,
            "location": "Fakultas Ekonomi dan Manajemen (FEM)",
            "description": "Laboratorium mini bergaya cafe khusus untuk riset marketing, simulasi perdagangan efek, serta e-commerce di F.E.M.",
            "image_url": "https://placehold.co/800x600/f3f4f6/1e3a8a?text=Cyber+Room",
            "features": ["Komputer Trading Dual Monitor", "Wifi Prioritas Tinggi", "Coffee Counter"]
        }
    ]

    facilities = []
    for data in facilities_data:
        facility = models.Facility(
            id=str(uuid.uuid4()),
            name=data["name"],
            type=data["type"],
            status=data["status"],
            capacity=data["capacity"],
            location=data["location"],
            description=data["description"],
            image_url=data["image_url"],
            features=data["features"]
        )
        facilities.append(facility)
        db.add(facility)

    try:
        db.commit()
        print("Berhasil memasukkan 10 Fasilitas IPB ke dalam database!")
    except Exception as e:
        db.rollback()
        print(f"Gagal melakukan seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Memulai proses seeding database...")
    seed_data()
