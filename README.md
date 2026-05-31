# TLS IPB (Tools & Lab Sharing)

Sistem informasi manajemen peminjaman fasilitas dan laboratorium di lingkungan kampus IPB University. Aplikasi ini mempermudah mahasiswa dalam mengajukan peminjaman aset kampus, serta membantu tenaga kependidikan (Tendik) dan Admin dalam mengelola persetujuan secara efisien.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (via CDN)
- **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic, Python-Jose (JWT)
- **Database:** PostgreSQL (Supabase / Neon / Lokal)
- **Hosting/Penyimpanan Gambar:** Cloudinary & Local File System Fallback

## ✨ Fitur Utama

- **Peminjaman Fasilitas:** Pengajuan peminjaman ruangan dengan multi-dokumen pendukung.
- **Manajemen Persetujuan:** Alur persetujuan terintegrasi untuk Admin dan Tendik dengan verifikasi bertahap.
- **Analitik & Statistik:** Dashboard pemantauan statistik peminjaman aktif dan metrik layanan secara real-time.
- **Notifikasi Sistem:** Notifikasi langsung untuk setiap perubahan status pengajuan peminjaman.
- **Keamanan Dokumen:** Penyimpanan surat pengantar dan dokumen peminjaman yang aman.

---

## 🚀 Panduan Memulai Cepat (Lokal)

### 🐍 1. Setup Backend (FastAPI)

1. Masuk ke direktori backend dan buat virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # Aktivasi venv:
   # Windows (CMD): venv\Scripts\activate
   # Windows (PowerShell): venv\Scripts\Activate.ps1
   # macOS/Linux: source venv/bin/activate
   ```

2. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```

3. Konfigurasi environtment variables:
   Salin `.env.example` menjadi `.env` lalu sesuaikan kredensial PostgreSQL dan JWT:
   ```bash
   copy .env.example .env
   ```

4. Jalankan database seeder (opsional untuk data awal):
   ```bash
   python scripts/recreate_tables.py
   python scripts/seed_users.py
   python scripts/seed_ruangan.py
   ```

5. Jalankan server backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Dokumentasi API interaktif dapat diakses pada [http://localhost:8000/docs](http://localhost:8000/docs).

### ⚛️ 2. Setup Frontend (React)

1. Masuk ke direktori frontend dan install dependensi:
   ```bash
   cd frontend
   npm install
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```
   Aplikasi frontend dapat diakses pada [http://localhost:5173](http://localhost:5173) (atau port default Vite lainnya).

---

## 🔑 Akun Default (Seeder)

Setelah menjalankan seeder, akun berikut siap digunakan untuk pengujian:

- **Administrator:** `admin@ipb.ac.id` (Password: `admin123`)
- **Tendik / Staff:** `tendik@ipb.ac.id` (Password: `tendik123`)
- **Mahasiswa (Student):** Silakan buat akun baru secara langsung melalui halaman registrasi.
