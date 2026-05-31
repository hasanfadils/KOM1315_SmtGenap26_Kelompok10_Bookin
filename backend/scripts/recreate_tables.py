import sys
import os

# Add backend/ to path so app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import User, Ruangan, Pengajuan, DokumenPengajuan, Notification

print("Recreating all tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
