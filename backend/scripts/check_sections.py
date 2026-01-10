import sqlite3

conn = sqlite3.connect('data/legal_db.sqlite')
cur = conn.cursor()

# Check PPC section numbers
print("=== PPC Sections (first 20) ===")
cur.execute("SELECT section_number, section_title FROM law_sections WHERE law_name LIKE '%Penal%' LIMIT 20")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1][:50]}")

# Check if 302 exists
print("\n=== Searching for '302' ===")
cur.execute("SELECT section_number, section_title FROM law_sections WHERE section_number LIKE '%302%'")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1][:50]}")

# Check if 489 exists
print("\n=== Searching for '489' ===")
cur.execute("SELECT section_number, section_title FROM law_sections WHERE section_number LIKE '%489%'")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1][:50]}")

conn.close()