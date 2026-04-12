import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

passwords = ["postgres", "root", "", "admin", "12345"]

connected = False
for pwd in passwords:
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password=pwd, host='localhost')
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if DB exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'ipb_fasilitas'")
        exists = cur.fetchone()
        
        if not exists:
            cur.execute('CREATE DATABASE ipb_fasilitas')
            print(f"Database 'ipb_fasilitas' created successfully! Password used: '{pwd}'")
        else:
            print(f"Database 'ipb_fasilitas' already exists! Password used: '{pwd}'")
            
        cur.close()
        conn.close()
        connected = True
        break
    except psycopg2.OperationalError as e:
        if "password authentication failed" in str(e):
            continue
        print(f"Connection error: {e}")
        break

if not connected:
    print("FAILED_TO_CONNECT")
