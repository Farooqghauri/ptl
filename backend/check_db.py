import sqlite3

conn = sqlite3.connect("legal_db.sqlite")
cursor = conn.cursor()

# List all tables
print("=== ALL TABLES ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
for row in cursor.fetchall():
    print(row[0])

conn.close()