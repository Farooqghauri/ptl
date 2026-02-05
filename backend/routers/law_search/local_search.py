"""
LAYER 1: Local Database Search
Searches legal_db.sqlite for law sections and judgments
"""

import sqlite3
import re
import os
from typing import List, Dict, Optional

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "legal_db.sqlite")


def get_connection():
    """Get database connection."""
    if not os.path.exists(DB_PATH):
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def normalize_section(section: str) -> str:
    """Normalize section number: 007 → 7, 489-F → 489F"""
    s = section.strip()
    s = re.sub(r"^0+", "", s)  # Remove leading zeros
    s = re.sub(r"(\d+)-([A-Za-z])$", r"\1\2", s)  # 489-F → 489F
    return s


def search_by_section(law_code: str, section_number: str) -> Optional[Dict]:
    """
    Search by specific section number.

    Examples:
        search_by_section("PPC", "302")
        search_by_section("CrPC", "497")
        search_by_section("Constitution", "199")
    """
    conn = get_connection()
    if not conn:
        return None

    # Map short codes to full names
    law_map = {
        "PPC": "Pakistan Penal Code",
        "CRPC": "Criminal Procedure",
        "CPC": "Civil Procedure",
        "CONSTITUTION": "Constitution",
        "QSO": "Qanun-e-Shahadat",
        "MFLO": "Muslim Family Laws",
    }

    law_name_pattern = law_map.get(law_code.upper(), law_code)
    section_norm = normalize_section(section_number)

    try:
        cursor = conn.cursor()

        # Try exact match first
        cursor.execute("""
                       SELECT law_name, section_number, section_title, section_text
                       FROM law_sections
                       WHERE law_name LIKE ?
                         AND (section_number = ? OR section_number = ? OR section_number LIKE ?) LIMIT 1
                       """, (
                           f"%{law_name_pattern}%",
                           section_norm,
                           section_number,
                           f"%{section_norm}%"
                       ))

        row = cursor.fetchone()
        if row:
            return {
                "found": True,
                "source": "local_db",
                "law_name": row["law_name"],
                "section_number": row["section_number"],
                "section_title": row["section_title"],
                "section_text": row["section_text"],
            }

        return {"found": False, "source": "local_db", "query": f"{law_code} {section_number}"}

    except Exception as e:
        return {"found": False, "error": str(e)}

    finally:
        conn.close()


def search_by_keywords(keywords: str, limit: int = 5) -> List[Dict]:
    """
    Search by keywords in section title and text.

    Examples:
        search_by_keywords("bail non-bailable")
        search_by_keywords("divorce khula dissolution")
    """
    conn = get_connection()
    if not conn:
        return []

    try:
        cursor = conn.cursor()

        # Split keywords
        words = keywords.lower().split()

        results = []

        for word in words:
            if len(word) < 3:
                continue

            cursor.execute("""
                           SELECT law_name, section_number, section_title, section_text
                           FROM law_sections
                           WHERE section_title LIKE ?
                              OR section_text LIKE ? LIMIT ?
                           """, (f"%{word}%", f"%{word}%", limit))

            for row in cursor.fetchall():
                # Avoid duplicates
                key = f"{row['law_name']}_{row['section_number']}"
                if not any(r.get("_key") == key for r in results):
                    results.append({
                        "found": True,
                        "source": "local_db",
                        "_key": key,
                        "law_name": row["law_name"],
                        "section_number": row["section_number"],
                        "section_title": row["section_title"],
                        "section_text": row["section_text"][:500],  # Truncate
                        "matched_keyword": word,
                    })

        return results[:limit]

    except Exception as e:
        return [{"found": False, "error": str(e)}]

    finally:
        conn.close()


def search_by_law_name(law_name: str, limit: int = 10) -> List[Dict]:
    """
    Get all sections from a specific law.

    Examples:
        search_by_law_name("Dissolution of Muslim Marriages")
        search_by_law_name("Family Courts Act")
    """
    conn = get_connection()
    if not conn:
        return []

    try:
        cursor = conn.cursor()

        cursor.execute("""
                       SELECT law_name, section_number, section_title, section_text
                       FROM law_sections
                       WHERE law_name LIKE ? LIMIT ?
                       """, (f"%{law_name}%", limit))

        results = []
        for row in cursor.fetchall():
            results.append({
                "found": True,
                "source": "local_db",
                "law_name": row["law_name"],
                "section_number": row["section_number"],
                "section_title": row["section_title"],
                "section_text": row["section_text"],
            })

        return results

    except Exception as e:
        return [{"found": False, "error": str(e)}]

    finally:
        conn.close()


def search_cpc_order_rule(order_num: int, rule_num: int) -> Optional[Dict]:
    """
    Search CPC by Order and Rule number.

    Examples:
        search_cpc_order_rule(21, 26)  # Order XXI Rule 26
        search_cpc_order_rule(39, 1)   # Order XXXIX Rule 1
    """
    conn = get_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor()

        cursor.execute("""
                       SELECT law_name, section_number, section_title, section_text, order_number, rule_number
                       FROM law_sections
                       WHERE law_name LIKE '%Civil Procedure%'
                         AND order_number = ?
                         AND rule_number = ? LIMIT 1
                       """, (order_num, rule_num))

        row = cursor.fetchone()
        if row:
            return {
                "found": True,
                "source": "local_db",
                "law_name": row["law_name"],
                "section_number": row["section_number"],
                "section_title": row["section_title"],
                "section_text": row["section_text"],
                "order_number": row["order_number"],
                "rule_number": row["rule_number"],
            }

        return {"found": False, "source": "local_db", "query": f"Order {order_num} Rule {rule_num}"}

    except Exception as e:
        return {"found": False, "error": str(e)}

    finally:
        conn.close()


def search_judgments(query: str, limit: int = 5) -> List[Dict]:
    """
    Search judgments by keywords.
    """
    conn = get_connection()
    if not conn:
        return []

    try:
        cursor = conn.cursor()

        cursor.execute("""
                       SELECT id, title, citation, judgment_date, summary
                       FROM judgments
                       WHERE title LIKE ?
                          OR summary LIKE ?
                          OR citation LIKE ? LIMIT ?
                       """, (f"%{query}%", f"%{query}%", f"%{query}%", limit))

        results = []
        for row in cursor.fetchall():
            results.append({
                "found": True,
                "source": "local_db",
                "type": "judgment",
                "id": row["id"],
                "title": row["title"],
                "citation": row["citation"],
                "date": row["judgment_date"],
                "summary": row["summary"][:500] if row["summary"] else None,
            })

        return results

    except Exception as e:
        return [{"found": False, "error": str(e)}]

    finally:
        conn.close()


def smart_search(query: str) -> Dict:
    """
    Smart search that auto-detects query type.

    Examples:
        smart_search("Section 497 CrPC")
        smart_search("Order XXI Rule 26 CPC")
        smart_search("bail murder")
        smart_search("Article 199 Constitution")
    """
    query_lower = query.lower()
    results = {
        "query": query,
        "sections": [],
        "judgments": [],
        "source": "local_db",
    }

    # Pattern 1: Section X CrPC/PPC/CPC
    section_match = re.search(
        r"(?:section|sec|u/s)?\s*(\d+[A-Z]?)\s*(crpc|ppc|cpc|constitution)",
        query_lower,
        re.IGNORECASE
    )
    if section_match:
        section_num = section_match.group(1)
        law_code = section_match.group(2).upper()
        result = search_by_section(law_code, section_num)
        if result and result.get("found"):
            results["sections"].append(result)

    # Pattern 2: Article X Constitution
    article_match = re.search(
        r"article\s*(\d+)",
        query_lower,
        re.IGNORECASE
    )
    if article_match:
        article_num = article_match.group(1)
        result = search_by_section("Constitution", article_num)
        if result and result.get("found"):
            results["sections"].append(result)

    # Pattern 3: Order X Rule Y CPC
    order_match = re.search(
        r"order\s*([ivxlc]+|\d+)\s*rule\s*(\d+)",
        query_lower,
        re.IGNORECASE
    )
    if order_match:
        order_raw = order_match.group(1)
        rule_num = int(order_match.group(2))

        # Convert Roman to int
        roman_map = {
            "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5,
            "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
            "xi": 11, "xii": 12, "xiii": 13, "xiv": 14, "xv": 15,
            "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19, "xx": 20,
            "xxi": 21, "xxii": 22, "xxiii": 23, "xxiv": 24, "xxv": 25,
            "xxvi": 26, "xxvii": 27, "xxviii": 28, "xxix": 29, "xxx": 30,
            "xxxi": 31, "xxxii": 32, "xxxiii": 33, "xxxiv": 34, "xxxv": 35,
            "xxxvi": 36, "xxxvii": 37, "xxxviii": 38, "xxxix": 39, "xl": 40,
        }

        if order_raw.lower() in roman_map:
            order_num = roman_map[order_raw.lower()]
        else:
            order_num = int(order_raw) if order_raw.isdigit() else 0

        if order_num > 0:
            result = search_cpc_order_rule(order_num, rule_num)
            if result and result.get("found"):
                results["sections"].append(result)

    # Pattern 4: Keyword search (if no specific patterns matched)
    if not results["sections"]:
        keyword_results = search_by_keywords(query, limit=5)
        results["sections"].extend([r for r in keyword_results if r.get("found")])

    # Also search judgments
    judgment_results = search_judgments(query, limit=3)
    results["judgments"].extend([r for r in judgment_results if r.get("found")])

    # Summary
    results["total_found"] = len(results["sections"]) + len(results["judgments"])
    results["sufficient"] = results["total_found"] >= 1

    return results


# Quick test function
if __name__ == "__main__":
    print("=== Testing Local Search ===\n")

    tests = [
        "Section 497 CrPC",
        "Article 199 Constitution",
        "Order XXI Rule 26 CPC",
        "bail murder",
        "divorce khula",
    ]

    for test in tests:
        print(f"Query: {test}")
        result = smart_search(test)
        print(f"Found: {result['total_found']} results")
        if result["sections"]:
            for s in result["sections"][:2]:
                print(f"  - {s.get('law_name')}: {s.get('section_title', '')[:50]}")
        print("")

        if __name__ == "__main__":
            print("BASE_DIR:", BASE_DIR)
            print("DB_PATH:", DB_PATH)
            print("DB EXISTS:", os.path.exists(DB_PATH))