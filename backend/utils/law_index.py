import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple


DB_PATH_DEFAULT = Path("data") / "law_index.sqlite"


@dataclass
class LawHit:
    law_code: str
    kind: str
    number: str
    title: str
    text: str
    source_file: str


def _normalize_num(s: str) -> str:
    s = s.strip()
    s = s.replace("–", "-")
    s = re.sub(r"\s+", "", s)
    return s


def _parse_refs_from_text(text: str) -> List[Tuple[str, str, str]]:
    """
    Extracts references like:
      - PPC 302
      - CrPC 154
      - CPC 9
      - Article 199
      - Art 199
      - 22-A CrPC
      - section 497 CrPC
      - u/s 497 CrPC

    Returns list of (law_code, kind, number)
    kind is "section" or "article"
    """
    out: List[Tuple[str, str, str]] = []

    # Article references
    for m in re.finditer(r"\b(?:article|art\.?)\s*(\d{1,4})\b", text, flags=re.IGNORECASE):
        out.append(("CONST", "article", _normalize_num(m.group(1))))

    # Law code + number patterns
    # PPC 302, CrPC 497, CPC 9, QSO 129, etc.
    for m in re.finditer(
        r"\b(PPC|CrPC|CPC|QSO|FCA|GWA|MFLO)\s*(\d{1,4}(?:\s*[-–]\s*[A-Za-z])?(?:\s*\(\s*\d+\s*\))?)\b",
        text,
        flags=re.IGNORECASE,
    ):
        law = m.group(1).upper()
        num = _normalize_num(m.group(2))
        out.append((law, "section", num))

    # 22-A CrPC style
    for m in re.finditer(
        r"\b(\d{1,4}\s*[-–]\s*[A-Za-z])\s*(CrPC|CPC)\b", text, flags=re.IGNORECASE
    ):
        num = _normalize_num(m.group(1))
        law = m.group(2).upper()
        out.append((law, "section", num))

    # "u/s 497 CrPC" style
    for m in re.finditer(
        r"\b(?:u\/s|under\s*section|section)\s*(\d{1,4}(?:\s*[-–]\s*[A-Za-z])?)\s*(PPC|CrPC|CPC)\b",
        text,
        flags=re.IGNORECASE,
    ):
        num = _normalize_num(m.group(1))
        law = m.group(2).upper()
        out.append((law, "section", num))

    # Deduplicate while preserving order
    seen = set()
    deduped: List[Tuple[str, str, str]] = []
    for item in out:
        if item in seen:
            continue
        seen.add(item)
        deduped.append(item)

    return deduped


class LawIndex:
    def __init__(self, db_path: Path = DB_PATH_DEFAULT) -> None:
        self.db_path = db_path
        if not self.db_path.exists():
            raise FileNotFoundError(f"SQLite index not found: {self.db_path.resolve()}")

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def get_block(self, law_code: str, kind: str, number: str) -> Optional[LawHit]:
        law_code = law_code.upper()
        kind = kind.lower()
        number = _normalize_num(number)

        q = """
        SELECT law_code, kind, number, title, text, source_file
        FROM law_blocks
        WHERE law_code=? AND kind=? AND number=?
        LIMIT 1
        """
        with self._connect() as conn:
            row = conn.execute(q, (law_code, kind, number)).fetchone()
            if not row:
                return None
            return LawHit(
                law_code=row["law_code"],
                kind=row["kind"],
                number=row["number"],
                title=row["title"],
                text=row["text"],
                source_file=row["source_file"],
            )

    def search_by_title(self, law_code: str, kind: str, query: str, limit: int = 5) -> List[LawHit]:
        """
        Lightweight fallback search if number lookup fails.
        Example: query "information in cognizable cases" might find CrPC 154.
        """
        law_code = law_code.upper()
        kind = kind.lower()
        q = """
        SELECT law_code, kind, number, title, text, source_file
        FROM law_blocks
        WHERE law_code=? AND kind=? AND title LIKE ?
        LIMIT ?
        """
        like = f"%{query.strip()}%"
        out: List[LawHit] = []
        with self._connect() as conn:
            rows = conn.execute(q, (law_code, kind, like, int(limit))).fetchall()
            for row in rows:
                out.append(
                    LawHit(
                        law_code=row["law_code"],
                        kind=row["kind"],
                        number=row["number"],
                        title=row["title"],
                        text=row["text"],
                        source_file=row["source_file"],
                    )
                )
        return out

    def resolve_refs(self, refs: Sequence[Tuple[str, str, str]]) -> List[LawHit]:
        """
        Validates refs against DB and returns only those that exist.
        """
        hits: List[LawHit] = []
        for law_code, kind, number in refs:
            hit = self.get_block(law_code, kind, number)
            if hit:
                hits.append(hit)
        return hits

    def extract_and_resolve_from_text(self, text: str) -> List[LawHit]:
        """
        Convenience: parse refs inside a text and resolve them in SQLite.
        """
        refs = _parse_refs_from_text(text)
        return self.resolve_refs(refs)


def format_hits_for_prompt(hits: Sequence[LawHit], max_chars_each: int = 1800) -> str:
    """
    Formats law blocks into a prompt-safe bundle.
    """
    parts: List[str] = []
    for i, h in enumerate(hits, start=1):
        body = (h.text or "").strip()
        if len(body) > max_chars_each:
            body = body[:max_chars_each].rstrip() + "\n[TRUNCATED]"
        label = f"{h.law_code} {h.number}" if h.kind == "section" else f"Article {h.number}"
        parts.append(
            f"[LAW {i}]\nREF: {label}\nTITLE: {h.title}\nSOURCE: {h.source_file}\nTEXT:\n{body}\n"
        )
    return "\n".join(parts).strip()
