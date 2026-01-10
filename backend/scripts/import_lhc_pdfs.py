import os
import sqlite3
import hashlib
import pdfplumber
from datetime import datetime
import re

# Configuration
PDF_FOLDER = r"D:\2025LHC"
DB_PATH = r"data/legal_db.sqlite"


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"  Error extracting text: {e}")
    return text.strip()


def extract_citation(text, filename):
    """Extract citation from text or filename."""
    patterns = [
        r'(\d{4}\s*LHC\s*\d+)',
        r'(\d{4}\s*CLC\s*\d+)',
        r'(\d{4}\s*PLD\s*\w+\s*\d+)',
        r'(\d{4}\s*YLR\s*\d+)',
        r'(\d{4}\s*MLD\s*\d+)',
        r'(\d{4}\s*PCrLJ\s*\d+)',
        r'(W\.?P\.?\s*No\.?\s*\d+)',
        r'(Crl\.?\s*Appeal\s*No\.?\s*\d+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text[:2000], re.IGNORECASE)
        if match:
            return match.group(1).strip()

    # Extract from filename
    name = os.path.splitext(filename)[0]
    return name.replace("_", " ").replace("-", " ")


def generate_summary(text):
    """Generate a basic summary from text."""
    if not text:
        return ""

    paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 100]

    for para in paragraphs[:5]:
        if len(para) > 150:
            return para[:500] + "..." if len(para) > 500 else para

    return text[:500] + "..." if len(text) > 500 else text


def import_pdfs():
    """Import all PDFs from folder into database."""

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get existing count
    cur.execute("SELECT COUNT(*) FROM judgments")
    before_count = cur.fetchone()[0]
    print(f"\n📊 Current judgments in database: {before_count}")

    # Get all PDFs
    pdf_files = [f for f in os.listdir(PDF_FOLDER) if f.lower().endswith('.pdf')]
    print(f"📁 Found {len(pdf_files)} PDF files in {PDF_FOLDER}\n")

    added = 0
    skipped = 0
    errors = 0

    for i, filename in enumerate(pdf_files, 1):
        pdf_path = os.path.join(PDF_FOLDER, filename)
        print(f"[{i}/{len(pdf_files)}] Processing: {filename[:50]}...")

        try:
            # Read PDF and create hash
            with open(pdf_path, 'rb') as f:
                pdf_content = f.read()

            pdf_hash = hashlib.sha256(pdf_content).hexdigest()

            # Check if already exists
            cur.execute("SELECT id FROM judgments WHERE pdf_hash = ?", (pdf_hash,))
            if cur.fetchone():
                print(f"  ⏭️ Already exists, skipping")
                skipped += 1
                continue

            # Extract text
            full_text = extract_text_from_pdf(pdf_path)

            if not full_text:
                print(f"  ⚠️ No text extracted, skipping")
                errors += 1
                continue

            # Extract metadata
            citation = extract_citation(full_text, filename)
            summary = generate_summary(full_text)
            title = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ')

            # Create file URL (local path)
            pdf_url = f"file:///{pdf_path.replace(os.sep, '/')}"

            # Insert into database
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute('''
                        INSERT INTO judgments
                        (title, citation, pdf_url, pdf_hash, full_text, summary, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ''', (title, citation, pdf_url, pdf_hash, full_text, summary, now, now))

            conn.commit()
            added += 1
            print(f"  ✅ Added: {citation}")

        except Exception as e:
            print(f"  ❌ Error: {e}")
            errors += 1
            continue

    # Final count
    cur.execute("SELECT COUNT(*) FROM judgments")
    after_count = cur.fetchone()[0]

    print("\n" + "=" * 50)
    print("📊 IMPORT COMPLETE")
    print("=" * 50)
    print(f"  Before: {before_count} judgments")
    print(f"  Added: {added}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print(f"  After: {after_count} judgments")
    print("=" * 50)

    conn.close()


if __name__ == "__main__":
    import_pdfs()