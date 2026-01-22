import re
import sqlite3
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict


# -----------------------------
# Helpers: roman numerals
# -----------------------------
_ROMAN_MAP = {
    "I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000
}

def roman_to_int(s: str) -> Optional[int]:
    if not s:
        return None
    s = s.strip().upper()
    if not re.fullmatch(r"[IVXLCDM]+", s):
        return None
    total = 0
    prev = 0
    for ch in reversed(s):
        val = _ROMAN_MAP.get(ch, 0)
        if val < prev:
            total -= val
        else:
            total += val
        prev = val
    return total if total > 0 else None


# -----------------------------
# Normalization
# -----------------------------
def _compact(s: str) -> str:
    return re.sub(r"\s+", "", s or "").strip()

def normalize_section_number(raw: str) -> str:
    """
    Canonicalize section numbers for matching.
    Examples:
      '22-A' -> '22A'
      '489-F' -> '489F'
      '12(2)' -> '12(2)'  (keeps parentheses as meaningful)
      '12-2' -> '12(2)'
      '12II' -> '12(2)'   (common shorthand)
    """
    s = (raw or "").strip()
    if not s:
        return ""

    # remove spaces and dots
    s = _compact(s)
    s = s.replace(".", "")

    # normalize hyphen letter cases: 22-A -> 22A, 489-F -> 489F
    s = re.sub(r"^(\d+)-([A-Za-z])$", r"\1\2", s)

    # normalize bracket variants and hyphen variants for 12(2)
    # 12-2, 12(II), 12II -> 12(2)
    m = re.fullmatch(r"(\d+)\((\d+)\)", s)
    if m:
        return f"{m.group(1)}({m.group(2)})"

    m = re.fullmatch(r"(\d+)-(\d+)", s)
    if m:
        return f"{m.group(1)}({m.group(2)})"

    m = re.fullmatch(r"(\d+)\((II|2)\)", s, flags=re.IGNORECASE)
    if m:
        return f"{m.group(1)}(2)"

    m = re.fullmatch(r"(\d+)(II|2)", s, flags=re.IGNORECASE)
    if m:
        return f"{m.group(1)}(2)"

    # otherwise return compacted version (keeps letters like 22A, 489F)
    return s


def section_variants(raw: str) -> List[str]:
    """
    Generate multiple query variants for robust matching in DB.
    """
    base = normalize_section_number(raw)
    if not base:
        return []

    variants = {base}

    # add hyphen variants for letter sections: 22A -> 22-A
    m = re.fullmatch(r"(\d+)([A-Za-z])", base)
    if m:
        variants.add(f"{m.group(1)}-{m.group(2).upper()}")
        variants.add(f"{m.group(1)}-{m.group(2).lower()}")

    # add 12-2 variant from 12(2)
    m = re.fullmatch(r"(\d+)\((\d+)\)", base)
    if m:
        variants.add(f"{m.group(1)}-{m.group(2)}")
        variants.add(f"{m.group(1)}(II)")
        variants.add(f"{m.group(1)}II")

    return sorted(variants)


# -----------------------------
# Procedural reference parsing
# -----------------------------
@dataclass
class ProcRef:
    law_hint: str  # 'CPC' 'CrPC' 'PPC' 'CONST' 'QSO' 'MFLO' etc
    kind: str      # 'section' or 'order_rule'
    number: str    # section number if kind=section, else ''
    order_no: Optional[int] = None
    rule_no: Optional[int] = None


_SECTION_PATTERNS = [
    # Section 12(2) CPC, S.497 CrPC, u/s 489-F PPC, etc
    re.compile(r"\b(?:u/s|under\s+section|section|s\.)\s*([0-9]+(?:\([0-9]+\)|[A-Za-z]|-[A-Za-z]|-F|F|II)?)\s*(CPC|CrPC|PPC|CONST|CONSTITUTION|QSO|MFLO)\b", re.IGNORECASE),
    # Article 199 Constitution
    re.compile(r"\b(?:article|art\.)\s*([0-9]+[A-Za-z]?)\s*(CONSTITUTION|CONST)\b", re.IGNORECASE),
]

_ORDER_RULE_PATTERNS = [
    # Order XXI Rule 26 CPC
    re.compile(r"\bOrder\s+([0-9]+|[IVXLCDM]+)\s+Rule\s+([0-9]+|[IVXLCDM]+)\s*(CPC)?\b", re.IGNORECASE),
    # O.21 R.26 CPC
    re.compile(r"\bO\.?\s*([0-9]+|[IVXLCDM]+)\s*R\.?\s*([0-9]+|[IVXLCDM]+)\s*(CPC)?\b", re.IGNORECASE),
]

def parse_procedural_refs(text: str) -> List[ProcRef]:
    t = text or ""
    refs: List[ProcRef] = []

    # order/rule first (most important to avoid wrong "26" matching)
    for pat in _ORDER_RULE_PATTERNS:
        for m in pat.finditer(t):
            o_raw = (m.group(1) or "").strip()
            r_raw = (m.group(2) or "").strip()
            o = int(o_raw) if o_raw.isdigit() else roman_to_int(o_raw)
            r = int(r_raw) if r_raw.isdigit() else roman_to_int(r_raw)
            if o and r:
                refs.append(ProcRef(law_hint="CPC", kind="order_rule", number="", order_no=o, rule_no=r))

    # sections/articles
    for pat in _SECTION_PATTERNS:
        for m in pat.finditer(t):
            num = (m.group(1) or "").strip()
            law = (m.group(2) or "").strip().upper()
            if law == "CONSTITUTION":
                law = "CONST"
            refs.append(ProcRef(law_hint=law, kind="section", number=num))

    # dedupe (stable)
    seen = set()
    out = []
    for r in refs:
        key = (r.law_hint, r.kind, normalize_section_number(r.number), r.order_no, r.rule_no)
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


# -----------------------------
# DB lookup
# -----------------------------
@dataclass
class LawBlock:
    law_name: str
    kind: str                # section
    section_number: str
    section_title: str
    section_text: str
    source_file: str


class LawLookup:
    """
    Safe lookup over legal_db.sqlite law_sections without hallucinating.
    """
    def __init__(self, sqlite_path: str):
        self.sqlite_path = sqlite_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def _law_name_like(law_hint: str) -> str:
        hint = (law_hint or "").upper()
        if hint == "CPC":
            return "%Civil Procedure%"
        if hint == "CRPC":
            return "%Criminal Procedure%"
        if hint == "PPC":
            return "%Penal Code%"
        if hint in ("CONST", "CONSTITUTION"):
            return "%Constitution%"
        if hint == "QSO":
            return "%Shahadat%"
        if hint == "MFLO":
            return "%Muslim Family Laws%"
        return "%"

    def find_section(self, law_hint: str, raw_section_number: str) -> Optional[LawBlock]:
        """
        Find a normal section (e.g., CrPC 497, PPC 302, Const 199).
        Uses strong normalization and multiple variants.
        """
        wanted_norm = normalize_section_number(raw_section_number)
        if not wanted_norm:
            return None

        variants = section_variants(raw_section_number)
        law_like = self._law_name_like(law_hint)

        # quick SQL prefilter by law_name
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT law_name, section_number, section_title, section_text, source_file
                FROM law_sections
                WHERE law_name LIKE ?
                """,
                (law_like,)
            ).fetchall()

        # python-side normalization match (safe and accurate)
        best = None
        for row in rows:
            db_num = row["section_number"] or ""
            db_norm = normalize_section_number(db_num)
            if db_norm == wanted_norm or db_num in variants:
                # prefer longer text (usually full section)
                text_len = len(row["section_text"] or "")
                if best is None or text_len > best[0]:
                    best = (text_len, row)

        if not best:
            return None

        row = best[1]
        return LawBlock(
            law_name=row["law_name"],
            kind="section",
            section_number=row["section_number"] or "",
            section_title=row["section_title"] or "",
            section_text=row["section_text"] or "",
            source_file=row["source_file"] or "",
        )

    def find_cpc_order_rule(self, order_no: int, rule_no: int) -> Optional[LawBlock]:
        """
        Find CPC Order/Rule safely by searching for BOTH order and rule markers in title/text.
        This avoids the dangerous 'just number=26' matching.
        """
        law_like = self._law_name_like("CPC")

        # patterns to match both numeric and roman forms in text
        # Example: "Order XXI" OR "Order 21"
        order_patterns = [
            f"%order {order_no}%",
        ]
        rule_patterns = [
            f"%rule {rule_no}%",
        ]

        # also allow roman form if common in source texts
        # (we do not generate roman string here; LIKE will still match numeric forms in most PDFs)
        with self._connect() as conn:
            candidates = conn.execute(
                """
                SELECT law_name, section_number, section_title, section_text, source_file
                FROM law_sections
                WHERE law_name LIKE ?
                """,
                (law_like,)
            ).fetchall()

        best = None
        o = str(order_no)
        r = str(rule_no)

        for row in candidates:
            title = (row["section_title"] or "").lower()
            body = (row["section_text"] or "").lower()

            # must contain BOTH signals somewhere
            if ("order" in title or "order" in body) and ("rule" in title or "rule" in body):
                if f"order {o}" in title or f"order {o}" in body:
                    if f"rule {r}" in title or f"rule {r}" in body:
                        text_len = len(row["section_text"] or "")
                        if best is None or text_len > best[0]:
                            best = (text_len, row)

        if not best:
            return None

        row = best[1]
        return LawBlock(
            law_name=row["law_name"],
            kind="order_rule",
            section_number=row["section_number"] or "",
            section_title=row["section_title"] or "",
            section_text=row["section_text"] or "",
            source_file=row["source_file"] or "",
        )

    def resolve_refs(self, query_text: str) -> Dict[str, LawBlock]:
        """
        Extract procedural refs from query text and resolve them to law text blocks.
        Returns dict keys like:
          'CrPC 497', 'PPC 302', 'Const 199', 'CPC O21 R26'
        """
        refs = parse_procedural_refs(query_text)
        results: Dict[str, LawBlock] = {}

        for ref in refs:
            if ref.kind == "order_rule" and ref.order_no and ref.rule_no:
                block = self.find_cpc_order_rule(ref.order_no, ref.rule_no)
                if block:
                    key = f"CPC O{ref.order_no} R{ref.rule_no}"
                    results[key] = block
                continue

            if ref.kind == "section":
                block = self.find_section(ref.law_hint, ref.number)
                if block:
                    key = f"{ref.law_hint} {normalize_section_number(ref.number)}"
                    results[key] = block

        return results
