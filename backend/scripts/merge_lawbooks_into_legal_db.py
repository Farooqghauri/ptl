import os
import re
import sqlite3
import hashlib
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# =========================
# CONFIG (adjust if needed)
# =========================
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))  # backend/
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
LAWBOOKS_TEXT_DIR = os.path.join(DATA_DIR, "lawbooks_text")
MAIN_DB_PATH = os.path.join(DATA_DIR, "legal_db.sqlite")

# If you want a dry run first (no inserts), set True
DRY_RUN = False


# =========================
# Helpers
# =========================
def now_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8", errors="ignore")).hexdigest()


def norm_space(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\u00ad", "")  # soft hyphen
    s = s.replace("\u200b", "")  # zero-width
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def norm_number(n: str) -> str:
    n = norm_space(n)
    n = n.replace("—", "-").replace("–", "-")
    n = re.sub(r"\s+", "", n)
    n = n.strip(".:;)")
    return n


def guess_law_name_from_filename(filename: str) -> str:
    f = filename.lower()

    # Match your main DB law_name conventions (seen in your inspect output)
    if "pakistan penal code" in f or "ppc" in f:
        return "Pakistan Penal Code 1860"
    if "crpc" in f or "criminal procedure" in f:
        return "Code of Criminal Procedure 1898"
    if "civil_procedure" in f or "code_of_civil_procedure" in f or "cpc" in f:
        return "Code of Civil Procedure 1908"
    if "constitution" in f:
        return "Constitution of Pakistan 1973"
    if "shahadat" in f:
        return "Qanun-e-Shahadat Order 1984"
    if "muslim-family-laws" in f or "muslim family laws" in f:
        return "Muslim Family Laws Ordinance 1961"

    # fallback
    return "OTHER"


# =========================
# Parsing
# =========================
# This parser is intentionally conservative:
# - It finds "Section <num>" / "SECTION <num>" / "<num>. <title>" blocks for statutes
# - It also finds "Article <num>" for constitution-like documents
#
# It is not perfect, but it is stable and merge-safe because we dedupe by hashes.
SECTION_PATTERNS = [
    re.compile(r"(?im)^\s*section\s+([0-9]+[a-zA-Z]?)\s*[\.\:\-–—]\s*(.+?)\s*$"),
    re.compile(r"(?im)^\s*([0-9]+[a-zA-Z]?)\.\s+(.+?)\s*$"),
]
ARTICLE_PATTERN = re.compile(r"(?im)^\s*article\s+([0-9]+[a-zA-Z]?)\s*[\.\:\-–—]\s*(.+?)\s*$")


def find_block_starts(text: str, law_name: str) -> List[Tuple[int, str, str]]:
    starts: List[Tuple[int, str, str]] = []

    for m in ARTICLE_PATTERN.finditer(text):
        num = norm_number(m.group(1))
        title = norm_space(m.group(2))
        starts.append((m.start(), num, title))

    # If constitution has "Article" we keep those, otherwise also accept Section patterns
    for pat in SECTION_PATTERNS:
        for m in pat.finditer(text):
            num = norm_number(m.group(1))
            title = norm_space(m.group(2))
            starts.append((m.start(), num, title))

    starts.sort(key=lambda x: x[0])
    # de-dupe close duplicates (same number at almost same position)
    cleaned: List[Tuple[int, str, str]] = []
    seen = set()
    for pos, num, title in starts:
        key = (num, pos // 5)  # rough bucket
        if key in seen:
            continue
        seen.add(key)
        cleaned.append((pos, num, title))
    return cleaned


def split_into_blocks(text: str, law_name: str, source_file: str) -> List[Dict]:
    t = norm_space(text)
    if not t:
        return []

    starts = find_block_starts(t, law_name)

    # If we cannot detect starts, return empty (avoid garbage)
    if len(starts) < 2:
        return []

    blocks: List[Dict] = []
    for i in range(len(starts)):
        start_pos, num, title = starts[i]
        end_pos = starts[i + 1][0] if i + 1 < len(starts) else len(t)
        body = norm_space(t[start_pos:end_pos])

        # Clean body: remove page headers/footers lightly
        body = re.sub(r"(?im)^\s*page\s+\d+\s+of\s+\d+\s*$", "", body)
        body = norm_space(body)

        if len(body) < 80:
            continue

        blocks.append(
            {
                "law_name": law_name,
                "section_number": num,
                "section_title": title[:300],
                "section_text": body,
                "chapter": "",
                "source_file": source_file,
            }
        )
    return blocks


# =========================
# DB merge
# =========================
def ensure_tables_and_indexes(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()

    # Ensure law_sections exists (your DB already has it, but safe)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS law_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            law_name TEXT,
            section_number TEXT,
            section_title TEXT,
            section_text TEXT,
            chapter TEXT,
            source_file TEXT,
            created_at TEXT
        )
        """
    )

    # Meta table to skip re-processing the same source (by hash)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS merge_meta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file TEXT UNIQUE,
            content_hash TEXT,
            processed_at TEXT
        )
        """
    )

    # Create a unique index for de-dupe:
    # 1) law_name
    # 2) section_number
    # 3) section_text_hash (stored via generated hash in query)
    #
    # SQLite does not support expression indexes everywhere reliably,
    # so we keep de-dupe in Python + a soft guard with a standard index.
    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_law_sections_lookup
        ON law_sections(law_name, section_number)
        """
    )

    conn.commit()


def existing_text_hashes(conn: sqlite3.Connection, law_name: str, section_number: str) -> set:
    cur = conn.cursor()
    cur.execute(
        "SELECT section_text FROM law_sections WHERE law_name = ? AND section_number = ?",
        (law_name, section_number),
    )
    rows = cur.fetchall()
    hashes = set()
    for (txt,) in rows:
        hashes.add(sha256(norm_space(txt)))
    return hashes


def upsert_block(conn: sqlite3.Connection, block: Dict) -> bool:
    """
    Returns True if inserted, False if skipped as duplicate
    """
    law_name = block["law_name"]
    sec_no = block["section_number"]
    sec_title = block["section_title"]
    sec_text = block["section_text"]
    chapter = block.get("chapter", "")
    source_file = block.get("source_file", "")

    new_hash = sha256(norm_space(sec_text))
    existing_hash_set = existing_text_hashes(conn, law_name, sec_no)
    if new_hash in existing_hash_set:
        return False

    if DRY_RUN:
        return True

    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO law_sections
        (law_name, section_number, section_title, section_text, chapter, source_file, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (law_name, sec_no, sec_title, sec_text, chapter, source_file, now_iso()),
    )
    return True


def load_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def get_meta(conn: sqlite3.Connection, source_file: str) -> Optional[str]:
    cur = conn.cursor()
    cur.execute("SELECT content_hash FROM merge_meta WHERE source_file = ?", (source_file,))
    row = cur.fetchone()
    return row[0] if row else None


def set_meta(conn: sqlite3.Connection, source_file: str, content_hash: str) -> None:
    if DRY_RUN:
        return
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO merge_meta (source_file, content_hash, processed_at)
        VALUES (?, ?, ?)
        ON CONFLICT(source_file) DO UPDATE SET
            content_hash=excluded.content_hash,
            processed_at=excluded.processed_at
        """,
        (source_file, content_hash, now_iso()),
    )


def main() -> None:
    if not os.path.exists(MAIN_DB_PATH):
        print(f"❌ Main DB not found: {MAIN_DB_PATH}")
        return

    if not os.path.isdir(LAWBOOKS_TEXT_DIR):
        print(f"❌ No lawbook text directory found: {LAWBOOKS_TEXT_DIR}")
        return

    txt_files = [f for f in os.listdir(LAWBOOKS_TEXT_DIR) if f.lower().endswith(".txt")]
    if not txt_files:
        print("❌ No .txt files found in lawbooks_text")
        return

    conn = sqlite3.connect(MAIN_DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_tables_and_indexes(conn)

    total_files = 0
    total_blocks = 0
    inserted = 0
    skipped_dup = 0
    skipped_unchanged = 0
    skipped_unparsed = 0

    for filename in sorted(txt_files):
        full_path = os.path.join(LAWBOOKS_TEXT_DIR, filename)
        content = load_file(full_path)
        content_clean = norm_space(content)
        if not content_clean:
            print(f"⚠ Skipping empty: {filename}")
            continue

        total_files += 1
        file_hash = sha256(content_clean)

        previous_hash = get_meta(conn, filename)
        if previous_hash == file_hash:
            skipped_unchanged += 1
            print(f"↩ Skipped unchanged file: {filename}")
            continue

        law_name = guess_law_name_from_filename(filename)
        blocks = split_into_blocks(content_clean, law_name, filename)

        if not blocks:
            skipped_unparsed += 1
            print(f"⚠ Could not parse blocks (too few headings): {filename}")
            set_meta(conn, filename, file_hash)
            conn.commit()
            continue

        total_blocks += len(blocks)

        file_inserted = 0
        file_skipped = 0
        for b in blocks:
            ok = upsert_block(conn, b)
            if ok:
                inserted += 1
                file_inserted += 1
            else:
                skipped_dup += 1
                file_skipped += 1

        set_meta(conn, filename, file_hash)
        conn.commit()

        print(f"✔ {filename}: blocks={len(blocks)} inserted={file_inserted} dup_skipped={file_skipped}")

    # Final counts
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM law_sections")
    total_after = cur.fetchone()["c"]

    conn.close()

    print("\n=== MERGE SUMMARY ===")
    print(f"Files scanned            : {total_files}")
    print(f"Files skipped (unchanged): {skipped_unchanged}")
    print(f"Files unparsed           : {skipped_unparsed}")
    print(f"Blocks parsed            : {total_blocks}")
    print(f"Inserted into law_sections: {inserted}{' (DRY RUN)' if DRY_RUN else ''}")
    print(f"Skipped as duplicates    : {skipped_dup}")
    print(f"law_sections total rows  : {total_after}")


if __name__ == "__main__":
    main()
