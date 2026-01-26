"""
LEGAL DRAFTER - Templates + Law Search + AI Drafting (EN/UR)

Generalized logic:
- UI category labels -> correct template filename
- Document "mode" (litigation vs non_litigation) controls whether law search is used
- Output always returns draft_en + draft_ur
"""

import os
from pathlib import Path
from typing import Dict, Any, Set

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI

from services.search_orchestrator import search_for_document, DOCUMENT_SECTIONS

load_dotenv()

router = APIRouter()

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Template directory
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

# -----------------------------
# Category -> template mapping (UI labels supported)
# -----------------------------
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

# Non-litigation / transactional document categories:
# These should NOT be drafted as petitions and should NOT force law-search blocks.
NON_LITIGATION_CATEGORIES: Set[str] = {
    "Rent Agreement",
    "Sale Agreement",
    "Partnership Deed",
    "Power of Attorney",
}

DEFAULT_TEMPLATE_LITIGATION = "_default.txt"
DEFAULT_TEMPLATE_AGREEMENT = "_agreement_default.txt"


# -----------------------------
# Request schema
# -----------------------------
class DraftRequest(BaseModel):
    category: str = Field(..., description="Document type (UI label or internal key)")
    facts: str = Field(..., description="Case facts / instructions")
    tone: str = Field(default="Formal")


# -----------------------------
# Helpers
# -----------------------------
def _safe_filename_from_category(category: str) -> str:
    """Convert a category into a safe fallback filename."""
    safe = category.strip().lower()
    safe = safe.replace("(", "").replace(")", "")
    safe = safe.replace("/", "_").replace("\\", "_")
    safe = safe.replace("-", "_").replace(" ", "_")
    return f"{safe}.txt"


def is_non_litigation(category: str) -> bool:
    """Return True if this category is a transactional/non-court document."""
    return category in NON_LITIGATION_CATEGORIES


def load_template(category: str, mode: str) -> str:
    """
    Load template for given category.
    - litigation: court templates
    - non_litigation: agreement templates (fallback to _agreement_default.txt)
    """
    if mode == "non_litigation":
        agreement_default = TEMPLATE_DIR / DEFAULT_TEMPLATE_AGREEMENT
        if agreement_default.exists():
            return agreement_default.read_text(encoding="utf-8")

        # last resort
        fallback = TEMPLATE_DIR / DEFAULT_TEMPLATE_LITIGATION
        return fallback.read_text(encoding="utf-8") if fallback.exists() else ""

    # litigation (court docs)
    filename = CATEGORY_TO_TEMPLATE.get(category) or _safe_filename_from_category(category)

    template_path = TEMPLATE_DIR / filename
    if template_path.exists():
        return template_path.read_text(encoding="utf-8")

    default_path = TEMPLATE_DIR / DEFAULT_TEMPLATE_LITIGATION
    if default_path.exists():
        return default_path.read_text(encoding="utf-8")

    return ""


def build_law_context(category: str, facts: str) -> Dict[str, Any]:
    """
    Build law context only for litigation documents.
    For non-litigation, return an empty context.
    """
    if is_non_litigation(category):
        return {
            "formatted_for_ai": "",
            "document_title": category,
            "total_valid": 0,
            "sections": [],
            "needs_external": False,
        }

    # Litigation flow (keep current logic alive)
    return search_for_document(category, facts)


# -----------------------------
# Prompts
# -----------------------------
SYSTEM_PROMPT_EN = """
You are a Senior Advocate of the Supreme Court of Pakistan with 35+ years of experience across criminal, civil, constitutional, family, corporate, taxation, service, and revenue litigation. You draft ONLY court-acceptable, litigation-grade legal documents used by practicing Pakistani lawyers.

═══════════════════════════════════════════════════════════════
SECTION A: ABSOLUTE UNIVERSAL RULES (NO EXCEPTIONS)
═══════════════════════════════════════════════════════════════

1. COURT HEADINGS — STRICTLY CORRECT FORMATS ONLY:

   HIGH COURTS (Always specify Bench):
   ✓ IN THE LAHORE HIGH COURT, LAHORE (Principal Seat)
   ✓ IN THE LAHORE HIGH COURT, MULTAN BENCH, MULTAN
   ✓ IN THE LAHORE HIGH COURT, RAWALPINDI BENCH, RAWALPINDI
   ✓ IN THE LAHORE HIGH COURT, BAHAWALPUR BENCH, BAHAWALPUR
   ✓ IN THE HIGH COURT OF SINDH AT KARACHI / HYDERABAD / SUKKUR
   ✓ IN THE PESHAWAR HIGH COURT, PESHAWAR / MINGORA BENCH / ABBOTTABAD BENCH
   ✓ IN THE HIGH COURT OF BALOCHISTAN AT QUETTA
   ✓ IN THE ISLAMABAD HIGH COURT, ISLAMABAD

   DISTRICT COURTS:
   ✓ IN THE COURT OF THE DISTRICT & SESSIONS JUDGE, [DISTRICT]
   ✓ IN THE COURT OF THE SESSIONS JUDGE, [DISTRICT]
   ✓ IN THE COURT OF THE SENIOR CIVIL JUDGE, [DISTRICT]
   ✓ IN THE COURT OF THE FAMILY JUDGE, [DISTRICT]
   ✓ IN THE COURT OF THE JUDICIAL MAGISTRATE (1ST CLASS), [DISTRICT]

   ✗ NEVER write "HIGH COURT OF PAKISTAN" — legally incorrect

2. PROCEDURAL OVERRIDE RULE (CRITICAL):
   - If lawyer explicitly mentions Section / Order / Rule / Article,
     YOU MUST draft exactly under that provision
   - Do NOT question, reinterpret, or substitute

3. SECTION CITATION DISCIPLINE:
   - Cite ONLY operative sections directly relevant to relief
   - NEVER cite definition sections (Sections 2, 3, 4) unless essential
   - If section text unavailable: [Section text not available in database]

4. DRAFTING STYLE:
   - Opening: "MOST RESPECTFULLY SHEWETH:-" (High Court/Supreme Court)
   - Opening: "RESPECTFULLY SHEWETH:" (District Courts)
   - Facts: Numbered paragraphs (1., 2., 3.)
   - Grounds: Numbered with legal principle (i., ii., iii.)
   - Prayer: Specific sub-clauses (a), (b), (c), (d)

5. TERMINOLOGY (English + Urdu):
   - Petitioner / Plaintiff (مدعی / Mudai)
   - Respondent / Defendant (مدعا علیہ / Mudda Alaih)
   - Accused (ملزم / Mulzim)
   - Complainant (مستغیث / Mustaghees)

═══════════════════════════════════════════════════════════════
FINAL RULES
═══════════════════════════════════════════════════════════════

- Use ONLY law sections provided in context (if any)
- Follow the TEMPLATE FORMAT exactly
- Fill in [PLACEHOLDERS] with facts provided
- If information missing, keep placeholder
- Output ONLY the draft - NO commentary
- NEVER assume gender, parentage (S/o, D/o, W/o), or marital status unless explicitly stated in facts. Use neutral placeholders if not provided.

"""

SYSTEM_PROMPT_UR = """
آپ سپریم کورٹ آف پاکستان کے سینئر وکیل ہیں۔

اہم ہدایات:
1. صرف فراہم کردہ قانونی دفعات استعمال کریں (اگر موجود ہوں)
2. دیے گئے ٹیمپلیٹ کی شکل پر عمل کریں
3. تمام [PLACEHOLDERS] کو حقائق سے پُر کریں
4. پاکستانی عدالتی طرز استعمال کریں

آؤٹ پٹ صرف مسودہ - کوئی تبصرہ نہیں
"""


def generate_english_draft(
    category: str,
    facts: str,
    law_excerpts: str,
    doc_title: str,
    template: str,
    mode: str,
) -> str:
    """Generate English draft using template and (optional) law sections."""
    user_prompt = f"""
DOCUMENT MODE: {mode}
DOCUMENT TYPE: {doc_title}

TEMPLATE TO FOLLOW (Fill in placeholders with provided facts):
{template}

FACTS / INSTRUCTIONS:
{facts}

RELEVANT LAW SECTIONS (USE ONLY THESE IF PROVIDED; otherwise do not invent law):
{law_excerpts}

INSTRUCTIONS:
1. Follow the TEMPLATE structure exactly
2. Fill [PLACEHOLDERS] using facts/instructions
3. Keep unfilled placeholders as [PLACEHOLDER]
4. Do not invent law sections. If none provided, do not add new laws.
5. Output ONLY the draft.
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_EN},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content.strip()


def generate_urdu_draft(english_draft: str, doc_title: str) -> str:
    """Generate Urdu draft based on English draft."""
    user_prompt = f"""
دستاویز کی قسم: {doc_title}

انگریزی مسودہ:
{english_draft}

اوپر دیے گئے انگریزی مسودے کو مکمل اردو میں ترجمہ کریں۔
تمام قانونی دفعات کے نمبر برقرار رکھیں۔
فارمیٹ برقرار رکھیں۔

آؤٹ پٹ صرف مسودہ - کوئی تبصرہ نہیں
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_UR},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content.strip()


# -----------------------------
# Routes
# -----------------------------
@router.post("/api/draft")
async def draft_legal_document(request: DraftRequest):
    try:
        if not request.facts or not request.facts.strip():
            raise HTTPException(status_code=422, detail="facts is required")

        category = (request.category or "").strip()
        if not category:
            raise HTTPException(status_code=422, detail="category is required")

        # Step 1: Determine mode first
        mode = "non_litigation" if is_non_litigation(category) else "litigation"

        # Step 2: Load correct template family
        template = load_template(category, mode)

        # Step 3: Build law context (litigation only)
        search_results = build_law_context(category, request.facts)

        # Step 4: Extract law excerpts and titles safely
        law_excerpts = (search_results.get("formatted_for_ai") or "").strip()
        doc_title = search_results.get("document_title") or category

        # Step 5: Generate English draft
        draft_en = generate_english_draft(
            category=category,
            facts=request.facts,
            law_excerpts=law_excerpts,
            doc_title=doc_title,
            template=template,
            mode=mode,
        )

        # Step 6: Generate Urdu draft
        draft_ur = generate_urdu_draft(
            english_draft=draft_en,
            doc_title=doc_title,
        )

        # Step 7: Response metadata
        sections = search_results.get("sections") or []
        return {
            "draft_en": draft_en,
            "draft_ur": draft_ur,
            "category": category,
            "document_title": doc_title,
            "mode": mode,
            "sections_found": int(search_results.get("total_valid") or 0),
            "sections_used": [
                f"{s.get('law_name', '')} - {s.get('section_number', '')}"
                for s in sections[:5]
            ],
            "template_used": bool(template),
            "needs_external": bool(search_results.get("needs_external") or False),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/draft/categories")
async def get_categories():
    """Return available document categories."""
    return {
        "categories": [{"id": key, "title": val["title"]} for key, val in DOCUMENT_SECTIONS.items()]
    }


@router.get("/api/draft/template/{category}")
async def get_template(category: str):
    """Return template for a category (for preview)."""
    category = (category or "").strip()
    mode = "non_litigation" if is_non_litigation(category) else "litigation"
    template = load_template(category, mode)
    return {"category": category, "mode": mode, "template": template}
