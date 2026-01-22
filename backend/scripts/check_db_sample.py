import sqlite3

conn = sqlite3.connect('data/legal_db.sqlite')
cursor = conn.cursor()

print('=== SAMPLE DATA FROM EACH LAW ===')
cursor.execute('SELECT DISTINCT law_name FROM law_sections')
laws = cursor.fetchall()

for law in laws:
    print(f'\n--- {law[0]} ---')
    cursor.execute('''
        SELECT section_number, section_title, substr(section_text, 1, 150)
        FROM law_sections 
        WHERE law_name = ?
        LIMIT 3
    ''', (law[0],))
    for row in cursor.fetchall():
        print(f'Section {row[0]}: {row[1]}')
        print(f'Text: {row[2]}...')
        print('')

conn.close()