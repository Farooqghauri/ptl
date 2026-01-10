import sqlite3

conn = sqlite3.connect('data/legal_db.sqlite')
cur = conn.cursor()

cur.execute('''
    SELECT section_number, section_title, section_text 
    FROM law_sections 
    WHERE section_number = "302" AND law_name LIKE "%Penal%"
''')

row = cur.fetchone()
if row:
    print(f"Section: {row[0]}")
    print(f"Title: {row[1]}")
    print(f"Text: {row[2][:1000]}")
else:
    print("Not found")

conn.close()