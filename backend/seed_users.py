"""
Script untuk membuat akun Admin dan Tendik (Staff).
Jalankan: python seed_users.py
"""
from database import SessionLocal, engine
import models
from auth import hash_password

# Pastikan tabel sudah ada
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Daftar akun yang akan dibuat
users_to_create = [
    {
        "name": "Admin IPB",
        "email": "admin@ipb.ac.id",
        "password": "admin123",
        "nim": None,
        "role": models.UserRole.admin,
    },
    {
        "name": "Tendik IPB",
        "email": "tendik@ipb.ac.id",
        "password": "tendik123",
        "nim": None,
        "role": models.UserRole.staff,
    },
]

print("=" * 50)
print("  Membuat Akun Admin & Tendik")
print("=" * 50)

for user_data in users_to_create:
    # Cek apakah email sudah terdaftar
    existing = db.query(models.User).filter(models.User.email == user_data["email"]).first()
    if existing:
        print(f"⚠️  {user_data['role'].value.upper():>7} | {user_data['email']} sudah ada, dilewati.")
        continue

    user = models.User(
        name=user_data["name"],
        email=user_data["email"],
        password_hash=hash_password(user_data["password"]),
        nim=user_data["nim"],
        role=user_data["role"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✅ {user_data['role'].value.upper():>7} | {user_data['email']} berhasil dibuat!")

print("=" * 50)
print()
print("📋 Ringkasan akun:")
print(f"   Admin  → email: admin@ipb.ac.id   | password: admin123")
print(f"   Tendik → email: tendik@ipb.ac.id   | password: tendik123")
print()

db.close()
