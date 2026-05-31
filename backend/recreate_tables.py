from app.database import engine, Base
from app.models import User, Ruangan, Pengajuan, DokumenPengajuan, Notification

print("Recreating all tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
