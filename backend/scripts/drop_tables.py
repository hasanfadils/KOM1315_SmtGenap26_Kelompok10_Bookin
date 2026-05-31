import sys
import os

# Add backend/ to path so app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

print("Dropping ALL tables with CASCADE...")

with engine.connect() as conn:
    # Drop semua tabel yang ada di database
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    conn.commit()

print("All tables dropped!")
