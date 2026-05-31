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
