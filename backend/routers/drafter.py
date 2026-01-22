"""
LEGAL DRAFTER - Uses 3-Layer Search System + Templates
"""

import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI

from services.search_orchestrator import search_for_document, DOCUMENT_SECTIONS

load_dotenv()

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Template directory
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"


class DraftRequest(BaseModel):
    category: str = Field(..., description="Document type")
    facts: str = Field(..., description="Case facts")
    tone: str = Field(default="Formal")


def load_template(category: str) -> str:
    """Load template for given category."""
    template_path = TEMPLATE_DIR / f"{category}.txt"

    if template_path.exists():
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()

    # Fallback to default template
    default_path = TEMPLATE_DIR / "_default.txt"
    if default_path.exists():
        with open(default_path, "r", encoding="utf-8") as f:
            return f.read()

    return ""


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
SECTION B: CATEGORY-SPECIFIC MANDATORY RULES
═══════════════════════════════════════════════════════════════

POST-ARREST BAIL (Section 497 CrPC):
⚠️ FOR SECTION 302 PPC - MUST PLEAD:
   "The case falls within the ambit of FURTHER INQUIRY as envisaged under Section 497(2) CrPC."
   FAILURE = DRAFT IS LEGALLY DEFECTIVE

PRE-ARREST BAIL (Section 498 CrPC):
- Genuine apprehension + Mala fide + Ready to join investigation

WRIT PETITION (Article 199):
- Violation of Fundamental Rights + No alternate remedy + Correct writ type

KHULA/DIVORCE:
- Section 2 Dissolution of Muslim Marriages Act 1939 + Offer to return Mehr

CHEQUE DISHONOUR (489-F PPC):
- Cheque details + Bank memo + Legal notice + Within limitation

INJUNCTION/STAY:
- THREE-PRONGED TEST: Prima facie case + Balance of convenience + Irreparable loss

═══════════════════════════════════════════════════════════════
FINAL RULES
═══════════════════════════════════════════════════════════════

- Use ONLY law sections provided in context
- Follow the TEMPLATE FORMAT exactly
- Fill in [PLACEHOLDERS] with facts provided
- If information missing, keep placeholder
- Output ONLY the draft - NO commentary
"""

SYSTEM_PROMPT_UR = """
آپ سپریم کورٹ آف پاکستان کے سینئر وکیل ہیں۔

اہم ہدایات:
1. صرف فراہم کردہ قانونی دفعات استعمال کریں
2. دیے گئے ٹیمپلیٹ کی شکل پر عمل کریں
3. تمام [PLACEHOLDERS] کو حقائق سے پُر کریں
4. پاکستانی عدالتی طرز استعمال کریں

آؤٹ پٹ صرف مسودہ - کوئی تبصرہ نہیں
"""


def generate_english_draft(category: str, facts: str, law_excerpts: str, doc_title: str, template: str) -> str:
    """Generate English draft using template and law sections."""

    user_prompt = f"""
DOCUMENT TYPE: {doc_title}

TEMPLATE TO FOLLOW (Fill in placeholders with provided facts):
{template}

CASE FACTS PROVIDED BY LAWYER:
{facts}

RELEVANT LAW SECTIONS (USE ONLY THESE - QUOTE SECTION NUMBERS):
{law_excerpts}

INSTRUCTIONS:
1. Follow the TEMPLATE structure exactly
2. Fill [PLACEHOLDERS] with information from facts
3. Keep unfilled placeholders as [PLACEHOLDER] if information not provided
4. Include law sections in the RELEVANT LAW section
5. Generate complete professional draft
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_EN},
            {"role": "user", "content": user_prompt}
        ]
    )
    return response.choices[0].message.content


def generate_urdu_draft(facts: str, english_draft: str, doc_title: str) -> str:
    """Generate Urdu draft based on English."""

    user_prompt = f"""
دستاویز کی قسم: {doc_title}

انگریزی مسودہ:
{english_draft}

اوپر دیے گئے انگریزی مسودے کو مکمل اردو میں ترجمہ کریں۔ تمام قانونی دفعات کے نمبر برقرار رکھیں۔
عدالتی فارمیٹ برقرار رکھیں۔
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=4000,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_UR},
            {"role": "user", "content": user_prompt}
        ]
    )
    return response.choices[0].message.content


@router.post("/api/draft")
async def draft_legal_document(request: DraftRequest):
    try:
        # Step 1: Load template
        template = load_template(request.category)

        # Step 2: Search for relevant law sections
        search_results = search_for_document(request.category, request.facts)

        # Step 3: Get formatted law excerpts
        law_excerpts = search_results.get("formatted_for_ai", "[No sections found]")
        doc_title = search_results.get("document_title", "Legal Document")

        # Step 4: Check if external search needed
        needs_external = search_results.get("needs_external", False)
        external_results = ""

        if needs_external and search_results.get("total_valid", 0) < 3:
            # TODO: Layer 2 - External Search
            # external_results = external_search(request.category, request.facts)
            pass

        # Step 5: Generate English draft
        draft_en = generate_english_draft(
            category=request.category,
            facts=request.facts,
            law_excerpts=law_excerpts + external_results,
            doc_title=doc_title,
            template=template
        )

        # Step 6: Generate Urdu draft
        draft_ur = generate_urdu_draft(
            facts=request.facts,
            english_draft=draft_en,
            doc_title=doc_title
        )

        # Step 7: Return response
        return {
            "draft_en": draft_en,
            "draft_ur": draft_ur,
            "category": request.category,
            "document_title": doc_title,
            "sections_found": search_results.get("total_valid", 0),
            "sections_used": [
                f"{s.get('law_name', '')} - {s.get('section_number', '')}"
                for s in search_results.get("sections", [])[:5]
            ],
            "template_used": bool(template),
            "needs_external": needs_external,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/draft/categories")
async def get_categories():
    """Return available document categories."""
    return {
        "categories": [
            {"id": key, "title": val["title"]}
            for key, val in DOCUMENT_SECTIONS.items()
        ]
    }


@router.get("/api/draft/template/{category}")
async def get_template(category: str):
    """Return template for a category (for preview)."""
    template = load_template(category)
    return {"category": category, "template": template}