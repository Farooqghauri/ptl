"""
Remove duplicates from all laws (except CPC which is already fixed)
Keeps the row with longest/most complete text
"""

import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "data", "legal_db.sqlite")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("=" * 50)
print("FIXING DUPLICATES IN ALL LAWS")
print("=" * 50)

laws = [
    "Code of Criminal Procedure 1898",
    "Pakistan Penal Code 1860",
    "Constitution of Pakistan 1973",
    "Qanun-e-Shahadat Order 1984",
    "Muslim Family Laws Ordinance 1961",
]

total_deleted = 0

for law in laws:
    print(f"\n--- {law} ---")

    # Find duplicates
    cursor.execute("""
                   SELECT section_number, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
                   FROM law_sections
                   WHERE law_name = ?
                   GROUP BY section_number
                   HAVING cnt > 1;
                   """, (law,))

    duplicates = cursor.fetchall()

    if not duplicates:
        print("  ✓ No duplicates")
        continue

    ids_to_delete = []

    for dup in duplicates:
        section_num, count, id_list = dup
        ids = [int(i) for i in id_list.split(",")]

        # Keep row with longest text
        cursor.execute(f"""
            SELECT id, LENGTH(COALESCE(section_text, '')) as text_len
            FROM law_sections
            WHERE id IN ({','.join(['?'] * len(ids))})
            ORDER BY text_len DESC;
        """, ids)
        ranked = cursor.fetchall()

        # Keep first, delete rest
        keep_id = ranked[0][0]
        delete_ids = [r[0] for r in ranked[1:]]
        ids_to_delete.extend(delete_ids)

    if ids_to_delete:
        cursor.execute(f"""
            DELETE FROM law_sections
            WHERE id IN ({','.join(['?'] * len(ids_to_delete))});
        """, ids_to_delete)
        conn.commit()
        print(f"  ✓ Removed {len(ids_to_delete)} duplicates")
        total_deleted += len(ids_to_delete)
    else:
        print("  ✓ No duplicates")

# Final verification
print("\n" + "=" * 50)
print("VERIFICATION")
print("=" * 50)

cursor.execute("""
               SELECT law_name, COUNT(*)
               FROM law_sections
               GROUP BY law_name
               ORDER BY law_name;
               """)

print("\nFinal record counts:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

cursor.execute("SELECT COUNT(*) FROM law_sections;")
print(f"\nTotal records: {cursor.fetchone()[0]}")
print(f"Total duplicates removed: {total_deleted}")

conn.close()

print("\n" + "=" * 50)
print("✓ COMPLETE")
print("=" * 50)