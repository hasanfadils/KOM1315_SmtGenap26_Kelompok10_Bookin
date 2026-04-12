import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    # Connect without password (since it's now 'trust')
    conn = psycopg2.connect(dbname='postgres', user='postgres', host='localhost')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    # Change password for postgres to 'postgres'
    cur.execute("ALTER USER postgres WITH PASSWORD 'postgres';")
    print("Password changed temporarily to 'postgres'.")
    
    # Check if DB exists
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'ipb_fasilitas'")
    exists = cur.fetchone()
    
    if not exists:
        cur.execute('CREATE DATABASE ipb_fasilitas')
        print("Database 'ipb_fasilitas' created successfully!")
    else:
        print("Database 'ipb_fasilitas' already exists!")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
