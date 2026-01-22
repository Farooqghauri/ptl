import sqlite3
from pathlib import Path
import re

# ---------------- CONFIG ----------------

TEXT_DIR = Path("backend/data/lawbooks_text")  # where .txt files already exist
DB_PATH = Path("backend/data/lawbooks_clean.sqlite")

# ----------------------------------------

SECTION_PATTERNS = [
    re.compile(r"^\s*(Section|Sec\.?)\s+(\d+[A-Za-z\-]*)\s*[:.\-]?\s*(.*)", re.I),
    re.compile(r"^\s*(Article)\s+(\d+[A-Za-z\-]*)\s*[:.\-]?\s*(.*)", re.I),
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS law_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        law_name TEXT,
        section_number TEXT,
        section_title TEXT,
        section_text TEXT,
        source_file TEXT,
        UNIQUE(law_name, section_number, source_file)
    )
    """)

    conn.commit()
    return conn

def already_processed(cur, source_file):
    cur.execute(
        "SELECT 1 FROM law_sections WHERE source_file = ? LIMIT 1",
        (source_file,)
    )
    return cur.fetchone() is not None

def extract_sections(text):
    lines = text.splitlines()
    sections = []
    current = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        matched = False
        for pattern in SECTION_PATTERNS:
            m = pattern.match(line)
            if m:
                if current:
                    sections.append(current)

                current = {
                    "number": m.group(2).strip(),
                    "title": m.group(3).strip(),
                    "text": ""
                }
                matched = True
                break

        if not matched and current:
            current["text"] += line + "\n"

    if current:
        sections.append(current)

    return sections

def infer_law_name(filename):
    name = filename.replace(".txt", "").replace("_", " ")
    return name.title()

def main():
    if not TEXT_DIR.exists():
        print("❌ No lawbook text directory found:", TEXT_DIR)
        return

    conn = init_db()
    cur = conn.cursor()

    txt_files = list(TEXT_DIR.glob("*.txt"))
    if not txt_files:
        print("❌ No text files found")
        return

    total_inserted = 0

    for txt_file in txt_files:
        source_file = txt_file.name

        if already_processed(cur, source_file):
            print(f"⏭ Skipped (already indexed): {source_file}")
            continue

        text = txt_file.read_text(encoding="utf-8", errors="ignore")
        sections = extract_sections(text)
        law_name = infer_law_name(source_file)

        inserted = 0
        for sec in sections:
            try:
                cur.execute("""
                INSERT OR IGNORE INTO law_sections
                (law_name, section_number, section_title, section_text, source_file)
                VALUES (?, ?, ?, ?, ?)
                """, (
                    law_name,
                    sec["number"],
                    sec["title"],
                    sec["text"].strip(),
                    source_file
                ))
                if cur.rowcount:
                    inserted += 1
            except Exception:
                pass

        conn.commit()
        total_inserted += inserted
        print(f"✔ {source_file}: {inserted} sections stored")

    conn.close()
    print("\nDONE")
    print("Total sections inserted:", total_inserted)
    print("DB created at:", DB_PATH.resolve())

if __name__ == "__main__":
    main()
