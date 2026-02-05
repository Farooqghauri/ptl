"""
════════════════════════════════════════════════════════════════
FILE LOCATION: backend/services/search_orchestrator.py
════════════════════════════════════════════════════════════════

SEARCH ORCHESTRATOR
Coordinates Layer 1 (Local) → Layer 2 (External) → Layer 3 (Filter)
"""

from typing import Dict, List, Optional
import re

from routers.law_search.local_search import smart_search, search_by_section, search_by_keywords, search_by_law_name, \
    search_cpc_order_rule
from routers.law_search.filter_organize import organize_results
from routers.law_search.external_search import search_for_missing_sections

# ═══════════════════════════════════════════════════════════════
# DOCUMENT SECTIONS - Keys match UI labels in drafter.py
# ═══════════════════════════════════════════════════════════════

DOCUMENT_SECTIONS = {
    # ----- BAIL -----
    "Bail Petition (Post-Arrest)": {
        "title": "Bail Petition (Post-Arrest)",
        "required": [("CrPC", "497"), ("CrPC", "498"), ("CrPC", "496"), ("CrPC", "499")],
        "keywords": ["bail", "non-bailable", "arrest", "custody", "remand"],
    },
    "Bail Petition (Pre-Arrest)": {
        "title": "Bail Petition (Pre-Arrest/Anticipatory)",
        "required": [("CrPC", "498"), ("CrPC", "497")],
        "keywords": ["anticipatory", "bail", "apprehension", "FIR"],
    },

    # ----- CIVIL -----
    "Legal Notice": {
        "title": "Legal Notice",
        "required": [],  # Section 80 CPC is ONLY for government - removed
        "keywords": ["notice", "demand", "compliance", "breach", "nuisance", "trespass"],
        "context_note": "Section 80 CPC applies ONLY to notices against Government. For private disputes, no specific section required - just general civil law principles apply.",
    },
    "Suit for Recovery": {
        "title": "Suit for Recovery of Money",
        "required": [("CPC", "9"), ("CPC", "10"), ("CPC", "11")],
        "keywords": ["recovery", "money", "debt", "decree", "damages"],
    },
    "Stay Application": {
        "title": "Stay Application",
        "required": [],
        "keywords": ["stay", "injunction", "interim relief", "status quo"],
        "order_rules": [(39, 1), (39, 2)],
    },

    # ----- FAMILY -----
    "Divorce Deed (Talaq-nama)": {
        "title": "Suit for Dissolution of Marriage (Khula)",
        "required": [("MFLO", "7"), ("MFLO", "8"), ("MFLO", "9"), ("MFLO", "10")],
        "keywords": ["khula", "talaq", "divorce", "dissolution", "marriage", "mehr", "dower"],
        "law_names": ["Muslim Family Laws", "Dissolution of Muslim Marriages"],
    },
    "Custody Petition": {
        "title": "Child Custody Petition (Hizanat)",
        "required": [],
        "keywords": ["custody", "child", "guardian", "hizanat", "welfare", "minor"],
        "law_names": ["Guardians and Wards Act"],
    },

    # ----- CRIMINAL -----
    "Cheque Dishonour": {
        "title": "Complaint under Section 489-F PPC",
        "required": [("PPC", "489F"), ("PPC", "489")],
        "keywords": ["cheque", "dishonour", "bounce", "bank", "fraud"],
    },
    "Quashing FIR": {
        "title": "Petition for Quashing FIR",
        "required": [("CrPC", "561A"), ("Constitution", "199")],
        "keywords": ["quash", "FIR", "mala fide", "abuse of process"],
    },

    # ----- CONSTITUTIONAL -----
    "Writ Petition": {
        "title": "Constitutional Writ Petition",
        "required": [("Constitution", "199"), ("Constitution", "184"), ("Constitution", "4")],
        "keywords": ["fundamental rights", "writ", "mandamus", "certiorari", "habeas corpus"],
    },

    # ----- LEGACY KEYS (for backward compatibility) -----
    "bail_post_arrest": {
        "title": "Bail Petition (Post-Arrest)",
        "required": [("CrPC", "497"), ("CrPC", "498")],
        "keywords": ["bail", "non-bailable", "arrest"],
    },
    "bail_pre_arrest": {
        "title": "Bail Petition (Pre-Arrest/Anticipatory)",
        "required": [("CrPC", "498")],
        "keywords": ["anticipatory", "bail"],
    },
    "legal_notice": {
        "title": "Legal Notice",
        "required": [("CPC", "80")],
        "keywords": ["notice", "demand"],
    },
    "writ_petition": {
        "title": "Constitutional Writ Petition",
        "required": [("Constitution", "199"), ("Constitution", "4")],
        "keywords": ["fundamental rights", "writ"],
    },
    "suit_recovery": {
        "title": "Suit for Recovery of Money",
        "required": [("CPC", "9")],
        "keywords": ["recovery", "money", "debt"],
    },
    "divorce_khula": {
        "title": "Suit for Dissolution of Marriage (Khula)",
        "required": [],
        "keywords": ["khula", "dissolution", "marriage"],
        "law_names": ["Muslim Family Laws", "Dissolution of Muslim Marriages"],
    },
    "divorce_talaq": {
        "title": "Talaq (Divorce by Husband)",
        "required": [],
        "keywords": ["talaq", "divorce"],
        "law_names": ["Muslim Family Laws"],
    },
    "rent_petition": {
        "title": "Rent Petition / Ejectment",
        "required": [("CPC", "13")],
        "keywords": ["rent", "tenant", "ejectment"],
    },
    "stay_application": {
        "title": "Stay Application",
        "required": [],
        "keywords": ["stay", "injunction"],
        "order_rules": [(39, 1), (39, 2)],
    },
    "cheque_dishonour": {
        "title": "Complaint under Section 489-F PPC",
        "required": [("PPC", "489F")],
        "keywords": ["cheque", "dishonour"],
    },
    "custody_petition": {
        "title": "Child Custody Petition (Hizanat)",
        "required": [],
        "keywords": ["custody", "child", "guardian"],
        "law_names": ["Guardians and Wards Act"],
    },
    "quashing_fir": {
        "title": "Petition for Quashing FIR",
        "required": [("CrPC", "561A")],
        "keywords": ["quash", "fir"],
    },
    "maintenance": {
        "title": "Suit for Maintenance",
        "required": [],
        "keywords": ["maintenance", "nafaqa"],
        "law_names": ["Muslim Family Laws", "Family Courts Act"],
    },
}


def extract_references_from_text(text: str) -> Dict:
    """Extract legal references from user input."""
    references = {"sections": [], "articles": [], "orders": []}
    text_lower = text.lower()

    # Section patterns: "section 302 PPC", "u/s 497 CrPC", "sec 80 CPC"
    section_pattern = re.findall(r"(?:section|sec|u/s)\s*(\d+[A-Z]?)\s*(crpc|ppc|cpc)", text_lower, re.IGNORECASE)
    for match in section_pattern:
        references["sections"].append({"number": match[0].upper(), "law": match[1].upper()})

    # Also catch: "302 PPC", "497 CrPC" without prefix
    direct_pattern = re.findall(r"\b(\d+[A-Z]?)\s+(ppc|crpc|cpc)\b", text_lower, re.IGNORECASE)
    for match in direct_pattern:
        ref = {"number": match[0].upper(), "law": match[1].upper()}
        if ref not in references["sections"]:
            references["sections"].append(ref)

    # Article patterns: "Article 199", "Art. 25"
    article_pattern = re.findall(r"article\s*(\d+)", text_lower, re.IGNORECASE)
    for match in article_pattern:
        references["articles"].append(match)

    # Order/Rule patterns: "Order XXI Rule 26", "O.39 R.1"
    order_pattern = re.findall(r"order\s*([ivxlc]+|\d+)\s*rule\s*(\d+)", text_lower, re.IGNORECASE)
    for match in order_pattern:
        references["orders"].append({"order": match[0], "rule": match[1]})

    return references


def search_for_document(category: str, facts: str) -> Dict:
    """
    Main search function for legal drafting.

    Args:
        category: Document type (UI label like "Bail Petition (Post-Arrest)")
        facts: User's case facts/instructions

    Returns:
        Dict with sections, formatted_for_ai, and metadata
    """

    all_results = {"sections": [], "judgments": []}
    doc_config = DOCUMENT_SECTIONS.get(category, {})

    # If category not found, try to find partial match
    if not doc_config:
        category_lower = category.lower()
        for key, config in DOCUMENT_SECTIONS.items():
            if category_lower in key.lower() or key.lower() in category_lower:
                doc_config = config
                break

    # Step 1: Required sections (highest priority)
    for law_code, section_num in doc_config.get("required", []):
        result = search_by_section(law_code, section_num)
        if result and result.get("found"):
            all_results["sections"].append(result)

    # Step 2: Law names (for family law, etc.)
    for law_name in doc_config.get("law_names", []):
        results = search_by_law_name(law_name, limit=5)
        for r in results:
            if r.get("found"):
                all_results["sections"].append(r)

    # Step 3: Order/Rules (for CPC)
    for order_num, rule_num in doc_config.get("order_rules", []):
        result = search_cpc_order_rule(order_num, rule_num)
        if result and result.get("found"):
            all_results["sections"].append(result)

    # Step 4: User references from facts
    user_refs = extract_references_from_text(facts)

    for ref in user_refs["sections"]:
        result = search_by_section(ref["law"], ref["number"])
        if result and result.get("found"):
            all_results["sections"].append(result)

    for article in user_refs["articles"]:
        result = search_by_section("Constitution", article)
        if result and result.get("found"):
            all_results["sections"].append(result)

    for order_ref in user_refs["orders"]:
        # Convert roman numerals if needed
        order_num = order_ref["order"]
        if order_num.isdigit():
            order_num = int(order_num)
        else:
            roman_map = {
                "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7,
                "viii": 8, "ix": 9, "x": 10, "xi": 11, "xii": 12, "xiii": 13,
                "xiv": 14, "xv": 15, "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19,
                "xx": 20, "xxi": 21, "xxxix": 39, "xl": 40,
            }
            order_num = roman_map.get(order_num.lower(), 0)

        if order_num > 0:
            result = search_cpc_order_rule(order_num, int(order_ref["rule"]))
            if result and result.get("found"):
                all_results["sections"].append(result)

    # Step 5: Keyword search
    keywords = doc_config.get("keywords", [])
    if keywords:
        keyword_results = search_by_keywords(" ".join(keywords), limit=3)
        for r in keyword_results:
            if r.get("found"):
                all_results["sections"].append(r)

    # Step 6: Smart search on facts
    fact_results = smart_search(facts)
    all_results["sections"].extend(fact_results.get("sections", []))
    all_results["judgments"].extend(fact_results.get("judgments", []))

    # Step 7: Filter and organize
    query = f"{doc_config.get('title', category)} {facts[:100]}"
    organized = organize_results(all_results, query)

    organized["category"] = category
    organized["document_title"] = doc_config.get("title", category)
    organized["needs_external"] = not organized["sufficient"]

    # Step 8: External search if needed (only if < 3 sections)
    if organized["total_valid"] < 3:
        try:
            external = search_for_missing_sections(organized, category, facts)
            if external.get("success") and external.get("sections"):
                organized["sections"].extend(external["sections"])
                organized["total_valid"] = len(organized["sections"])
                organized["external_used"] = True
                organized["external_sections"] = len(external["sections"])

                # Rebuild formatted_for_ai
                from routers.law_search.filter_organize import format_section_for_ai
                for s in external["sections"]:
                    organized["formatted_for_ai"] += "\n\n--- External Source ---\n"
                    organized["formatted_for_ai"] += format_section_for_ai(s)
        except Exception as e:
            organized["external_error"] = str(e)
            organized["external_used"] = False
    else:
        organized["external_used"] = False

    return organized


def search_general(query: str) -> Dict:
    """General search for research tool."""
    raw_results = smart_search(query)
    return organize_results(raw_results, query)


# ═══════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=== Testing Search Orchestrator ===\n")

    # Test with UI label (new format)
    print("Test 1: Bail Petition (Post-Arrest) - UI Label")
    result = search_for_document("Bail Petition (Post-Arrest)", "Client arrested in FIR 123 under section 302 PPC")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}")
    print(f"Sections: {[s.get('section_number') for s in result.get('sections', [])[:5]]}\n")

    # Test with legacy key
    print("Test 2: bail_post_arrest - Legacy Key")
    result = search_for_document("bail_post_arrest", "Client arrested under 497 CrPC")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}\n")

    # Test Divorce
    print("Test 3: Divorce Deed (Talaq-nama)")
    result = search_for_document("Divorce Deed (Talaq-nama)", "Wife wants khula from husband, mehr 500000")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}")
    print(f"Sections: {[s.get('section_number') for s in result.get('sections', [])[:5]]}\n")

    # Test Writ
    print("Test 4: Writ Petition")
    result = search_for_document("Writ Petition", "Rights violated under Article 199")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}")
    print(f"Sections: {[s.get('section_number') for s in result.get('sections', [])[:5]]}\n")

    print("Test 5: General Search")
    result = search_general("cheque dishonour 489-F")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}")