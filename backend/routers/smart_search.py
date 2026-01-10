# backend/routers/smart_search.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import re
import os
from openai import OpenAI

router = APIRouter(prefix="/api/research", tags=["Smart Research"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class SearchRequest(BaseModel):
    query: str


class SearchResponse(BaseModel):
    query_type: str
    sections: list = []
    judgments: list = []
    ai_explanation: str = ""
    suggestions: list = []


def get_db():
    return sqlite3.connect("data/legal_db.sqlite")


def detect_query_type(query: str) -> str:
    query_lower = query.lower().strip()
    section_patterns = [r'^\d+[-]?[a-zA-Z]?$', r'^section\s*\d+', r'^(ppc|crpc|cpc|pec)\s*\d+', r'^\d+[-]?[a-zA-Z]?\s+(ppc|crpc|cpc)']
    for pattern in section_patterns:
        if re.search(pattern, query_lower):
            return "section_lookup"
    case_patterns = [r'vs\.?|versus|v\.', r'\d{4}\s*(scmr|pld|clc|pcrlj|ylr)', r'(supreme court|lahore high|high court)', r'(murder|bail|divorce|custody|property|contract)\s*(case|judgment)']
    for pattern in case_patterns:
        if re.search(pattern, query_lower):
            return "case_search"
    return "legal_question"


def extract_section_number(query: str) -> tuple:
    query_lower = query.lower().strip()
    law_map = {'ppc': 'Pakistan Penal Code', 'crpc': 'Code of Criminal Procedure', 'cpc': 'Code of Civil Procedure', 'pec': 'Pakistan Penal Code', 'qso': 'Qanun-e-Shahadat'}
    law_filter = None
    for abbr, full_name in law_map.items():
        if abbr in query_lower:
            law_filter = full_name
            break
    match = re.search(r'(\d+[-]?[a-zA-Z]?)', query)
    section_num = match.group(1) if match else query
    return section_num, law_filter


def lookup_sections(query: str) -> list:
    section_num, law_filter = extract_section_number(query)
    conn = get_db()
    cursor = conn.cursor()
    if law_filter:
        cursor.execute("SELECT law_name, section_number, section_title, section_text FROM law_sections WHERE section_number LIKE ? AND law_name LIKE ? ORDER BY CASE WHEN section_number = ? THEN 0 ELSE 1 END, length(section_number) LIMIT 5", (f"%{section_num}%", f"%{law_filter}%", section_num))
    else:
        cursor.execute("SELECT law_name, section_number, section_title, section_text FROM law_sections WHERE section_number LIKE ? ORDER BY CASE WHEN section_number = ? THEN 0 ELSE 1 END, length(section_number) LIMIT 5", (f"%{section_num}%", section_num))
    rows = cursor.fetchall()
    conn.close()
    return [{"law_name": row[0], "section_number": row[1], "title": row[2] if row[2] else f"Section {row[1]}", "content": row[3][:1000] + "..." if len(row[3]) > 1000 else row[3]} for row in rows]


def search_judgments(query: str) -> list:
    conn = get_db()
    cursor = conn.cursor()
    keywords = query.lower().split()
    conditions = []
    params = []
    for kw in keywords:
        if len(kw) > 2:
            conditions.append("(LOWER(title) LIKE ? OR LOWER(summary) LIKE ?)")
            params.extend([f"%{kw}%", f"%{kw}%"])
    if not conditions:
        conn.close()
        return []
    cursor.execute(f"SELECT title, citation, judgment_date, summary FROM judgments WHERE {' AND '.join(conditions)} ORDER BY judgment_date DESC LIMIT 10", params)
    rows = cursor.fetchall()
    conn.close()
    return [{"case_title": row[0], "court": "Court", "date": row[2], "citation": row[1], "summary": row[3][:500] + "..." if row[3] and len(row[3]) > 500 else row[3]} for row in rows]

def get_ai_explanation(query: str, sections: list, judgments: list) -> str:
    context_parts = []
    if sections:
        context_parts.append("RELEVANT LAW SECTIONS:")
        for sec in sections[:3]:
            context_parts.append(f"\n{sec['law_name']} Section {sec['section_number']}: {sec['title']}\n{sec['content'][:800]}")
    if judgments:
        context_parts.append("\n\nRELEVANT CASES:")
        for j in judgments[:3]:
            context_parts.append(f"\n{j['case_title']} ({j['court']}, {j['date']})\n{j['summary'][:400] if j['summary'] else ''}")
    context = "\n".join(context_parts)
    prompt = f"""You are a Pakistani legal expert. Answer this query using the provided context.

QUERY: {query}

{context if context else "No specific sections or cases found."}

Give a clear, helpful explanation in simple English with Urdu legal terms where appropriate."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI explanation unavailable: {str(e)}"


def get_suggestions(query: str, query_type: str) -> list:
    if query_type == "section_lookup":
        return ["Try: 'PPC 302'", "Try: 'CrPC 154'"]
    elif query_type == "case_search":
        return ["Try: 'bail 2023'", "Try: 'Supreme Court murder'"]
    return ["Try: 'punishment for theft'", "Try: 'how to file FIR'"]


@router.post("/search", response_model=SearchResponse)
async def smart_search(request: SearchRequest):
    query = request.query.strip()
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="Query too short")
    query_type = detect_query_type(query)
    sections, judgments = [], []
    if query_type == "section_lookup":
        sections = lookup_sections(query)
        if sections:
            judgments = search_judgments(sections[0]["section_number"])[:3]
    elif query_type == "case_search":
        judgments = search_judgments(query)
        sec_match = re.search(r'(\d+[-]?[a-zA-Z]?)', query)
        if sec_match:
            sections = lookup_sections(sec_match.group(1))[:2]
    else:
        judgments = search_judgments(query)[:5]
        sec_match = re.search(r'(\d+[-]?[a-zA-Z]?)', query)
        if sec_match:
            sections = lookup_sections(sec_match.group(1))[:3]
    ai_explanation = get_ai_explanation(query, sections, judgments)
    suggestions = get_suggestions(query, query_type)
    return SearchResponse(query_type=query_type, sections=sections, judgments=judgments, ai_explanation=ai_explanation, suggestions=suggestions)


@router.get("/stats")
async def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM law_sections")
    total_sections = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM judgments")
    total_judgments = cursor.fetchone()[0]
    cursor.execute("SELECT DISTINCT law_name FROM law_sections")
    laws = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"total_sections": total_sections, "total_judgments": total_judgments, "laws_covered": laws}