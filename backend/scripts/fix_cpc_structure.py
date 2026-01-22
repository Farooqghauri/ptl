"""
CPC Database Restructuring Script
Fixes Order/Rule structure and removes duplicates
Run: python backend/scripts/fix_cpc_structure.py
"""

import sqlite3
import re
import os
from typing import Optional, Dict, List, Tuple

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "data", "legal_db.sqlite")
BACKUP_PATH = DB_PATH.replace(".sqlite", "_backup.sqlite")

# Roman numeral mapping
ROMAN_TO_INT = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
    "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10,
    "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15,
    "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20,
    "XXI": 21, "XXII": 22, "XXIII": 23, "XXIV": 24, "XXV": 25,
    "XXVI": 26, "XXVII": 27, "XXVIII": 28, "XXIX": 29, "XXX": 30,
    "XXXI": 31, "XXXII": 32, "XXXIII": 33, "XXXIV": 34, "XXXV": 35,
    "XXXVI": 36, "XXXVII": 37, "XXXVIII": 38, "XXXIX": 39, "XL": 40,
    "XLI": 41, "XLII": 42, "XLIII": 43, "XLIV": 44, "XLV": 45,
    "XLVI": 46, "XLVII": 47, "XLVIII": 48, "XLIX": 49, "L": 50,
    "LI": 51,
}

INT_TO_ROMAN = {v: k for k, v in ROMAN_TO_INT.items()}

# CPC Order titles for identification
CPC_ORDER_TITLES = {
    1: "PARTIES TO SUITS",
    2: "FRAME OF SUIT",
    3: "RECOGNIZED AGENTS AND PLEADERS",
    4: "INSTITUTION OF SUITS",
    5: "ISSUE AND SERVICE OF SUMMONS",
    6: "PLEADINGS GENERALLY",
    7: "PLAINT",
    8: "WRITTEN STATEMENT",
    9: "APPEARANCE OF PARTIES AND CONSEQUENCE OF NON-APPEARANCE",
    10: "EXAMINATION OF PARTIES BY THE COURT",
    11: "DISCOVERY AND INSPECTION",
    12: "ADMISSIONS",
    13: "PRODUCTION, IMPOUNDING AND RETURN OF DOCUMENTS",
    14: "SETTLEMENT OF ISSUES AND DETERMINATION OF SUIT ON ISSUES OF LAW",
    15: "DISPOSAL OF THE SUIT AT THE FIRST HEARING",
    16: "ADJOURNMENTS",
    17: "AMENDMENT OF PLEADINGS",
    18: "FAILURE TO APPEAR OR TO PRODUCE EVIDENCE",
    19: "AFFIDAVITS",
    20: "JUDGMENT AND DECREE",
    21: "EXECUTION OF DECREES AND ORDERS",
    22: "DEATH, MARRIAGE AND INSOLVENCY OF PARTIES",
    23: "WITHDRAWAL AND ADJUSTMENT OF SUITS",
    24: "PAYMENT INTO COURT",
    25: "SECURITY FOR COSTS",
    26: "SUITS BY OR AGAINST GOVERNMENT",
    27: "SUITS BY INDIGENT PERSONS",
    28: "ARREST AND ATTACHMENT BEFORE JUDGMENT",
    29: "RECEIVERS",
    30: "RECEIVERS",
    31: "APPEALS FROM ORIGINAL DECREES",
    32: "APPEALS FROM APPELLATE DECREES",
    33: "APPEALS FROM ORDERS",
    34: "EXECUTION PROCEEDINGS",
    35: "INTERPLEADER",
    36: "SPECIAL CASE",
    37: "SUMMARY PROCEDURE",
    38: "ARREST BEFORE JUDGMENT",
    39: "TEMPORARY INJUNCTIONS AND INTERLOCUTORY ORDERS",
    40: "APPOINTMENT OF RECEIVERS",
    41: "APPEALS FROM ORIGINAL DECREES",
    42: "APPEALS FROM APPELLATE DECREES",
    43: "APPEALS FROM ORDERS",
    44: "APPEALS BY INDIGENT PERSONS",
    45: "APPEALS TO THE SUPREME COURT",
    46: "REFERENCE",
    47: "REVIEW",
    48: "MISCELLANEOUS",
    49: "CHARTERED HIGH COURTS",
    50: "PROVINCIAL SMALL CAUSE COURTS",
    51: "CONTEMPT OF COURT",
}


def backup_database():
    """Create backup before modifications."""
    import shutil
    if os.path.exists(DB_PATH):
        shutil.copy2(DB_PATH, BACKUP_PATH)
        print(f"✓ Backup created: {BACKUP_PATH}")
    else:
        print(f"✗ Database not found: {DB_PATH}")
        return False
    return True


def detect_order_from_text(text: str, title: str) -> Optional[int]:
    """Detect Order number from text content."""
    if not text:
        return None

    combined = f"{title or ''} {text}"

    # Pattern: "ORDER XXI" or "ORDER 21"
    patterns = [
        r"ORDER\s+([IVXLC]+)\b",  # Roman numerals
        r"ORDER\s+(\d+)\b",  # Arabic numerals
    ]

    for pattern in patterns:
        match = re.search(pattern, combined, re.IGNORECASE)
        if match:
            val = match.group(1).upper()
            if val in ROMAN_TO_INT:
                return ROMAN_TO_INT[val]
            elif val.isdigit():
                return int(val)

    return None


def add_new_columns(conn: sqlite3.Connection):
    """Add order_number and rule_number columns if not exist."""
    cursor = conn.cursor()

    # Check existing columns
    cursor.execute("PRAGMA table_info(law_sections);")
    columns = [col[1] for col in cursor.fetchall()]

    if "order_number" not in columns:
        cursor.execute("ALTER TABLE law_sections ADD COLUMN order_number INTEGER;")
        print("✓ Added 'order_number' column")

    if "rule_number" not in columns:
        cursor.execute("ALTER TABLE law_sections ADD COLUMN rule_number INTEGER;")
        print("✓ Added 'rule_number' column")

    conn.commit()


def process_cpc_orders(conn: sqlite3.Connection):
    """Process CPC data to identify and assign Order/Rule numbers."""
    cursor = conn.cursor()

    # Get all CPC rows ordered by ID
    cursor.execute("""
                   SELECT id, section_number, section_title, section_text
                   FROM law_sections
                   WHERE law_name = 'Code of Civil Procedure 1908'
                   ORDER BY id;
                   """)
    rows = cursor.fetchall()

    print(f"\nProcessing {len(rows)} CPC rows...")

    current_order = None
    updates = []
    order_changes = []

    for row in rows:
        row_id, section_num, title, text = row

        # Try to detect Order from text
        detected_order = detect_order_from_text(text or "", title or "")

        if detected_order:
            current_order = detected_order
            order_changes.append((row_id, detected_order))

        # Parse rule number from section_number
        rule_num = None
        if section_num:
            # Extract numeric part: "26" -> 26, "26A" -> 26
            match = re.match(r"(\d+)", str(section_num))
            if match:
                rule_num = int(match.group(1))

        if current_order and rule_num:
            updates.append((current_order, rule_num, row_id))

    print(f"✓ Detected {len(order_changes)} Order boundaries")
    print(f"✓ Prepared {len(updates)} row updates")

    # Apply updates
    cursor.executemany("""
                       UPDATE law_sections
                       SET order_number = ?,
                           rule_number  = ?
                       WHERE id = ?;
                       """, updates)

    conn.commit()
    print("✓ Order/Rule numbers assigned")


def remove_duplicates(conn: sqlite3.Connection):
    """Remove duplicate CPC entries, keeping best version."""
    cursor = conn.cursor()

    # Find duplicates in CPC
    cursor.execute("""
                   SELECT order_number, rule_number, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
                   FROM law_sections
                   WHERE law_name = 'Code of Civil Procedure 1908'
                     AND order_number IS NOT NULL
                     AND rule_number IS NOT NULL
                   GROUP BY order_number, rule_number
                   HAVING cnt > 1;
                   """)
    duplicates = cursor.fetchall()

    print(f"\nFound {len(duplicates)} duplicate Order/Rule combinations")

    ids_to_delete = []

    for dup in duplicates:
        order_num, rule_num, count, id_list = dup
        ids = [int(i) for i in id_list.split(",")]

        # Keep the row with longest text (most complete)
        cursor.execute(f"""
            SELECT id, LENGTH(COALESCE(section_text, '')) as text_len
            FROM law_sections
            WHERE id IN ({','.join(['?'] * len(ids))})
            ORDER BY text_len DESC;
        """, ids)
        ranked = cursor.fetchall()

        # Keep first (longest), delete rest
        keep_id = ranked[0][0]
        delete_ids = [r[0] for r in ranked[1:]]
        ids_to_delete.extend(delete_ids)

    if ids_to_delete:
        cursor.execute(f"""
            DELETE FROM law_sections
            WHERE id IN ({','.join(['?'] * len(ids_to_delete))});
        """, ids_to_delete)
        conn.commit()
        print(f"✓ Removed {len(ids_to_delete)} duplicate rows")
    else:
        print("✓ No duplicates to remove")


def create_cpc_index(conn: sqlite3.Connection):
    """Create index for fast Order/Rule lookups."""
    cursor = conn.cursor()

    cursor.execute("""
                   CREATE INDEX IF NOT EXISTS idx_cpc_order_rule
                       ON law_sections(law_name, order_number, rule_number)
                       WHERE law_name = 'Code of Civil Procedure 1908';
                   """)
    conn.commit()
    print("✓ Created Order/Rule index")


def verify_results(conn: sqlite3.Connection):
    """Verify the restructuring results."""
    cursor = conn.cursor()

    print("\n=== VERIFICATION ===\n")

    # Count by law
    cursor.execute("""
                   SELECT law_name, COUNT(*)
                   FROM law_sections
                   GROUP BY law_name;
                   """)
    print("Records by law:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")

    # CPC with Order/Rule
    cursor.execute("""
                   SELECT COUNT(*)
                   FROM law_sections
                   WHERE law_name = 'Code of Civil Procedure 1908'
                     AND order_number IS NOT NULL;
                   """)
    print(f"\nCPC rows with Order assigned: {cursor.fetchone()[0]}")

    # Sample Order XXI
    cursor.execute("""
                   SELECT order_number, rule_number, section_title
                   FROM law_sections
                   WHERE law_name = 'Code of Civil Procedure 1908'
                     AND order_number = 21
                   ORDER BY rule_number LIMIT 10;
                   """)
    print("\nSample Order XXI Rules:")
    for row in cursor.fetchall():
        print(f"  O.{row[0]} R.{row[1]}: {row[2][:50] if row[2] else 'No title'}...")

    # Check for remaining duplicates
    cursor.execute("""
                   SELECT order_number, rule_number, COUNT(*) as cnt
                   FROM law_sections
                   WHERE law_name = 'Code of Civil Procedure 1908'
                     AND order_number IS NOT NULL
                   GROUP BY order_number, rule_number
                   HAVING cnt > 1 LIMIT 5;
                   """)
    dups = cursor.fetchall()
    if dups:
        print(f"\n⚠ Remaining duplicates: {len(dups)}")
    else:
        print("\n✓ No duplicates remaining")


def main():
    print("=" * 50)
    print("CPC DATABASE RESTRUCTURING")
    print("=" * 50)

    # Backup
    if not backup_database():
        return

    # Connect
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        # Step 1: Add columns
        print("\n[1/5] Adding new columns...")
        add_new_columns(conn)

        # Step 2: Process Orders
        print("\n[2/5] Processing CPC Orders...")
        process_cpc_orders(conn)

        # Step 3: Remove duplicates
        print("\n[3/5] Removing duplicates...")
        remove_duplicates(conn)

        # Step 4: Create index
        print("\n[4/5] Creating index...")
        create_cpc_index(conn)

        # Step 5: Verify
        print("\n[5/5] Verifying results...")
        verify_results(conn)

        print("\n" + "=" * 50)
        print("✓ RESTRUCTURING COMPLETE")
        print("=" * 50)

    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()


if __name__ == "__main__":
    main()