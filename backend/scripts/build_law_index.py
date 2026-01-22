import json
import re
import sqlite3
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple


DATA_DIR = Path("data")
PDF_JSON_PATH = DATA_DIR / "pdf_data.json"
DB_PATH = DATA_DIR / "law_index.sqlite"


@dataclass
class Slice:
    law_code: str
    kind: str  # "section" or "article"
    number: str
    title: str
    text: str
    source_file: str


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def load_pdf_data() -> List[Dict[str, str]]:
    if not PDF_JSON_PATH.exists():
        die(f"Missing file: {PDF_JSON_PATH.resolve()}")
    data = json.loads(PDF_JSON_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        die("pdf_data.json must be a list")
    cleaned: List[Dict[str, str]] = []
    for item in data:
        if isinstance(item, dict) and isinstance(item.get("text"), str):
            cleaned.append(
                {
                    "file_name": str(item.get("file_name", "")),
                    "text": str(item.get("text", "")),
                }
            )
    return cleaned


def normalize_text(s: str) -> str:
    # Remove soft hyphens and normalize whitespace, keep newlines
    s = s.replace("\u00ad", "")
    s = s.replace("\ufeff", "")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{4,}", "\n\n\n", s)
    return s


def detect_law_code(file_name: str, text: str) -> str:
    fn = file_name.lower()
    head = text[:2000].lower()

    def has(*tokens: str) -> bool:
        for t in tokens:
            if t in fn or t in head:
                return True
        return False

    if has("penal code", "pakistan penal code", "ppc"):
        return "PPC"
    if has("criminal procedure", "cr.p.c", "crpc", "cr p c"):
        return "CrPC"
    if has("civil procedure", "c.p.c", "cpc", "cp c"):
        return "CPC"
    if has("constitution", "constitution of pakistan"):
        return "CONST"
    if has("qanun-e-shahadat", "qanoon-e-shahadat", "qso", "evidence"):
        return "QSO"
    if has("family courts", "family court act"):
        return "FCA"
    if has("guardians and wards"):
        return "GWA"
    if has("muslim family laws"):
        return "MFLO"

    # Fallback for other acts/ordinances/regulations
    return "OTHER"


# Headers:
# - "154. Information in cognizable cases."
# - "SECTION 154. ..."
# - "Article 199. ..."
# OCR sometimes produces spaced letters; we handle "SECTION" / "ARTICLE" with regex.
SEC_WORD = r"S\s*E\s*C\s*T\s*I\s*O\s*N"
ART_WORD = r"A\s*R\s*T\s*I\s*C\s*L\s*E"

# Section number can be: 154, 498, 22-A, 489-F, 489F, 337-A(1)
NUM = r"(?P<num>\d{1,4}(?:\s*[-–]\s*[A-Za-z])?(?:\s*\(\s*\d+\s*\))?)"

# Patterns that mark a new section/article block
RX_SECTION_LINE = re.compile(
    rf"(?im)^(?:{SEC_WORD}\s*)?{NUM}\s*[\.\-–]\s*(?P<title>[^\n]{{0,140}})$"
)
RX_ARTICLE_LINE = re.compile(
    rf"(?im)^(?:{ART_WORD}\s*)?{NUM}\s*[\.\-–]\s*(?P<title>[^\n]{{0,140}})$"
)

# Additional patterns for common constitution formatting like "Article 199:"
RX_ARTICLE_INLINE = re.compile(
    rf"(?im)^(?:{ART_WORD}\s*|Art\.?\s*){NUM}\s*[:\.\-–]\s*(?P<title>[^\n]{{0,140}})$"
)

# Some texts have: "154. Information in cognizable cases.—(1) ..."
# Title may be empty on the line; keep safe fallback.
def clean_number(n: str) -> str:
    n = n.strip()
    n = re.sub(r"\s+", "", n)
    n = n.replace("–", "-")
    return n


def slice_blocks(
    law_code: str, file_name: str, text: str, limit_blocks: int = 20000
) -> List[Slice]:
    # Decide whether to prioritize article parsing (constitution) or section parsing
    is_const = law_code == "CONST"
    norm = normalize_text(text)

    matches: List[Tuple[int, int, str, str]] = []
    # collect matches for sections/articles
    for m in RX_SECTION_LINE.finditer(norm):
        start = m.start()
        num = clean_number(m.group("num") or "")
        title = (m.group("title") or "").strip()
        matches.append((start, m.end(), "section", num, title))

    for m in RX_ARTICLE_LINE.finditer(norm):
        start = m.start()
        num = clean_number(m.group("num") or "")
        title = (m.group("title") or "").strip()
        matches.append((start, m.end(), "article", num, title))

    for m in RX_ARTICLE_INLINE.finditer(norm):
        start = m.start()
        num = clean_number(m.group("num") or "")
        title = (m.group("title") or "").strip()
        matches.append((start, m.end(), "article", num, title))

    if not matches:
        return []

    # Sort by start position
    matches.sort(key=lambda x: x[0])

    # If constitution, prefer article blocks, but keep sections if present (some constitution dumps show "SECTION" in schedules)
    if is_const:
        pass
    else:
        # Non-constitution: keep both, but section blocks usually dominate
        pass

    out: List[Slice] = []
    for i, (start, end, kind, num, title) in enumerate(matches):
        if not num:
            continue
        next_start = matches[i + 1][0] if i + 1 < len(matches) else len(norm)
        block = norm[start:next_start].strip()

        # Guardrails: blocks that are too tiny are often false positives
        if len(block) < 80:
            continue

        # Title fallback: take first line after header if empty
        if not title:
            lines = block.splitlines()
            if len(lines) > 1:
                title = lines[1].strip()[:120]

        out.append(
            Slice(
                law_code=law_code,
                kind=kind,
                number=num,
                title=title[:200],
                text=block[:20000],  # keep blocks bounded; enough for quoting
                source_file=file_name[:260],
            )
        )
        if len(out) >= limit_blocks:
            break

    return out


def init_db(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("PRAGMA temp_store=MEMORY;")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS law_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            law_code TEXT NOT NULL,
            kind TEXT NOT NULL,
            number TEXT NOT NULL,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            source_file TEXT NOT NULL
        );
        """
    )

    cur.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_law_blocks
        ON law_blocks (law_code, kind, number);
        """
    )

    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_law_blocks_law_kind_num
        ON law_blocks (law_code, kind, number);
        """
    )

    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_law_blocks_title
        ON law_blocks (title);
        """
    )

    conn.commit()


def upsert_blocks(conn: sqlite3.Connection, blocks: List[Slice]) -> Tuple[int, int]:
    inserted = 0
    updated = 0
    cur = conn.cursor()
    for b in blocks:
        try:
            cur.execute(
                """
                INSERT INTO law_blocks (law_code, kind, number, title, text, source_file)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(law_code, kind, number) DO UPDATE SET
                    title=excluded.title,
                    text=excluded.text,
                    source_file=excluded.source_file
                """,
                (b.law_code, b.kind, b.number, b.title, b.text, b.source_file),
            )
            # sqlite rowcount is 1 for insert, 1 for update here; we can detect by trying to fetch existing first, but keep fast
            # approximate: treat as inserted when changes() indicates new row is created
            # For simplicity, count as updated if already exists
            # We can do a quick select for existence:
            cur2 = conn.execute(
                "SELECT 1 FROM law_blocks WHERE law_code=? AND kind=? AND number=? LIMIT 1",
                (b.law_code, b.kind, b.number),
            )
            if cur2.fetchone():
                # After insert/update it exists; decide by lastrowid heuristic
                # Not reliable for upsert. Keep a conservative estimate:
                updated += 1
            else:
                inserted += 1
        except Exception:
            continue

    conn.commit()
    # This (updated count) is approximate; we will compute totals from DB anyway.
    return inserted, updated


def main() -> None:
    t0 = time.time()
    data = load_pdf_data()
    print(f"Loaded {len(data)} documents from {PDF_JSON_PATH}")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        print(f"Overwriting existing DB: {DB_PATH}")
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    total_blocks = 0
    law_counts: Dict[str, int] = {}

    # Batch commit for speed
    batch: List[Slice] = []
    batch_size = 800

    for idx, item in enumerate(data):
        file_name = item.get("file_name", "")
        text = item.get("text", "")
        if not text:
            continue

        law_code = detect_law_code(file_name, text)
        blocks = slice_blocks(law_code, file_name, text)

        if blocks:
            batch.extend(blocks)
            law_counts[law_code] = law_counts.get(law_code, 0) + len(blocks)
            total_blocks += len(blocks)

        if len(batch) >= batch_size:
            upsert_blocks(conn, batch)
            batch.clear()

        if (idx + 1) % 50 == 0:
            elapsed = time.time() - t0
            print(f"Processed {idx+1}/{len(data)} docs | blocks={total_blocks} | {elapsed:.1f}s")

    if batch:
        upsert_blocks(conn, batch)
        batch.clear()

    # Final stats
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM law_blocks;")
    db_total = int(cur.fetchone()[0])

    cur.execute(
        "SELECT law_code, kind, COUNT(*) FROM law_blocks GROUP BY law_code, kind ORDER BY law_code, kind;"
    )
    rows = cur.fetchall()

    print("\n=== INDEX BUILD COMPLETE ===")
    print(f"DB: {DB_PATH.resolve()}")
    print(f"Blocks indexed (db): {db_total}")
    print("Breakdown:")
    for law_code, kind, cnt in rows:
        print(f"  - {law_code} | {kind} | {cnt}")

    print(f"\nTime: {time.time() - t0:.1f}s")
    conn.close()


if __name__ == "__main__":
    main()
