import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "data", "legal_db.sqlite")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=== CHECKING DUPLICATES IN OTHER LAWS ===\n")

# Check each law separately
laws = [
    "Code of Criminal Procedure 1898",
    "Pakistan Penal Code 1860",
    "Constitution of Pakistan 1973",
    "Qanun-e-Shahadat Order 1984",
    "Muslim Family Laws Ordinance 1961",
]

total_duplicates = 0

for law in laws:
    cursor.execute("""
                   SELECT section_number, COUNT(*) as cnt
                   FROM law_sections
                   WHERE law_name = ?
                   GROUP BY section_number
                   HAVING cnt > 1
                   ORDER BY cnt DESC LIMIT 5;
                   """, (law,))

    dups = cursor.fetchall()

    if dups:
        print(f"--- {law} ---")
        for row in dups:
            print(f"  Section {row[0]}: {row[1]} duplicates")
            total_duplicates += row[1] - 1
        print("")
    else:
        print(f"--- {law} ---")
        print("  ✓ No duplicates")
        print("")

print(f"\n=== TOTAL EXTRA DUPLICATES: {total_duplicates} ===")

conn.close()