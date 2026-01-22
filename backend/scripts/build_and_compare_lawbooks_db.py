import re
import sqlite3
import hashlib
from pathlib import Path
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple, Dict


# ---------- Config ----------
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent  # .../backend
DATA_DIR = BACKEND_DIR / "data"

# Your extracted text lives here (based on your screenshot)
LAWBOOKS_TEXT_DIR = DATA_DIR / "lawbooks_text"

# Output DB
OUT_DB = DATA_DIR / "lawbooks_clean.sqlite"

# Main DB (already exists)
MAIN_DB = DATA_DIR / "legal_db.sqlite"


# ---------- Helpers ----------
def norm_space(s: str) -> str:
    # remove soft hyphen, normalize whitespace
    s = s.replace("\u00ad", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def text_hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8", errors="ignore")).hexdigest()


def is_toc_noise_line(line: str) -> bool:
    """
    Detect common TOC lines:
    - dotted leaders ............
    - ends with a page number
    - very short numbered headings with dots
    """
    l = line.strip()
    if not l:
        return True
    if "...." in l or re.search(r"\.{5,}", l):
        return True
    if re.search(r"\s\d{1,4}\s*$", l) and len(l) < 140:
        # looks like: "Article 9 Security of person ..... 7"
        return True
    return False


def strip_page_headers(text: str) -> str:
    # Remove common "Page X of Y" lines
    text = re.sub(r"(?im)^\s*page\s+\d+\s+of\s+\d+\s*$", "", text)
    # Remove "Updated till ..." kind of footers
    text = re.sub(r"(?im)^\s*updated\s+till.*$", "", text)
    return text


def detect_law_name(source_file: str) -> str:
    name = source_file.lower()

    if "penal code" in name or "ppc" in name:
        return "Pakistan Penal Code 1860"
    if "crpc" in name or "criminal procedure" in name:
        return "Code of Criminal Procedure 1898"
    if "civil_procedure" in name or "code_of_civil_procedure" in name or "cpc" in name:
        return "Code of Civil Procedure 1908"
    if "constitution" in name:
        return "Constitution of Pakistan 1973"
    if "qanun-e-shahadat" in name or "shahadat" in name:
        return "Qanun-e-Shahadat Order 1984"
    if "muslim-family-laws" in name or "family laws ordinance" in name:
        return "Muslim Family Laws Ordinance 1961"

    return "OTHER"


@dataclass
class LawBlock:
    law_name: str
    kind: str           # section | article | rule
    number: str         # "154" | "199" | "Order XXI Rule 26" etc
    title: str
    text: str
    source_file: str
    h: str


# ---------- Parsers ----------
ARTICLE_RE = re.compile(r"(?im)^\s*(?:article|art\.)\s+(\d+[a-zA-Z]?)\s*[\.\-–—]?\s*(.*)\s*$")
SECTION_RE = re.compile(r"(?m)^\s*(\d+[a-zA-Z]?)\.\s+(.+?)\s*$")
ORDER_RE = re.compile(r"(?im)^\s*order\s+([ivxlcdm]+)\b")
RULE_RE = re.compile(r"(?m)^\s*(\d+[a-zA-Z]?)\.\s+(.+?)\s*$")


def remove_toc(text: str) -> str:
    """
    Remove TABLE OF CONTENTS region (very common in PDFs).
    Strategy:
    - If "CONTENTS" appears early, skip lines until we hit a strong body marker.
    """
    lines = text.splitlines()
    if not lines:
        return text

    joined_head = "\n".join(lines[:200]).lower()
    has_contents = ("contents" in joined_head) or ("c o n t e n t s" in joined_head)

    if not has_contents:
        return text

    out: List[str] = []
    in_toc = True
    for i, raw in enumerate(lines):
        line = raw.strip()

        if in_toc:
            # Exit TOC when we hit real body markers
            if re.match(r"(?i)^\s*(part|chapter)\b", line):
                in_toc = False
            elif re.match(r"(?i)^\s*(?:article|art\.)\s+\d", line):
                in_toc = False
            elif re.match(r"^\s*\d+\.\s+\S+", line) and not is_toc_noise_line(line):
                # section-like line that is NOT dotted leader
                in_toc = False

        if not in_toc:
            out.append(raw)

    return "\n".join(out) if out else text


def parse_articles(text: str, law_name: str, source_file: str) -> List[LawBlock]:
    blocks: List[LawBlock] = []
    matches = list(ARTICLE_RE.finditer(text))
    if not matches:
        return blocks

    for idx, m in enumerate(matches):
        number = m.group(1).strip()
        title = norm_space(m.group(2) or "")
        start = m.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end].strip()

        body_norm = norm_space(body)
        if len(body_norm) < 40:
            continue

        # Filter TOC-like lines
        if is_toc_noise_line(body_norm):
            continue

        h = text_hash(body_norm)
        blocks.append(
            LawBlock(
                law_name=law_name,
                kind="article",
                number=number,
                title=title,
                text=body_norm,
                source_file=source_file,
                h=h,
            )
        )
    return blocks


def parse_sections_generic(text: str, law_name: str, source_file: str) -> List[LawBlock]:
    blocks: List[LawBlock] = []
    matches = list(SECTION_RE.finditer(text))
    if not matches:
        return blocks

    for idx, m in enumerate(matches):
        number = m.group(1).strip()
        title = norm_space(m.group(2) or "")
        start = m.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        body_norm = norm_space(body)

        if len(body_norm) < 60:
            continue

        # Avoid TOC noise: dotted leaders, short lines, etc.
        head_line = norm_space(body.splitlines()[0]) if body else ""
        if is_toc_noise_line(head_line):
            continue

        h = text_hash(body_norm)
        blocks.append(
            LawBlock(
                law_name=law_name,
                kind="section",
                number=number,
                title=title,
                text=body_norm,
                source_file=source_file,
                h=h,
            )
        )
    return blocks


def parse_cpc_orders_rules(text: str, law_name: str, source_file: str) -> List[LawBlock]:
    """
    CPC often contains:
      ORDER I
      1. Who may be joined as plaintiffs....
      2. ...
    We store rules as: "Order I Rule 1"
    """
    blocks: List[LawBlock] = []

    # Find all ORDER boundaries
    order_matches = list(ORDER_RE.finditer(text))
    if not order_matches:
        return blocks

    for oi, om in enumerate(order_matches):
        order_roman = om.group(1).upper()
        start = om.start()
        end = order_matches[oi + 1].start() if oi + 1 < len(order_matches) else len(text)
        chunk = text[start:end]

        # Find rules inside this order
        rule_matches = list(RULE_RE.finditer(chunk))
        for ri, rm in enumerate(rule_matches):
            rule_no = rm.group(1).strip()
            title = norm_space(rm.group(2) or "")

            rstart = rm.start()
            rend = rule_matches[ri + 1].start() if ri + 1 < len(rule_matches) else len(chunk)
            body = chunk[rstart:rend].strip()
            body_norm = norm_space(body)

            if len(body_norm) < 60:
                continue

            head_line = norm_space(body.splitlines()[0]) if body else ""
            if is_toc_noise_line(head_line):
                continue

            number = f"Order {order_roman} Rule {rule_no}"
            h = text_hash(body_norm)
            blocks.append(
                LawBlock(
                    law_name=law_name,
                    kind="rule",
                    number=number,
                    title=title,
                    text=body_norm,
                    source_file=source_file,
                    h=h,
                )
            )

    return blocks


def parse_file(path: Path) -> List[LawBlock]:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    raw = strip_page_headers(raw)
    raw = remove_toc(raw)

    law_name = detect_law_name(path.name)

    # Constitution: Articles (not sections)
    if law_name == "Constitution of Pakistan 1973":
        blocks = parse_articles(raw, law_name, path.name)
        # Fallback: some dumps might not include "Article" keyword properly
        if not blocks:
            blocks = parse_sections_generic(raw, law_name, path.name)
        return blocks

    # CPC: Orders/Rules + Sections fallback
    if law_name == "Code of Civil Procedure 1908":
        blocks = []
        blocks.extend(parse_cpc_orders_rules(raw, law_name, path.name))
        # Also capture numeric "sections" if present in the same file
        blocks.extend(parse_sections_generic(raw, law_name, path.name))
        return blocks

    # Others: normal section parsing
    return parse_sections_generic(raw, law_name, path.name)


# ---------- SQLite ----------
def ensure_out_db(db_path: Path) -> sqlite3.Connection:
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE law_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            law_name TEXT NOT NULL,
            kind TEXT NOT NULL,
            number TEXT NOT NULL,
            title TEXT,
            text TEXT NOT NULL,
            text_hash TEXT NOT NULL,
            source_file TEXT
        );
        """
    )
    cur.execute("CREATE INDEX idx_blocks_key ON law_blocks(law_name, kind, number);")
    cur.execute("CREATE INDEX idx_blocks_hash ON law_blocks(text_hash);")
    conn.commit()
    return conn


def insert_blocks_dedup(conn: sqlite3.Connection, blocks: List[LawBlock]) -> int:
    """
    Dedupe strategy:
    - Primary key: (law_name, kind, number)
    - If same key repeats:
        keep the longer text (more complete)
    - Also dedupe exact same text by text_hash
    """
    cur = conn.cursor()

    by_key: Dict[Tuple[str, str, str], LawBlock] = {}
    seen_hash: set = set()

    for b in blocks:
        # exact text dedupe
        if b.h in seen_hash:
            continue
        seen_hash.add(b.h)

        k = (b.law_name, b.kind, b.number)
        if k not in by_key:
            by_key[k] = b
        else:
            # keep longer body
            if len(b.text) > len(by_key[k].text):
                by_key[k] = b

    rows = list(by_key.values())
    cur.executemany(
        """
        INSERT INTO law_blocks (law_name, kind, number, title, text, text_hash, source_file)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [(r.law_name, r.kind, r.number, r.title, r.text, r.h, r.source_file) for r in rows],
    )
    conn.commit()
    return len(rows)


# ---------- Comparison ----------
def norm_law_name_for_match(name: str) -> str:
    return norm_space(name).lower()


def build_main_index(main_db: Path) -> set:
    conn = sqlite3.connect(str(main_db))
    cur = conn.cursor()

    # legal_db.sqlite -> table law_sections
    cur.execute("SELECT law_name, section_number FROM law_sections")
    rows = cur.fetchall()
    conn.close()

    idx = set()
    for law_name, sec_no in rows:
        ln = norm_law_name_for_match(law_name or "")
        sn = norm_space(str(sec_no or "")).lower()
        idx.add((ln, sn))
    return idx


def candidate_numbers_for_match(block: LawBlock) -> List[str]:
    n = norm_space(block.number)

    # For articles: main DB might store "1" or "Article 1"
    if block.kind == "article":
        return [n.lower(), f"article {n}".lower()]

    # For CPC rules: main DB probably does NOT store these in law_sections
    # but we still keep it as-is for reporting.
    return [n.lower()]


def compare_to_main(clean_db: Path, main_db: Path) -> Tuple[int, int, List[Tuple[str, str, str, str]]]:
    main_idx = build_main_index(main_db)

    conn = sqlite3.connect(str(clean_db))
    cur = conn.cursor()
    cur.execute("SELECT law_name, kind, number, title, source_file FROM law_blocks")
    rows = cur.fetchall()
    conn.close()

    missing: List[Tuple[str, str, str, str]] = []

    for law_name, kind, number, title, source_file in rows:
        b = LawBlock(
            law_name=law_name,
            kind=kind,
            number=number,
            title=title or "",
            text="",
            source_file=source_file or "",
            h="",
        )

        ln = norm_law_name_for_match(b.law_name)

        found = False
        for cand in candidate_numbers_for_match(b):
            if (ln, cand) in main_idx:
                found = True
                break

        if not found:
            missing.append((b.law_name, b.kind, b.number, b.source_file))

    return len(rows), len(main_idx), missing


def write_missing_reports(missing: List[Tuple[str, str, str, str]]) -> None:
    out_csv = DATA_DIR / "compare_missing_in_main.csv"
    out_json = DATA_DIR / "compare_missing_in_main.json"

    # CSV
    with out_csv.open("w", encoding="utf-8", newline="") as f:
        f.write("law_name,kind,number,source_file\n")
        for law_name, kind, number, source_file in missing:
            # basic csv escaping
            law_name = law_name.replace('"', '""')
            kind = kind.replace('"', '""')
            number = number.replace('"', '""')
            source_file = source_file.replace('"', '""')
            f.write(f'"{law_name}","{kind}","{number}","{source_file}"\n')

    # JSON (simple)
    import json
    items = [
        {"law_name": a, "kind": b, "number": c, "source_file": d}
        for (a, b, c, d) in missing
    ]
    out_json.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote: {out_csv}")
    print(f"Wrote: {out_json}")


# ---------- Main ----------
def main() -> None:
    if not LAWBOOKS_TEXT_DIR.exists():
        print(f"❌ No lawbook text directory found: {LAWBOOKS_TEXT_DIR}")
        print("Fix: ensure extracted .txt files are inside: backend/data/lawbooks_text/")
        return

    txt_files = sorted(LAWBOOKS_TEXT_DIR.glob("*.txt"))
    if not txt_files:
        print("❌ No .txt files found in lawbooks_text")
        return

    all_blocks: List[LawBlock] = []

    for p in txt_files:
        blocks = parse_file(p)
        print(f"✔ {p.name}: parsed blocks = {len(blocks)}")
        all_blocks.extend(blocks)

    conn = ensure_out_db(OUT_DB)
    stored = insert_blocks_dedup(conn, all_blocks)
    conn.close()

    print()
    print(f"✔ Clean DB created: {OUT_DB}")
    print(f"✔ Parsed total blocks: {len(all_blocks)}")
    print(f"✔ Rows stored (after dedupe): {stored}")

    if not MAIN_DB.exists():
        print(f"⚠ Main DB not found: {MAIN_DB}")
        return

    clean_count, main_count, missing = compare_to_main(OUT_DB, MAIN_DB)

    print()
    print("=== DATABASE COMPARISON ===")
    print(f"Clean DB blocks : {clean_count}")
    print(f"Main DB sections: {main_count}")
    print(f"Blocks MISSING in main DB: {len(missing)}")

    print("Sample missing (max 10):")
    for m in missing[:10]:
        print(f"  - {m[0]} | {m[2]} | {m[1]} | {m[3]}")

    write_missing_reports(missing)


if __name__ == "__main__":
    main()
