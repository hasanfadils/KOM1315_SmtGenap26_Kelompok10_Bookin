"""
Seed script untuk membuat akun Admin dan Tendik.
Jalankan dari backend/: python -m scripts.seed_users
"""

import sys
import os

# Add backend/ to path so app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Any
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, Ruangan
from app.services.auth_service import AuthService

# Pastikan tabel sudah ada
Base.metadata.create_all(bind=engine)

db = SessionLocal()

gww_room = db.query(Ruangan).filter(Ruangan.name.like("%Graha Widya Wisuda%")).first()
gww_ids = [gww_room.id] if gww_room else []

users_to_create: list[dict[str, Any]] = [
    {
        "name": "Admin IPB",
        "email": "admin@ipb.ac.id",
        "password": "admin123",
        "nim": None,
        "role": UserRole.admin,
        "managed_ruangan_ids": None,
    },
    {
        "name": "Tendik IPB",
        "email": "tendik@ipb.ac.id",
        "password": "tendik123",
        "nim": None,
        "role": UserRole.staff,
        "managed_ruangan_ids": None,
    },
    {
        "name": "Tendik GWW",
        "email": "tendik_gww@ipb.ac.id",
        "password": "tendikgww123",
        "nim": None,
        "role": UserRole.staff,
        "managed_ruangan_ids": gww_ids,
    },
]

print("=" * 50)
print("  Membuat Akun Admin & Tendik")
print("=" * 50)

for user_data in users_to_create:
    existing = db.query(User).filter(User.email == user_data["email"]).first()
    if existing:
        print(
            f"[SKIP]  {user_data['role'].value.upper():>7} | "
            f"{user_data['email']} sudah ada, dilewati."
        )
        continue

    user = User(
        name=user_data["name"],
        email=user_data["email"],
        password_hash=AuthService.hash_password(user_data["password"]),
        nim=user_data["nim"],
        role=user_data["role"],
        managed_ruangan_ids=user_data.get("managed_ruangan_ids"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(
        f"[OK] {user_data['role'].value.upper():>7} | "
        f"{user_data['email']} berhasil dibuat!"
    )

print("=" * 50)
print()
print("Ringkasan akun:")
print("   Admin  -> email: admin@ipb.ac.id   | password: admin123")
print("   Tendik -> email: tendik@ipb.ac.id   | password: tendik123")
print("   Tendik GWW (Hanya GWW) -> email: tendik_gww@ipb.ac.id | password: tendikgww123")
print()

db.close()
