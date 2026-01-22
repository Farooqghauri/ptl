# backend/scripts/debug_resolve_targets.py
import os
import sqlite3
from typing import List, Tuple

# ✅ Update this if your DB path is different
DB_PATH = os.path.join("data", "legal_db.sqlite")


def connect(db_path: str) -> sqlite3.Connection:
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"DB not found: {os.path.abspath(db_path)}")
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    return con


def print_rows(title: str, rows: List[sqlite3.Row], columns: List[str], max_rows: int = 10) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)
    print(f"Rows: {len(rows)} (showing up to {max_rows})\n")
    for i, r in enumerate(rows[:max_rows], 1):
        print(f"[{i}]")
        for c in columns:
            val = r[c]
            if isinstance(val, str):
                val = val.replace("\n", " ")
                if len(val) > 220:
                    val = val[:220] + "..."
            print(f"  {c}: {val}")
        print("")


def check_constitution_199(con: sqlite3.Connection) -> None:
    # Goal: find the REAL Article 199 (largest section_text), avoid TOC/heading lines
    q = """
    SELECT
      id,
      law_name,
      section_number,
      section_title,
      length(section_text) AS text_len,
      source_file,
      substr(section_text, 1, 240) AS text_snippet
    FROM law_sections
    WHERE law_name LIKE '%Constitution%'
      AND section_number = '199'
    ORDER BY text_len DESC
    LIMIT 20;
    """
    rows = con.execute(q).fetchall()
    print_rows(
        "A) Constitution Article 199 candidates (sorted by longest text first)",
        rows,
        ["id", "law_name", "section_number", "text_len", "section_title", "source_file", "text_snippet"],
        max_rows=10,
    )

    if not rows:
        print("❌ No rows found for Constitution section_number='199'.")
        return

    best = rows[0]
    if best["text_len"] and best["text_len"] < 300:
        print("⚠️ WARNING: The longest Article 199 text is still very short.")
        print("This usually means the DB contains TOC/heading lines but not the real Article body.\n")
    else:
        print("✅ Found a long Article 199 candidate (likely real body).")


def check_cpc_order_21_rule_26(con: sqlite3.Connection) -> None:
    # Goal: find how Order XXI Rule 26 is represented in your DB text
    # We'll search multiple patterns to capture common formats.
    patterns: List[Tuple[str, str]] = [
        ("Order XXI Rule 26", "%Order%XXI%Rule%26%"),
        ("Order 21 Rule 26", "%Order%21%Rule%26%"),
        ("O.21 R.26", "%O.%21%R.%26%"),
        ("Order 21, Rule 26", "%Order%21%Rule%26%"),
        ("Rule 26 (broad)", "%Rule%26%"),
    ]

    # We'll run a single query with ORs for performance + show matches.
    q = """
    SELECT
      id,
      law_name,
      section_number,
      section_title,
      length(section_text) AS text_len,
      source_file,
      substr(section_text, 1, 240) AS text_snippet
    FROM law_sections
    WHERE law_name LIKE '%Civil Procedure%'
      AND (
        section_text LIKE ? OR
        section_text LIKE ? OR
        section_text LIKE ? OR
        section_text LIKE ? OR
        section_text LIKE ?
      )
    ORDER BY text_len DESC
    LIMIT 30;
    """
    params = [p[1] for p in patterns]
    rows = con.execute(q, params).fetchall()
    print_rows(
        "B) CPC Order 21 Rule 26 candidates (searching multiple patterns)",
        rows,
        ["id", "law_name", "section_number", "text_len", "section_title", "source_file", "text_snippet"],
        max_rows=12,
    )

    if not rows:
        print("❌ No matches found for Order 21 Rule 26 patterns.")
        print("That means your resolver cannot fetch it because it may not exist in DB as text, or it is formatted differently.\n")
        return

    # Try to guess best “real” row by length and presence of both "Order" and "Rule" in snippet
    best = None
    for r in rows:
        snippet = (r["text_snippet"] or "").lower()
        if "order" in snippet and "rule" in snippet:
            best = r
            break
    best = best or rows[0]

    print("✅ Best guess match (based on snippet/length):")
    for k in ["id", "law_name", "section_number", "section_title", "text_len", "source_file"]:
        print(f"  {k}: {best[k]}")
    print("  snippet:", (best["text_snippet"] or "").replace("\n", " ")[:240])


def main() -> None:
    print("=== DEBUG RESOLVE TARGETS ===")
    print("DB:", os.path.abspath(DB_PATH))

    con = connect(DB_PATH)
    try:
        check_constitution_199(con)
        check_cpc_order_21_rule_26(con)
        print("\nDONE")
    finally:
        con.close()


if __name__ == "__main__":
    main()
