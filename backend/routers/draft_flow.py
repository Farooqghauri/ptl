from fastapi import APIRouter, HTTPException, Request
import re
from typing import List, Dict

from utils.law_index import LawIndex, format_hits_for_prompt

router = APIRouter()
law_index = LawIndex()

# -----------------------------
# Procedural Knowledge Base
# -----------------------------

SECTION_OVERRIDES = {
    r"12\s*\(?2\)?\s*cpc": "Application under Section 12(2) CPC (Setting Aside Decree)",
    r"order\s*21\s*rule\s*26": "Stay of Execution Application (Order XXI Rule 26 CPC)",
    r"order\s*xxxix\s*rule\s*1": "Temporary Injunction Application (Order XXXIX Rule 1 CPC)",
    r"order\s*xxxix\s*rule\s*2": "Temporary Injunction Application (Order XXXIX Rule 2 CPC)",
    r"497\s*crpc": "Bail Petition (Post Arrest) u/s 497 CrPC",
    r"498\s*crpc": "Bail Petition (Pre Arrest) u/s 498 CrPC",
    r"249\s*a\s*crpc": "Application for Acquittal u/s 249-A CrPC",
    r"561\s*a\s*crpc": "Application for Quashing FIR u/s 561-A CrPC",
    r"article\s*199": "Constitutional Writ Petition u/Art 199",
}

BUNDLE_TRIGGERS = [
    "draft all necessary",
    "all required applications",
    "complete documentation",
    "along with stay",
    "bundle",
]

# -----------------------------
# Helpers
# -----------------------------

def detect_explicit_sections(text: str) -> List[str]:
    t = text.lower()
    found = []
    for pattern, title in SECTION_OVERRIDES.items():
        if re.search(pattern, t):
            found.append(title)
    return found


def is_bundle_request(text: str) -> bool:
    t = text.lower()
    return any(trigger in t for trigger in BUNDLE_TRIGGERS)


def clarification_response() -> Dict:
    return {
        "detected_mode": "clarification_required",
        "documents": [
            {
                "title": "Clarification Required",
                "content": (
                    "Please clarify what you want to draft:\n"
                    "1. Court application under a specific section or order\n"
                    "2. Legal notice before litigation\n"
                    "3. Civil suit or writ petition\n\n"
                    "Mention the section or relief so the draft is prepared correctly."
                ),
            }
        ],
    }

# -----------------------------
# Core Endpoint (FORGIVING)
# -----------------------------

@router.post("/api/draft")
async def draft_flow(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    facts = body.get("facts")

    if not isinstance(facts, str) or not facts.strip():
        return clarification_response()

    text = facts.strip()

    # PRIORITY 1 — Explicit Section Override
    explicit_docs = detect_explicit_sections(text)
    bundle = is_bundle_request(text)

    documents = []

    if explicit_docs:
        for title in explicit_docs:
            refs = law_index.extract_and_resolve_from_text(title + " " + text)
            law_block = format_hits_for_prompt(refs)

            documents.append({
                "title": title,
                "content": (
                    f"{title}\n\n"
                    f"FACTS AND GROUNDS:\n{text}\n\n"
                    f"RELEVANT LAW:\n{law_block}"
                ),
            })

        return {
            "detected_mode": "procedural_override_bundle" if bundle or len(documents) > 1 else "procedural_override_single",
            "documents": documents,
        }

    # PRIORITY 2 — Explicit Legal Notice (ONLY if asked)
    if "draft a legal notice" in text.lower():
        return {
            "detected_mode": "explicit_legal_notice",
            "documents": [
                {
                    "title": "Legal Notice",
                    "content": text,
                }
            ],
        }

    # PRIORITY 5 — Ask, never assume
    return clarification_response()
