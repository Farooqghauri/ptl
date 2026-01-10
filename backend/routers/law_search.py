import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
DB_PATH = "data/legal_db.sqlite"


class LawSearchRequest(BaseModel):
    query: str
    law_name: Optional[str] = None
    limit: int = 10


class SectionLookupRequest(BaseModel):
    section_number: str
    law_name: Optional[str] = None


@router.post("/api/law/search")
async def search_law_sections(request: LawSearchRequest):
    """Search law sections by keyword."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    query = f"%{request.query}%"

    if request.law_name:
        cur.execute('''
                    SELECT *
                    FROM law_sections
                    WHERE (section_number LIKE ? OR section_title LIKE ? OR section_text LIKE ?)
                      AND law_name LIKE ? LIMIT ?
                    ''', (query, query, query, f"%{request.law_name}%", request.limit))
    else:
        cur.execute('''
                    SELECT *
                    FROM law_sections
                    WHERE section_number LIKE ?
                       OR section_title LIKE ?
                       OR section_text LIKE ? LIMIT ?
                    ''', (query, query, query, request.limit))

    results = [dict(row) for row in cur.fetchall()]
    conn.close()

    return {"results": results, "count": len(results)}


@router.post("/api/law/lookup")
async def lookup_section(request: SectionLookupRequest):
    """Look up exact section by number."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Clean section number - remove common prefixes
    sec_num = request.section_number.strip()
    sec_num = sec_num.replace("Section", "").replace("section", "")
    sec_num = sec_num.replace("Article", "").replace("article", "")
    sec_num = sec_num.replace("S.", "").replace("s.", "")
    sec_num = sec_num.strip()

    if request.law_name:
        # Try exact match first
        cur.execute('''
                    SELECT *
                    FROM law_sections
                    WHERE section_number = ?
                      AND law_name LIKE ?
                    ''', (sec_num, f"%{request.law_name}%"))
        results = [dict(row) for row in cur.fetchall()]

        # If no exact match, try LIKE
        if not results:
            cur.execute('''
                        SELECT *
                        FROM law_sections
                        WHERE section_number LIKE ?
                          AND law_name LIKE ?
                        ''', (f"%{sec_num}%", f"%{request.law_name}%"))
            results = [dict(row) for row in cur.fetchall()]
    else:
        # Try exact match first
        cur.execute('''
                    SELECT *
                    FROM law_sections
                    WHERE section_number = ?
                    ''', (sec_num,))
        results = [dict(row) for row in cur.fetchall()]

        # If no exact match, try LIKE
        if not results:
            cur.execute('''
                        SELECT *
                        FROM law_sections
                        WHERE section_number LIKE ?
                        ''', (f"%{sec_num}%",))
            results = [dict(row) for row in cur.fetchall()]

    conn.close()

    if not results:
        return {"found": False, "message": f"Section {sec_num} not found", "results": []}

    return {"found": True, "results": results, "count": len(results)}


@router.get("/api/law/stats")
async def get_law_stats():
    """Get statistics of law sections."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT law_name, COUNT(*) FROM law_sections GROUP BY law_name")
    stats = cur.fetchall()

    cur.execute("SELECT COUNT(*) FROM law_sections")
    total = cur.fetchone()[0]

    conn.close()

    return {
        "total_sections": total,
        "by_law": {law: count for law, count in stats}
    }