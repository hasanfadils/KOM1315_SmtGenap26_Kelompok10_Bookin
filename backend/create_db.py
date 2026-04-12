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
        
        try:
            with open('.env', 'r', encoding='utf-8') as f:
                content = f.read()
            
            content = content.replace("postgresql://postgres:postgres@localhost:5432", f"postgresql://postgres:{pwd}@localhost:5432")
            
            with open('.env', 'w', encoding='utf-8') as f:
                f.write(content)
        except Exception as e:
            print(f"Failed to update .env: {e}")
            
        break
    except psycopg2.OperationalError as e:
        if "password authentication failed" in str(e):
            continue
        print(f"Connection error: {e}")
        break

if not connected:
    print("Failed to connect to PostgreSQL with common passwords. Please update the password in .env manually and create the DB.")
