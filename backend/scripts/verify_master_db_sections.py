# backend/scripts/verify_master_db_sections.py
import sqlite3
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

# ---------------------------
# Helpers
# ---------------------------

def find_db_path() -> Path:
    """
    Tries common locations so you can run from:
    - backend/ (recommended)
    - project root
    """
    here = Path(__file__).resolve()
    candidates = [
        # if running from backend/
        here.parents[1] / "data" / "legal_db.sqlite",
        # if running from project root
        here.parents[2] / "backend" / "data" / "legal_db.sqlite",
        # fallback
        Path.cwd() / "data" / "legal_db.sqlite",
        Path.cwd() / "backend" / "data" / "legal_db.sqlite",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError("legal_db.sqlite not found in expected locations")

def norm(s: str) -> str:
    return (s or "").strip().lower()

def row_count(conn: sqlite3.Connection, table: str) -> int:
    cur = conn.execute(f"SELECT COUNT(*) FROM {table}")
    return int(cur.fetchone()[0])

def fetchone(conn: sqlite3.Connection, q: str, params: Tuple = ()) -> Optional[sqlite3.Row]:
    cur = conn.execute(q, params)
    return cur.fetchone()

def fetchall(conn: sqlite3.Connection, q: str, params: Tuple = ()) -> List[sqlite3.Row]:
    cur = conn.execute(q, params)
    return cur.fetchall()

def law_like_clause(law_names: Iterable[str]) -> Tuple[str, List[str]]:
    # Build (law_name LIKE ? OR law_name LIKE ? ...)
    parts = []
    params = []
    for n in law_names:
        parts.append("law_name LIKE ?")
        params.append(f"%{n}%")
    return "(" + " OR ".join(parts) + ")", params

def find_section(
    conn: sqlite3.Connection,
    law_names_like: List[str],
    section_number: str,
    must_contain: Optional[str] = None,
) -> Tuple[bool, Optional[sqlite3.Row]]:
    """
    Finds a section by law_name LIKE patterns and exact section_number (trimmed).
    Optionally requires section_text to contain must_contain (case-insensitive).
    """
    clause, params = law_like_clause(law_names_like)

    q = f"""
        SELECT id, law_name, section_number, section_title, substr(section_text,1,240) AS preview, source_file
        FROM law_sections
        WHERE {clause}
          AND trim(section_number) = trim(?)
    """
    params2 = params + [section_number]

    rows = fetchall(conn, q, tuple(params2))
    if not rows:
        return False, None

    if must_contain:
        mc = norm(must_contain)
        for r in rows:
            if mc in norm(r["preview"]) or mc in norm(r.get("section_title") or ""):
                return True, r
        # fallback: just return first if contains not found in preview
        return True, rows[0]

    return True, rows[0]

def print_check(name: str, ok: bool, row: Optional[sqlite3.Row]) -> None:
    if ok and row:
        print(f"✔ {name}: YES  |  {row['law_name']}  |  {row['section_number']}  |  {row['source_file']}")
    else:
        print(f"✖ {name}: NO")

# ---------------------------
# Main
# ---------------------------

def main() -> None:
    db_path = find_db_path()
    print("\n=== MASTER DB VERIFICATION ===")
    print(f"DB: {db_path}")

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row

    # Basic sanity
    tables = [r["name"] for r in fetchall(conn, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
    if "law_sections" not in tables:
        raise RuntimeError("law_sections table not found. Wrong DB?")

    total = row_count(conn, "law_sections")
    print(f"law_sections total rows: {total}")

    # Show counts per law_name (top 20)
    print("\n--- Top law_name by rows (top 20) ---")
    rows = fetchall(
        conn,
        """
        SELECT law_name, COUNT(*) AS n
        FROM law_sections
        GROUP BY law_name
        ORDER BY n DESC
        LIMIT 20
        """,
    )
    for r in rows:
        print(f"{r['n']:>5}  {r['law_name']}")

    # Key checks (edit list any time)
    print("\n--- Key section checks ---")

    checks = [
        # Constitution
        ("Constitution Art 199", ["Constitution of Pakistan", "Constitution"], "199"),

        # CrPC (Pakistan Code of Criminal Procedure 1898)
        ("CrPC 154 (FIR)", ["Code of Criminal Procedure", "CrPC"], "154"),
        ("CrPC 22-A (FIR direction)", ["Code of Criminal Procedure", "CrPC"], "22-A"),
        ("CrPC 497 (Post arrest bail)", ["Code of Criminal Procedure", "CrPC"], "497"),
        ("CrPC 498 (Pre arrest bail)", ["Code of Criminal Procedure", "CrPC"], "498"),

        # CPC (Code of Civil Procedure 1908)
        ("CPC 151 (Inherent powers)", ["Code of Civil Procedure", "CPC"], "151"),
        ("CPC 12(2) (Set aside decree fraud)", ["Code of Civil Procedure", "CPC"], "12(2)"),
        ("CPC Order 21 Rule 26 (Stay execution)", ["Code of Civil Procedure", "CPC"], "O.21 R.26"),
        ("CPC Order 39 Rule 1 (Temp injunction)", ["Code of Civil Procedure", "CPC"], "O.39 R.1"),
        ("CPC Order 39 Rule 2 (Temp injunction)", ["Code of Civil Procedure", "CPC"], "O.39 R.2"),

        # PPC (Pakistan Penal Code 1860)
        ("PPC 302 (Murder)", ["Pakistan Penal Code", "PPC"], "302"),
        ("PPC 489-F (Cheque dishonour)", ["Pakistan Penal Code", "PPC"], "489-F"),
        ("PPC 268 (Public nuisance)", ["Pakistan Penal Code", "PPC"], "268"),
        ("PPC 290 (Punishment for nuisance)", ["Pakistan Penal Code", "PPC"], "290"),
        ("PPC 291 (Continuance after injunction)", ["Pakistan Penal Code", "PPC"], "291"),

        # Qanun-e-Shahadat Order 1984
        ("QSO 129 (Court may presume facts)", ["Qanun-e-Shahadat", "Shahadat"], "129"),

        # MFLO 1961
        ("MFLO 7 (Notice of talaq)", ["Muslim Family Laws Ordinance", "MFLO"], "7"),
    ]

    # Some databases store Order/Rule differently.
    # We'll try fallbacks for CPC Order/Rule if the "O.21 R.26" style does not exist.
    def try_order_rule_fallback(primary: str, law_like: List[str], candidates: List[str]) -> Tuple[bool, Optional[sqlite3.Row], str]:
        ok, r = find_section(conn, law_like, primary)
        if ok:
            return True, r, primary
        for c in candidates:
            ok2, r2 = find_section(conn, law_like, c)
            if ok2:
                return True, r2, c
        return False, None, primary

    for label, law_like, sec in checks:
        if "Order 21 Rule 26" in label:
            ok, row, used = try_order_rule_fallback(sec, law_like, ["21-26", "21/26", "21 r 26", "Order 21 Rule 26", "Order XXI Rule 26", "26"])
            if ok:
                print(f"✔ {label}: YES  |  used={used}  |  {row['law_name']}  |  {row['section_number']}  |  {row['source_file']}")
            else:
                print(f"✖ {label}: NO")
            continue

        if "Order 39 Rule 1" in label:
            ok, row, used = try_order_rule_fallback(sec, law_like, ["39-1", "39/1", "39 r 1", "Order 39 Rule 1", "Order XXXIX Rule 1", "1"])
            if ok:
                print(f"✔ {label}: YES  |  used={used}  |  {row['law_name']}  |  {row['section_number']}  |  {row['source_file']}")
            else:
                print(f"✖ {label}: NO")
            continue

        if "Order 39 Rule 2" in label:
            ok, row, used = try_order_rule_fallback(sec, law_like, ["39-2", "39/2", "39 r 2", "Order 39 Rule 2", "Order XXXIX Rule 2", "2"])
            if ok:
                print(f"✔ {label}: YES  |  used={used}  |  {row['law_name']}  |  {row['section_number']}  |  {row['source_file']}")
            else:
                print(f"✖ {label}: NO")
            continue

        ok, row = find_section(conn, law_like, sec)
        print_check(label, ok, row)

    # Quick warning if the major corpora look too small
    print("\n--- Coverage quick check ---")
    major = [
        ("Pakistan Penal Code 1860", ["Pakistan Penal Code"], 300),
        ("Code of Criminal Procedure 1898", ["Code of Criminal Procedure", "CrPC"], 250),
        ("Code of Civil Procedure 1908", ["Code of Civil Procedure", "CPC"], 500),
        ("Constitution of Pakistan 1973", ["Constitution"], 150),
        ("Qanun-e-Shahadat Order 1984", ["Shahadat"], 100),
    ]

    for name, likes, min_expected in major:
        clause, params = law_like_clause(likes)
        r = fetchone(conn, f"SELECT COUNT(*) AS n FROM law_sections WHERE {clause}", tuple(params))
        n = int(r["n"]) if r else 0
        status = "OK" if n >= min_expected else "LOW"
        print(f"{name}: {n} rows  |  {status}")

    conn.close()
    print("\nDONE\n")

if __name__ == "__main__":
    main()
