import os
import sqlite3
import pdfplumber
import re
from datetime import datetime

# Paths
LAWBOOKS_DIR = "data/lawbooks"
DB_PATH = "data/legal_db.sqlite"


def create_law_sections_table():
    """Create table for law sections if not exists."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
                CREATE TABLE IF NOT EXISTS law_sections
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY
                    AUTOINCREMENT,
                    law_name
                    TEXT
                    NOT
                    NULL,
                    section_number
                    TEXT,
                    section_title
                    TEXT,
                    section_text
                    TEXT,
                    chapter
                    TEXT,
                    source_file
                    TEXT,
                    created_at
                    TEXT
                )
                ''')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_section_number ON law_sections(section_number)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_law_name ON law_sections(law_name)')
    conn.commit()
    conn.close()
    print("✅ law_sections table ready")


def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"  ❌ Error: {e}")
    return text


def parse_ppc_sections(text, source_file):
    """Parse PPC sections."""
    sections = []
    # Pattern: Section number followed by text
    pattern = r'(\d{1,3}[A-Z]?)\.\s*([^\n]+)\n([\s\S]*?)(?=\n\d{1,3}[A-Z]?\.\s|\Z)'
    matches = re.findall(pattern, text)

    for match in matches:
        sec_num, sec_title, sec_text = match
        sections.append({
            'law_name': 'Pakistan Penal Code 1860',
            'section_number': sec_num.strip(),
            'section_title': sec_title.strip()[:200],
            'section_text': sec_text.strip()[:2000],
            'chapter': '',
            'source_file': source_file
        })
    return sections


def parse_crpc_sections(text, source_file):
    """Parse CrPC sections."""
    sections = []
    pattern = r'(\d{1,3}[A-Z]?)\.\s*([^\n]+)\n([\s\S]*?)(?=\n\d{1,3}[A-Z]?\.\s|\Z)'
    matches = re.findall(pattern, text)

    for match in matches:
        sec_num, sec_title, sec_text = match
        sections.append({
            'law_name': 'Code of Criminal Procedure 1898',
            'section_number': sec_num.strip(),
            'section_title': sec_title.strip()[:200],
            'section_text': sec_text.strip()[:2000],
            'chapter': '',
            'source_file': source_file
        })
    return sections


def parse_constitution_articles(text, source_file):
    """Parse Constitution articles."""
    sections = []
    pattern = r'(?:Article\s+)?(\d{1,3}[A-Z]?)\.\s*([^\n]+)\n([\s\S]*?)(?=\n(?:Article\s+)?\d{1,3}[A-Z]?\.\s|\Z)'
    matches = re.findall(pattern, text, re.IGNORECASE)

    for match in matches:
        art_num, art_title, art_text = match
        sections.append({
            'law_name': 'Constitution of Pakistan 1973',
            'section_number': f'Article {art_num.strip()}',
            'section_title': art_title.strip()[:200],
            'section_text': art_text.strip()[:2000],
            'chapter': '',
            'source_file': source_file
        })
    return sections


def parse_cpc_sections(text, source_file):
    """Parse CPC sections."""
    sections = []
    pattern = r'(?:Section\s+)?(\d{1,3}[A-Z]?)\.\s*([^\n]+)\n([\s\S]*?)(?=\n(?:Section\s+)?\d{1,3}[A-Z]?\.\s|\Z)'
    matches = re.findall(pattern, text)

    for match in matches:
        sec_num, sec_title, sec_text = match
        sections.append({
            'law_name': 'Code of Civil Procedure 1908',
            'section_number': sec_num.strip(),
            'section_title': sec_title.strip()[:200],
            'section_text': sec_text.strip()[:2000],
            'chapter': '',
            'source_file': source_file
        })
    return sections


def parse_evidence_sections(text, source_file):
    """Parse Qanun-e-Shahadat articles."""
    sections = []
    pattern = r'(?:Article\s+)?(\d{1,3}[A-Z]?)\.\s*([^\n]+)\n([\s\S]*?)(?=\n(?:Article\s+)?\d{1,3}[A-Z]?\.\s|\Z)'
    matches = re.findall(pattern, text)

    for match in matches:
        art_num, art_title, art_text = match
        sections.append({
            'law_name': 'Qanun-e-Shahadat Order 1984',
            'section_number': f'Article {art_num.strip()}',
            'section_title': art_title.strip()[:200],
            'section_text': art_text.strip()[:2000],
            'chapter': '',
            'source_file': source_file
        })
    return sections


def parse_family_law_sections(text, source_file):
    """Parse Muslim Family Laws sections."""
    sections = []
    pattern = r'(\d{1,2}[A-Z]?)\.\s*([^\n]+)\n([\s\S]*?)(?=\n\d{1,2}[A-Z]?\.\s|\Z)'
    matches = re.findall(pattern, text)

    for match in matches:
        sec_num, sec_title, sec_text = match
        sections.append({
            'law_name': 'Muslim Family Laws Ordinance 1961',
            'section_number': sec_num.strip(),
            'section_title': sec_title.strip()[:200],
            'section_text': sec_text.strip()[:2000],
            'chapter': '',
            'source_file': source_file
        })
    return sections


def save_sections(sections):
    """Save sections to database."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    for sec in sections:
        cur.execute('''
                    INSERT INTO law_sections
                    (law_name, section_number, section_title, section_text, chapter, source_file, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        sec['law_name'],
                        sec['section_number'],
                        sec['section_title'],
                        sec['section_text'],
                        sec['chapter'],
                        sec['source_file'],
                        now
                    ))

    conn.commit()
    conn.close()
    return len(sections)


def main():
    print("\n" + "=" * 60)
    print("📚 LAW SECTIONS EXTRACTION")
    print("=" * 60)

    # Create table
    create_law_sections_table()

    # Clear existing data
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM law_sections")
    conn.commit()
    conn.close()
    print("🗑️ Cleared existing law_sections data")

    # File mapping
    files_config = [
        ("Pakistan Penal Code.pdf", parse_ppc_sections),
        ("CrPC.pdf", parse_crpc_sections),
        ("constitution.pdf", parse_constitution_articles),
        ("THE_CODE_OF_CIVIL_PROCEDURE,_1908.pdf", parse_cpc_sections),
        ("qanun-e-shahadat-order-1984.pdf", parse_evidence_sections),
        ("54-muslim-family-laws-ordinance-1961-viii-of-1961-pdf.pdf", parse_family_law_sections),
    ]

    total_sections = 0

    for filename, parser_func in files_config:
        filepath = os.path.join(LAWBOOKS_DIR, filename)
        print(f"\n📖 Processing: {filename}")

        if not os.path.exists(filepath):
            print(f"  ⚠️ File not found, skipping...")
            continue

        # Extract text
        text = extract_text_from_pdf(filepath)
        if not text:
            print(f"  ⚠️ No text extracted, skipping...")
            continue

        print(f"  📄 Extracted {len(text)} characters")

        # Parse sections
        sections = parser_func(text, filename)
        print(f"  🔍 Found {len(sections)} sections")

        # Save to database
        if sections:
            saved = save_sections(sections)
            total_sections += saved
            print(f"  ✅ Saved {saved} sections")

    # Final count
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT law_name, COUNT(*) FROM law_sections GROUP BY law_name")
    stats = cur.fetchall()
    conn.close()

    print("\n" + "=" * 60)
    print("📊 EXTRACTION COMPLETE")
    print("=" * 60)
    for law, count in stats:
        print(f"  {law}: {count} sections")
    print(f"\n  TOTAL: {total_sections} sections")
    print("=" * 60)


if __name__ == "__main__":
    main()