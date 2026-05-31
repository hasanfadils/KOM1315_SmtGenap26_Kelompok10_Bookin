
# 🏛️ TLS IPB — Tools & Lab Sharing

**Sistem Peminjaman Fasilitas Kampus IPB University**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Prasyarat (Prerequisites)](#-prasyarat-prerequisites)
- [Instalasi & Menjalankan Secara Lokal](#-instalasi--menjalankan-secara-lokal)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Setup Backend (FastAPI + PostgreSQL)](#2-setup-backend-fastapi--postgresql)
  - [3. Setup Frontend (React + Vite)](#3-setup-frontend-react--vite)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Akun Default](#-akun-default)
- [Struktur Proyek](#-struktur-proyek)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)

---

## 📖 Tentang Proyek

**TLS IPB (Tools & Lab Sharing)** adalah sistem manajemen peminjaman fasilitas kampus IPB berbasis web. Aplikasi ini memungkinkan mahasiswa untuk mengajukan peminjaman fasilitas seperti auditorium, ruang kelas, laboratorium, ruang rapat, dan lapangan olahraga. Tendik (tenaga kependidikan) dan admin dapat mengelola serta menyetujui permintaan peminjaman.

### Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔐 **Autentikasi** | Register/Login dengan JWT token (role-based: Student, Staff/Tendik, Admin) |
| 🏢 **Manajemen Fasilitas** | CRUD fasilitas kampus dengan upload gambar |
| 📅 **Booking System** | Peminjaman fasilitas dengan validasi konflik jadwal & antrian |
| 🔔 **Notifikasi** | Sistem notifikasi real-time untuk status peminjaman |
| 📊 **Dashboard & Analytics** | Dashboard analytics untuk Admin dan Tendik |
| 👤 **Manajemen User** | Pengelolaan akun pengguna oleh Admin |

---

## 🛠 Arsitektur & Tech Stack

```
┌───────────────────────────────────────────────────────┐
│                     Frontend                          │
│  React 19 · TypeScript · Vite · TailwindCSS (CDN)    │
│  React Router · Recharts · Lucide Icons · Sonner      │
│  Port: 3000                                           │
└──────────────────┬────────────────────────────────────┘
                   │  HTTP REST API
                   ▼
┌───────────────────────────────────────────────────────┐
│                     Backend                           │
│  FastAPI · SQLAlchemy · Pydantic · JWT (python-jose)  │
│  Port: 8000                                           │
└──────────────────┬────────────────────────────────────┘
                   │  SQL
                   ▼
┌───────────────────────────────────────────────────────┐
│                    Database                           │
│  PostgreSQL · Port: 5432                              │
│  Database: ipb_fasilitas                              │
└───────────────────────────────────────────────────────┘
```

---

## ✅ Prasyarat (Prerequisites)

Pastikan software berikut sudah terinstal di komputer kamu:

| Software | Versi Minimum | Link Download |
|---|---|---|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | v9+ | *(sudah termasuk dalam Node.js)* |
| **Python** | 3.10+ | [python.org](https://www.python.org/downloads/) |
| **PostgreSQL** | 14+ | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com/) |

### Verifikasi Instalasi

Jalankan perintah berikut di terminal untuk memastikan semua sudah terinstal:

```bash
node --version      # Contoh output: v20.x.x
npm --version       # Contoh output: 10.x.x
python --version    # Contoh output: Python 3.12.x
psql --version      # Contoh output: psql (PostgreSQL) 16.x
git --version       # Contoh output: git version 2.x.x
```

> **📝 Catatan untuk Windows:** Pastikan Python dan PostgreSQL sudah ditambahkan ke **System PATH** saat proses instalasi.

---

## 🚀 Instalasi & Menjalankan Secara Lokal

### 1. Clone Repository

```bash
git clone https://github.com/<username>/ADS_Kelompok12_.git
cd ADS_Kelompok12_
```

---

### 2. Setup Backend (FastAPI + PostgreSQL)

#### 2a. Buat Database PostgreSQL

Buka terminal/command prompt dan jalankan:

```bash
# Masuk ke PostgreSQL CLI
psql -U postgres
```

Lalu jalankan SQL berikut di dalam `psql`:

```sql
CREATE DATABASE ipb_fasilitas;
\q
```

> **💡 Alternatif:** Kamu juga bisa menggunakan script otomatis dari proyek ini (lihat langkah 2d).

#### 2b. Buat Virtual Environment Python

```bash
# Pindah ke folder backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows (Command Prompt):
venv\Scripts\activate

# Windows (PowerShell):
venv\Scripts\Activate.ps1

# macOS / Linux:
source venv/bin/activate
```

> Setelah aktivasi berhasil, terminal kamu akan menampilkan `(venv)` di depan prompt.

#### 2c. Install Dependencies Python

```bash
pip install -r requirements.txt
```

#### 2d. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env`:

```bash
# Windows (Command Prompt):
copy .env.example .env

# macOS / Linux:
cp .env.example .env
```

Kemudian buka file `backend/.env` dan sesuaikan isinya:

```env
# PostgreSQL Connection String
# Sesuaikan user, password, host, port, dan nama database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ipb_fasilitas

# JWT Secret Key (ganti dengan string random yang panjang)
SECRET_KEY=your-super-secret-key-change-this-in-production

# JWT Algorithm
ALGORITHM=HS256

# Token expiry (dalam menit, default 1440 = 24 jam)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Upload folder (relatif dari backend/)
UPLOAD_DIR=uploads
```

> **⚠️ PENTING:** Ganti `yourpassword` dengan password PostgreSQL kamu yang sebenarnya.

#### 2e. Buat Database Secara Otomatis (Opsional)

Jika kamu belum membuat database di langkah 2a, jalankan script berikut:

```bash
python create_db.py
```

Script ini akan mencoba koneksi dengan beberapa password umum (`postgres`, `root`, `""`, `admin`, `12345`) dan membuat database `ipb_fasilitas` secara otomatis.

#### 2f. Seeding Data Awal

Jalankan seeder untuk mengisi data awal:

```bash
# Buat akun Admin & Tendik
python seed_users.py

# Isi data fasilitas kampus IPB
python seed_facilities.py
```

#### 2g. Jalankan Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend berhasil berjalan jika muncul output:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
```

> Backend API docs tersedia di: **http://localhost:8000/docs** (Swagger UI)

---

### 3. Setup Frontend (React + Vite)

Buka **terminal baru** (jangan tutup terminal backend), lalu:

```bash
# Kembali ke root folder proyek (dari backend/)
cd ..

# Atau langsung dari awal
cd ADS_Kelompok12_

# Install dependencies Node.js
npm install
```

---

## ▶️ Menjalankan Aplikasi

Kamu memerlukan **2 terminal** yang berjalan bersamaan:

### Terminal 1 — Backend (FastAPI)

```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend (Vite + React)

```bash
# Dari root folder proyek
npm run dev
```

### Akses Aplikasi

| Service | URL |
|---|---|
| 🌐 **Frontend** | [http://localhost:3000](http://localhost:3000) |
| ⚙️ **Backend API** | [http://localhost:8000](http://localhost:8000) |
| 📄 **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| 📘 **API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

---

## 🔑 Akun Default

Setelah menjalankan `seed_users.py`, akun berikut siap digunakan:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ipb.ac.id` | `admin123` |
| **Tendik (Staff)** | `tendik@ipb.ac.id` | `tendik123` |

> Akun **Mahasiswa (Student)** dapat dibuat melalui halaman **Register** di aplikasi.

---

## 📁 Struktur Proyek

```
ADS_Kelompok12_/
├── backend/                    # 🐍 Backend FastAPI
│   ├── routers/                #    Endpoint API per-fitur
│   │   ├── auth_router.py      #    Autentikasi (login/register)
│   │   ├── user_router.py      #    Manajemen user
│   │   ├── facility_router.py  #    CRUD fasilitas
│   │   ├── booking_router.py   #    Peminjaman fasilitas
│   │   ├── notification_router.py  # Notifikasi
│   │   └── analytics_router.py #    Analytics & dashboard
│   ├── uploads/                #    Folder upload gambar
│   ├── main.py                 #    Entry point FastAPI
│   ├── database.py             #    Koneksi database
│   ├── models.py               #    SQLAlchemy models
│   ├── schemas.py              #    Pydantic schemas
│   ├── auth.py                 #    JWT & hashing utilities
│   ├── create_db.py            #    Script buat database
│   ├── seed_users.py           #    Seeder akun admin & tendik
│   ├── seed_facilities.py      #    Seeder data fasilitas
│   ├── requirements.txt        #    Dependensi Python
│   └── .env.example            #    Template environment variables
│
├── components/                 # ⚛️ Komponen React reusable
├── context/                    #    React Context (AuthContext)
├── pages/                      # 📄 Halaman-halaman aplikasi
│   ├── Home.tsx                #    Landing page
│   ├── Login.tsx               #    Halaman login
│   ├── Register.tsx            #    Halaman registrasi
│   ├── FacilityList.tsx        #    Daftar fasilitas
│   ├── BookingForm.tsx         #    Form peminjaman
│   ├── MyBookings.tsx          #    Riwayat peminjaman user
│   ├── UserProfile.tsx         #    Profil pengguna
│   ├── AdminDashboard.tsx      #    Dashboard admin
│   ├── TendikDashboard.tsx     #    Dashboard tendik
│   ├── FacilityEditor.tsx      #    Edit fasilitas (admin)
│   └── UserManagement.tsx      #    Manajemen user (admin)
│
├── services/                   # 🔌 API service layer
│   ├── api.ts                  #    HTTP client (fetch wrapper)
│   ├── authService.ts          #    Service autentikasi
│   ├── bookingService.ts       #    Service peminjaman
│   ├── facilityService.ts      #    Service fasilitas
│   └── notificationService.ts  #    Service notifikasi
│
├── types.ts                    #    TypeScript type definitions
├── App.tsx                     #    Root React component & routing
├── index.tsx                   #    React entry point
├── index.html                  #    HTML template
├── vite.config.ts              #    Konfigurasi Vite
├── tsconfig.json               #    Konfigurasi TypeScript
├── package.json                #    Dependensi Node.js
└── .gitignore                  #    File yang diabaikan Git
```

---

## 📡 API Documentation

Backend menyediakan REST API dengan endpoint berikut:

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/auth/register` | Registrasi user baru |
| `POST` | `/auth/login` | Login & dapatkan JWT token |
| `GET` | `/users/me` | Profil user saat ini |
| `GET` | `/users/` | Daftar semua user (Admin) |
| `GET` | `/facilities/` | Daftar semua fasilitas |
| `POST` | `/facilities/` | Tambah fasilitas baru (Admin) |
| `PUT` | `/facilities/{id}` | Update fasilitas (Admin) |
| `DELETE` | `/facilities/{id}` | Hapus fasilitas (Admin) |
| `GET` | `/bookings/` | Daftar booking |
| `POST` | `/bookings/` | Buat booking baru |
| `PUT` | `/bookings/{id}/status` | Update status booking (Staff/Admin) |
| `GET` | `/notifications/` | Daftar notifikasi user |
| `GET` | `/analytics/summary` | Data analytics (Admin/Staff) |

> 📄 Dokumentasi interaktif lengkap tersedia di **http://localhost:8000/docs** setelah backend dijalankan.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Deskripsi | Contoh |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://postgres:password@localhost:5432/ipb_fasilitas` |
| `SECRET_KEY` | Secret key untuk JWT token | `my-super-secret-key-123` |
| `ALGORITHM` | Algoritma JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Masa berlaku token (menit) | `1440` |
| `UPLOAD_DIR` | Direktori upload file | `uploads` |

### Frontend (Opsional)

Frontend secara default akan terhubung ke `http://localhost:8000`. Jika backend berjalan di URL berbeda, buat file `.env.local` di root proyek:

```env
VITE_API_URL=http://localhost:8000
```

---

## ❓ Troubleshooting

<details>
<summary><strong>🔴 Error: "psycopg2" gagal diinstal</strong></summary>

Pada beberapa sistem, `psycopg2-binary` memerlukan build tools. Solusi:

```bash
# Windows: pastikan Visual C++ Build Tools terinstal
pip install psycopg2-binary

# macOS:
brew install postgresql
pip install psycopg2-binary

# Linux (Ubuntu/Debian):
sudo apt-get install libpq-dev python3-dev
pip install psycopg2-binary
```

</details>

<details>
<summary><strong>🔴 Error: "password authentication failed for user postgres"</strong></summary>

Password PostgreSQL kamu tidak sesuai. Solusi:

1. Buka file `backend/.env`
2. Ubah `DATABASE_URL` dengan password yang benar:
   ```
   DATABASE_URL=postgresql://postgres:PASSWORD_KAMU@localhost:5432/ipb_fasilitas
   ```
3. Jika lupa password, reset password PostgreSQL via `pgAdmin` atau ubah `pg_hba.conf`.

</details>

<details>
<summary><strong>🔴 Error: "database ipb_fasilitas does not exist"</strong></summary>

Database belum dibuat. Jalankan salah satu cara berikut:

```bash
# Cara 1: Otomatis via script
cd backend
python create_db.py

# Cara 2: Manual via psql
psql -U postgres -c "CREATE DATABASE ipb_fasilitas;"
```

</details>

<details>
<summary><strong>🔴 Frontend tidak bisa terhubung ke backend (CORS error)</strong></summary>

Pastikan:
1. Backend sudah berjalan di `http://localhost:8000`
2. Frontend berjalan di `http://localhost:3000`
3. Kedua terminal tidak menampilkan error

</details>

<details>
<summary><strong>🔴 Error: "venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled"</strong></summary>

Pada PowerShell Windows, jalankan perintah berikut (sebagai Administrator):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Kemudian coba aktivasi venv lagi.

</details>

<details>
<summary><strong>🔴 Port 3000 atau 8000 sudah dipakai</strong></summary>

Cari proses yang menggunakan port tersebut:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

</details>

---

## 🧪 Quick Start (TL;DR)

```bash
# 1. Clone & masuk folder
git clone https://github.com/<username>/ADS_Kelompok12_.git
cd ADS_Kelompok12_

# 2. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate              # Windows
pip install -r requirements.txt
copy .env.example .env             # Windows (lalu edit password DB di .env)
python create_db.py
python seed_users.py
python seed_facilities.py
uvicorn main:app --reload --port 8000

# 3. Setup Frontend (terminal baru)
cd ADS_Kelompok12_
npm install
npm run dev

# 4. Buka http://localhost:3000 di browser 🎉
```

---

<div align="center">

**Dibuat dengan ❤️ oleh Kelompok 12 — Mata Kuliah ADS, IPB University**

</div>
