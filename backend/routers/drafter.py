"""
════════════════════════════════════════════════════════════════
FILE LOCATION: backend/routers/drafter.py
════════════════════════════════════════════════════════════════

LEGAL DRAFTER v2.2 - Law Rules Engine + Safe Template + Section Validator

ARCHITECTURE:
1. User submits category + facts
2. Law Rules Engine determines applicable sections (NO AI)
3. Template is loaded (single legal_notice template)
4. AI generates draft using ONLY allowed sections + template structure
5. Post-processing removes illegal Section 80 ONLY for private Legal Notice
6. Validator checks AI output
7. Return draft + warnings/flags
"""

import os
import re
from pathlib import Path
from typing import Dict, Set, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI

from services.law_rules import (
    get_applicable_sections,
    format_sections_for_draft,
    CaseAnalysis,
)
from services.section_validator import validate_legal_draft
from services.search_orchestrator import search_for_document, DOCUMENT_SECTIONS

load_dotenv()

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

CATEGORY_TO_TEMPLATE: Dict[str, str] = {
    "Bail Petition (Post-Arrest)": "bail_post_arrest.txt",
    "Bail Petition (Pre-Arrest)": "bail_pre_arrest.txt",
    "Legal Notice": "legal_notice.txt",
    "Suit for Recovery": "suit_recovery.txt",
    "Divorce Deed (Talaq-nama)": "divorce_khula.txt",
    "Custody Petition": "custody_petition.txt",
    "Cheque Dishonour": "cheque_dishonour.txt",
    "Quashing FIR": "quashing_fir.txt",
    "Stay Application": "stay_application.txt",
    "Writ Petition": "writ_petition.txt",
}

NON_LITIGATION_CATEGORIES: Set[str] = {
    "Rent Agreement",
    "Sale Agreement",
    "Partnership Deed",
    "Power of Attorney",
}

DEFAULT_TEMPLATE_LITIGATION = "_default.txt"
DEFAULT_TEMPLATE_AGREEMENT = "_agreement_default.txt"


class DraftRequest(BaseModel):
    category: str = Field(..., description="Document type")
    facts: str = Field(..., description="Case facts / instructions")
    tone: str = Field(default="Formal")


def _safe_filename_from_category(category: str) -> str:
    safe = (category or "").strip().lower()
    safe = safe.replace("(", "").replace(")", "")
    safe = safe.replace("/", "_").replace("\\", "_")
    safe = safe.replace("-", "_").replace(" ", "_")
    return f"{safe}.txt"


def is_non_litigation(category: str) -> bool:
    return (category or "").strip() in NON_LITIGATION_CATEGORIES


def _read_template(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def load_template(category: str, mode: str) -> str:
    category = (category or "").strip()

    if mode == "non_litigation":
        txt = _read_template(TEMPLATE_DIR / DEFAULT_TEMPLATE_AGREEMENT)
        if txt:
            return txt
        return _read_template(TEMPLATE_DIR / DEFAULT_TEMPLATE_LITIGATION)

    filename = CATEGORY_TO_TEMPLATE.get(category) or _safe_filename_from_category(category)
    txt = _read_template(TEMPLATE_DIR / filename)
    if txt:
        return txt
    return _read_template(TEMPLATE_DIR / DEFAULT_TEMPLATE_LITIGATION)


SYSTEM_PROMPT_EN = """
You are a Senior Advocate of the Supreme Court of Pakistan with 35+ years experience.
You draft ONLY court-acceptable, litigation-grade legal documents.

═══════════════════════════════════════════════════════════════
CRITICAL RULES - FOLLOW EXACTLY
═══════════════════════════════════════════════════════════════

1. USE ONLY SECTIONS PROVIDED:
   - You will receive a list of APPLICABLE SECTIONS
   - Use ONLY those sections - DO NOT invent or add other sections
   - If no sections provided, draft WITHOUT citing specific sections

2. PLACEHOLDER FILLING:
   - Extract ALL names, dates, amounts, addresses from user facts
   - Fill every placeholder possible
   - Only leave [PLACEHOLDER] if information is truly not given

3. FORMATTING:
   - Facts: Numbered paragraphs (1., 2., 3.)
   - Prayer/Demand: Sub-clauses (a), (b), (c)

4. NEVER ASSUME:
   - Gender (S/o, D/o, W/o) unless stated
   - Parentage unless stated
   - Marital status unless stated

OUTPUT: Only the draft - NO commentary, NO explanations.
""".strip()

SYSTEM_PROMPT_UR = """
آپ سپریم کورٹ آف پاکستان کے سینئر وکیل ہیں۔

اہم ہدایات:
1. صرف فراہم کردہ قانونی دفعات استعمال کریں - نئی ایجاد نہ کریں
2. تمام معلومات حقائق سے نکالیں
3. پاکستانی عدالتی طرز استعمال کریں
4. قانونی دفعات کے نمبر انگریزی میں رکھیں

آؤٹ پٹ صرف مسودہ - کوئی تبصرہ نہیں
""".strip()


def generate_english_draft(
    category: str,
    facts: str,
    template: str,
    analysis: CaseAnalysis,
    db_sections: str,
) -> str:
    rules_sections = format_sections_for_draft(analysis)

    special_instructions: list[str] = []
    if analysis.is_government_involved and category.strip() == "Legal Notice":
        special_instructions.append("⚠️ GOVERNMENT ENTITY INVOLVED - Section 80 CPC may be required.")
    if (not analysis.is_government_involved) and category.strip() == "Legal Notice":
        special_instructions.append("⚠️ PRIVATE PARTY DISPUTE - DO NOT mention Section 80 CPC anywhere.")

    if analysis.warnings:
        special_instructions.append("\nWARNINGS:")
        special_instructions.extend([f"- {w}" for w in analysis.warnings])

    if analysis.flags_for_review:
        special_instructions.append("\nFLAGS FOR LAWYER REVIEW:")
        special_instructions.extend([f"- {f}" for f in analysis.flags_for_review])

    special_text = "\n".join(special_instructions).strip()

    user_prompt = f"""
DOCUMENT TYPE: {analysis.case_type}
SUB-TYPE: {analysis.sub_type or "General"}
GOVERNMENT INVOLVED: {"YES" if analysis.is_government_involved else "NO"}

{special_text}

══════════════════════════════════════════════════════════
APPLICABLE SECTIONS (USE ONLY THESE - DO NOT ADD OTHERS):
══════════════════════════════════════════════════════════
{rules_sections}

══════════════════════════════════════════════════════════
SECTION TEXT FROM DATABASE (REFERENCE ONLY):
══════════════════════════════════════════════════════════
{db_sections if db_sections else "[No additional section text available]"}

══════════════════════════════════════════════════════════
TEMPLATE STRUCTURE (Follow it):
══════════════════════════════════════════════════════════
{template}

══════════════════════════════════════════════════════════
USER'S CASE FACTS:
══════════════════════════════════════════════════════════
{facts}

YOUR TASK:
1) Use ONLY the sections listed above (if any)
2) Follow template structure
3) Extract names, CNIC, dates, amounts, addresses from facts
4) Fill placeholders where info exists
5) Output ONLY the final draft
""".strip()

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_EN},
            {"role": "user", "content": user_prompt},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


def generate_urdu_draft(english_draft: str, doc_title: str) -> str:
    user_prompt = f"""
دستاویز کی قسم: {doc_title}

انگریزی مسودہ:
{english_draft}

ہدایات:
1. مکمل اردو میں ترجمہ کریں
2. قانونی دفعات کے نمبر انگریزی میں رکھیں (مثلاً Section 302 PPC)
3. فارمیٹ برقرار رکھیں

آؤٹ پٹ صرف مسودہ
""".strip()

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_UR},
            {"role": "user", "content": user_prompt},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


# -----------------------------
# POST-PROCESSING
# -----------------------------

# Remove ANY full line that mentions Section 80 + CPC (many formats)
_SEC80_ANY_LINE = re.compile(
    r"(?im)^\s*.*\b("
    r"section\s*80|sec\.?\s*80|u\s*/\s*s\.?\s*80|u/s\.?\s*80"
    r")\b.*\b("
    r"c\.?\s*p\.?\s*c\.?|cpc|code\s+of\s+civil\s+procedure|civil\s+procedure\s+code"
    r")\b.*$"
)

# Remove inline mentions inside a sentence
_SEC80_INLINE = re.compile(
    r"(?i)\b("
    r"section\s*80|sec\.?\s*80|u\s*/\s*s\.?\s*80|u/s\.?\s*80"
    r")\s*(of\s*)?(the\s*)?(code\s+of\s+)?("
    r"civil\s+procedure\s+code|c\.?\s*p\.?\s*c\.?|cpc"
    r")\b"
)


def post_process_draft(draft: str, analysis: CaseAnalysis, category: str) -> str:
    processed = (draft or "").replace("\r\n", "\n").replace("\r", "\n")
    category = (category or "").strip()

    # Only remove Section 80 if it's a PRIVATE Legal Notice
    if category == "Legal Notice" and not analysis.is_government_involved:
        processed = re.sub(_SEC80_ANY_LINE, "", processed)
        processed = re.sub(_SEC80_INLINE, "", processed)

        # Normalize heading if it became weird
        processed = re.sub(r"(?im)^\s*LEGAL\s+NOTICE\s+UNDER\s*$", "LEGAL NOTICE", processed)
        processed = re.sub(r"(?im)^\s*LEGAL\s+NOTICE\s+UNDER\s+.*SECTION\s*80.*$", "LEGAL NOTICE", processed)

        # Clean spacing
        processed = re.sub(r"\n{3,}", "\n\n", processed)
        processed = re.sub(r"[ \t]{2,}", " ", processed)
        processed = re.sub(r"\(\s*\)", "", processed)
        processed = re.sub(r",\s*,", ",", processed)

    return processed.strip()


# -----------------------------
# ROUTES
# -----------------------------
@router.post("/api/draft")
async def draft_legal_document(request: DraftRequest):
    try:
        if not request.facts or not request.facts.strip():
            raise HTTPException(status_code=422, detail="facts is required")

        category = (request.category or "").strip()
        if not category:
            raise HTTPException(status_code=422, detail="category is required")

        mode = "non_litigation" if is_non_litigation(category) else "litigation"

        # 1) Rules engine FIRST (this decides govt involvement correctly)
        analysis = get_applicable_sections(category, request.facts)

        # 2) Template
        template = load_template(category, mode)

        # 3) DB context (optional)
        db_results = search_for_document(category, request.facts)
        db_sections = (db_results or {}).get("formatted_for_ai", "")

        # 4) Draft
        draft_en_raw = generate_english_draft(
            category=category,
            facts=request.facts,
            template=template,
            analysis=analysis,
            db_sections=db_sections,
        )

        # 5) Safety clean (only impacts private notices)
        draft_en = post_process_draft(draft_en_raw, analysis, category)

        # 6) Validate
        validation = validate_legal_draft(
            draft=draft_en,
            category=category,
            facts=request.facts,
            analysis=analysis,
        )

        # 7) Urdu draft
        def generate_urdu_draft(english_draft: str, doc_title: str) -> str:
            """
            Urdu translation with STRICT preservation of legal section references.
            """

            user_prompt = f"""
        دستاویز کی قسم: {doc_title}

        انگریزی مسودہ:
        ────────────────────────
        {english_draft}
        ────────────────────────

        اہم اور لازمی ہدایات (سختی سے عمل کریں):

        1. مکمل اردو میں ترجمہ کریں۔
        2. تمام قانونی حوالہ جات، دفعات اور سیکشن نمبرز کو
           لفظ بہ لفظ اور حرف بہ حرف اسی طرح رکھیں:
           - مثال:
             ✔ Section 80 CPC
             ✔ PPC Section 268
             ✔ Constitution Article 199
        3. "Section", "CPC", "PPC", "CrPC" کو ترجمہ نہ کریں۔
        4. اگر کسی لائن میں قانونی سیکشن موجود ہو تو:
           - اس لائن کو جوں کا توں برقرار رکھیں
           - صرف باقی متن اردو میں کریں
        5. فارمیٹ، سرخیاں اور پیرا نمبرنگ برقرار رکھیں۔
        6. کوئی نئی قانونی دفعہ شامل نہ کریں۔

        آؤٹ پٹ:
        - صرف اردو مسودہ
        - کوئی وضاحت، تبصرہ یا اضافی متن نہیں
        """

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.1,  # LOWER = safer for legal fidelity
                max_tokens=4000,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_UR},
                    {"role": "user", "content": user_prompt},
                ],
            )

            return (response.choices[0].message.content or "").strip()

        # 8) Build final response
        draft_ur = generate_urdu_draft(validation.draft, category)
        sections_used = [
            f"{s.law_short} Section {s.section_number}"
            for s in (analysis.applicable_sections or [])
        ]

        return {
            "draft_en": validation.draft,
            "draft_ur": draft_ur,
            "sections_used": sections_used,
            "sections_found": len(sections_used),
            "warnings": validation.warnings,
            "flags_for_review": validation.flags_for_review,
            "is_government_involved": analysis.is_government_involved,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/draft/categories")
async def get_categories():
    return {
        "categories": [{"id": key, "title": val["title"]} for key, val in DOCUMENT_SECTIONS.items()]
    }


@router.get("/api/draft/analyze")
async def analyze_case(category: str, facts: str):
    analysis = get_applicable_sections(category, facts)
    return {
        "category": category,
        "case_type": analysis.case_type,
        "sub_type": analysis.sub_type,
        "is_government_involved": analysis.is_government_involved,
        "confidence": analysis.confidence.value,
        "applicable_sections": [
            {
                "law": s.law_name,
                "law_short": s.law_short,
                "section": s.section_number,
                "title": s.section_title,
                "reason": s.reason,
                "is_primary": s.is_primary,
                "confidence": s.confidence.value,
            }
            for s in (analysis.applicable_sections or [])
        ],
        "warnings": analysis.warnings,
        "flags_for_review": analysis.flags_for_review,
    }
