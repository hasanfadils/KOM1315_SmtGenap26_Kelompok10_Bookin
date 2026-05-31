# TLS IPB  Tools & Lab Sharing

Sistem Peminjaman Fasilitas Kampus IPB University. Aplikasi ini mempermudah mahasiswa, dosen, dan tendik dalam meminjam ruangan (seperti kelas, auditorium, atau laboratorium) serta alat-alat kampus secara terintegrasi.

## Teknologi Utama

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** FastAPI, Python, SQLAlchemy
- **Database:** PostgreSQL

## Cara Menjalankan Aplikasi

### 1. Backend (FastAPI)
Buka terminal di folder `backend/`:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React)
Buka terminal di folder `frontend/`:
```bash
npm install
npm run dev
```

Aplikasi dapat diakses melalui `http://localhost:3000`.
