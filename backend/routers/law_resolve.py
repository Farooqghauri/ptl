# backend/routers/law_resolve.py

import os
import re
import sqlite3
from typing import Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/law", tags=["law"])


# -----------------------------
# Config
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
DB_PATH = os.path.join(BASE_DIR, "data", "legal_db.sqlite")

CPC_LAW_NAMES = [
    "Code of Civil Procedure 1908",
]
CRPC_LAW_NAMES = [
    "Code of Criminal Procedure 1898",
]
PPC_LAW_NAMES = [
    "Pakistan Penal Code 1860",
]
CONST_LAW_NAMES = [
    "Constitution of Pakistan 1973",
]
QSO_LAW_NAMES = [
    "Qanun-e-Shahadat Order 1984",
]


# -----------------------------
# Request/Response models
# -----------------------------
class ResolveRequest(BaseModel):
    text: str


def _connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


# -----------------------------
# Normalization helpers
# -----------------------------
def normalize_section_number(raw: str) -> str:
    """
    Normalizes common Pakistani-law section formatting:
    - 22-A -> 22A
    - 489-F -> 489F
    - 12(2) stays 12(2)
    - extra spaces removed
    """
    s = raw.strip()
    s = re.sub(r"\s+", "", s)
    # Normalize hyphen letter: 489-F / 489-f -> 489F
    s = re.sub(r"(\d+)-([A-Za-z])$", r"\1\2", s)
    # Normalize 22-A -> 22A (same pattern)
    s = re.sub(r"(\d+)-([A-Za-z])$", r"\1\2", s)
    # Uppercase trailing letters
    s = re.sub(r"(\d+)([a-z])$", lambda m: m.group(1) + m.group(2).upper(), s)
    return s


def roman_to_int(roman: str) -> Optional[int]:
    roman = roman.upper().strip()
    if not roman:
        return None
    roman_map = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    prev = 0
    for ch in reversed(roman):
        if ch not in roman_map:
            return None
        val = roman_map[ch]
        if val < prev:
            total -= val
        else:
            total += val
            prev = val
    return total


def parse_cpc_order_rule(text: str) -> List[Dict[str, str]]:
    """
    Extracts CPC Order/Rule patterns like:
    - Order XXI Rule 26 CPC
    - Order 21 Rule 26 CPC
    - O.21 R.26 CPC
    Returns list of {order_no, rule_no}
    """
    t = text

    out: List[Dict[str, str]] = []

    patterns = [
        r"order\s+([ivxlcdm]+|\d+)\s+rule\s+(\d+)\s+cpc",
        r"o\.\s*([ivxlcdm]+|\d+)\s*r\.\s*(\d+)\s*cpc",
        r"order\s+([ivxlcdm]+|\d+)\s*r(?:ule)?\s*(\d+)\s*cpc",
    ]

    for p in patterns:
        for m in re.finditer(p, t, flags=re.IGNORECASE):
            o_raw = m.group(1)
            r_raw = m.group(2)

            if re.fullmatch(r"\d+", o_raw):
                order_no = int(o_raw)
            else:
                order_no = roman_to_int(o_raw) or 0

            rule_no = int(r_raw)

            if order_no > 0 and rule_no > 0:
                out.append({"order_no": str(order_no), "rule_no": str(rule_no)})

    # Deduplicate pairs
    uniq = {(x["order_no"], x["rule_no"]) for x in out}
    return [{"order_no": o, "rule_no": r} for (o, r) in sorted(uniq)]


def parse_simple_refs(text: str) -> List[Dict[str, str]]:
    """
    Extracts:
    - u/s 497 CrPC
    - section 497 crpc
    - article 199 constitution
    - section 489-F PPC
    Returns list of {code, number}
    """
    t = text

    refs: List[Dict[str, str]] = []

    # CrPC
    for m in re.finditer(r"(?:u/s|under\s+section|section)\s+([0-9]+(?:\([0-9]+\))?(?:-[A-Za-z])?[A-Za-z]?)\s*(crpc)", t, flags=re.IGNORECASE):
        refs.append({"code": "CRPC", "number": normalize_section_number(m.group(1))})

    # PPC
    for m in re.finditer(r"(?:u/s|under\s+section|section)\s+([0-9]+(?:\([0-9]+\))?(?:-[A-Za-z])?[A-Za-z]?)\s*(ppc)", t, flags=re.IGNORECASE):
        refs.append({"code": "PPC", "number": normalize_section_number(m.group(1))})

    # CPC (section-based, not order/rule)
    for m in re.finditer(r"(?:u/s|under\s+section|section)\s+([0-9]+(?:\([0-9]+\))?)\s*(cpc)", t, flags=re.IGNORECASE):
        refs.append({"code": "CPC", "number": normalize_section_number(m.group(1))})

    # Constitution (Article)
    for m in re.finditer(r"(?:article|art\.?)\s+([0-9]+[A-Za-z]?)\s*(?:of\s+the\s+)?(constitution)", t, flags=re.IGNORECASE):
        refs.append({"code": "CONST", "number": normalize_section_number(m.group(1))})

    # Deduplicate
    seen = set()
    uniq: List[Dict[str, str]] = []
    for r in refs:
        key = (r["code"], r["number"])
        if key not in seen:
            seen.add(key)
            uniq.append(r)
    return uniq


def _fetch_exact_section(conn: sqlite3.Connection, law_names: List[str], section_number: str) -> Optional[sqlite3.Row]:
    q = """
    SELECT law_name, section_number, section_title, section_text, source_file
    FROM law_sections
    WHERE law_name IN ({})
      AND section_number = ?
    LIMIT 1
    """.format(",".join(["?"] * len(law_names)))
    args = list(law_names) + [section_number]
    cur = conn.execute(q, args)
    row = cur.fetchone()
    return row


def _fetch_cpc_order_rule(conn: sqlite3.Connection, order_no: str, rule_no: str) -> Optional[sqlite3.Row]:
    """
    Fetch CPC Order/Rule using new structured columns.
    """
    q = """
    SELECT law_name, section_number, section_title, section_text, source_file,
           order_number, rule_number
    FROM law_sections
    WHERE law_name = ?
      AND order_number = ?
      AND rule_number = ?
    LIMIT 1;
    """
    cur = conn.execute(q, (CPC_LAW_NAMES[0], int(order_no), int(rule_no)))
    return cur.fetchone()
# -----------------------------
# API
# -----------------------------
@router.post("/resolve")
def resolve_law_refs(req: ResolveRequest):
    if not os.path.exists(DB_PATH):
        return {"db": DB_PATH, "hits": 0, "results": [], "error": "DB not found"}

    results: List[Dict[str, str]] = []

    with _connect(DB_PATH) as conn:
        # 1) CPC Order/Rule (special)
        order_rules = parse_cpc_order_rule(req.text)
        for orx in order_rules:
            row = _fetch_cpc_order_rule(conn, orx["order_no"], orx["rule_no"])
            if row:
                results.append({
                    "key": f"CPC O{orx['order_no']} R{orx['rule_no']}",
                    "law_name": row["law_name"],
                    "kind": "order_rule",
                    "section_number": row["section_number"],
                    "title": row["section_title"] or "",
                    "source_file": row["source_file"] or "",
                    "text": row["section_text"] or "",
                })
            else:
                results.append({
                    "key": f"CPC O{orx['order_no']} R{orx['rule_no']}",
                    "law_name": CPC_LAW_NAMES[0],
                    "kind": "order_rule",
                    "section_number": "",
                    "title": "",
                    "source_file": "",
                    "text": "",
                })

        # 2) Normal section/article references
        refs = parse_simple_refs(req.text)
        for r in refs:
            if r["code"] == "CRPC":
                row = _fetch_exact_section(conn, CRPC_LAW_NAMES, r["number"])
            elif r["code"] == "PPC":
                row = _fetch_exact_section(conn, PPC_LAW_NAMES, r["number"])
            elif r["code"] == "CPC":
                row = _fetch_exact_section(conn, CPC_LAW_NAMES, r["number"])
            elif r["code"] == "CONST":
                row = _fetch_exact_section(conn, CONST_LAW_NAMES, r["number"])
            else:
                row = None

            if row:
                results.append({
                    "key": f"{r['code']} {r['number']}",
                    "law_name": row["law_name"],
                    "kind": "section",
                    "section_number": row["section_number"],
                    "title": row["section_title"] or "",
                    "source_file": row["source_file"] or "",
                    "text": row["section_text"] or "",
                })
            else:
                results.append({
                    "key": f"{r['code']} {r['number']}",
                    "law_name": "",
                    "kind": "section",
                    "section_number": r["number"],
                    "title": "",
                    "source_file": "",
                    "text": "",
                })

    # hits: count of resolved items that have text
    hits = sum(1 for x in results if (x.get("text") or "").strip())
    return {"db": DB_PATH, "hits": hits, "results": results}
