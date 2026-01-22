"""
SEARCH ORCHESTRATOR
Coordinates Layer 1 (Local) → Layer 2 (External) → Layer 3 (Filter)
"""

from typing import Dict, List, Optional
import re

from routers.law_search.local_search import smart_search, search_by_section, search_by_keywords, search_by_law_name, \
    search_cpc_order_rule
from routers.law_search.filter_organize import organize_results
from routers.law_search.external_search import search_for_missing_sections

DOCUMENT_SECTIONS = {
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

    section_pattern = re.findall(r"(?:section|sec|u/s)\s*(\d+[A-Z]?)\s*(crpc|ppc|cpc)", text_lower, re.IGNORECASE)
    for match in section_pattern:
        references["sections"].append({"number": match[0].upper(), "law": match[1].upper()})

    article_pattern = re.findall(r"article\s*(\d+)", text_lower, re.IGNORECASE)
    for match in article_pattern:
        references["articles"].append(match)

    order_pattern = re.findall(r"order\s*([ivxlc]+|\d+)\s*rule\s*(\d+)", text_lower, re.IGNORECASE)
    for match in order_pattern:
        references["orders"].append({"order": match[0], "rule": match[1]})

    return references


def search_for_document(category: str, facts: str) -> Dict:
    """Main search function for legal drafting."""

    all_results = {"sections": [], "judgments": []}
    doc_config = DOCUMENT_SECTIONS.get(category, {})

    # Step 1: Required sections
    for law_code, section_num in doc_config.get("required", []):
        result = search_by_section(law_code, section_num)
        if result and result.get("found"):
            all_results["sections"].append(result)

    # Step 2: Law names
    for law_name in doc_config.get("law_names", []):
        results = search_by_law_name(law_name, limit=5)
        for r in results:
            if r.get("found"):
                all_results["sections"].append(r)

    # Step 3: Order/Rules
    for order_num, rule_num in doc_config.get("order_rules", []):
        result = search_cpc_order_rule(order_num, rule_num)
        if result and result.get("found"):
            all_results["sections"].append(result)

    # Step 4: User references
    user_refs = extract_references_from_text(facts)
    for ref in user_refs["sections"]:
        result = search_by_section(ref["law"], ref["number"])
        if result and result.get("found"):
            all_results["sections"].append(result)

    for article in user_refs["articles"]:
        result = search_by_section("Constitution", article)
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
    organized["document_title"] = doc_config.get("title", "Legal Document")
    organized["needs_external"] = not organized["sufficient"]

    # Step 8: External search if needed
    if organized["total_valid"] < 3:
        external = search_for_missing_sections(organized, category, facts)
        if external.get("success") and external.get("sections"):
            # Add external sections to results
            organized["sections"].extend(external["sections"])
            organized["total_valid"] = len(organized["sections"])
            organized["external_used"] = True
            organized["external_sections"] = len(external["sections"])

            # Rebuild formatted_for_ai
            from routers.law_search.filter_organize import format_section_for_ai
            for s in external["sections"]:
                organized["formatted_for_ai"] += "\n\n--- External Source ---\n"
                organized["formatted_for_ai"] += format_section_for_ai(s)
    else:
        organized["external_used"] = False

    return organized


def search_general(query: str) -> Dict:
    """General search for research tool."""
    raw_results = smart_search(query)
    return organize_results(raw_results, query)


if __name__ == "__main__":
    print("=== Testing Search Orchestrator ===\n")

    print("Test 1: Bail Petition")
    result = search_for_document("bail_post_arrest", "Client arrested in FIR 123 under section 302 PPC")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}\n")

    print("Test 2: Divorce/Khula")
    result = search_for_document("divorce_khula", "Wife wants khula from husband")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}\n")

    print("Test 3: Writ Petition")
    result = search_for_document("writ_petition", "Rights violated under Article 199")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}\n")

    print("Test 4: General Search")
    result = search_general("cheque dishonour 489-F")
    print(f"Found: {result['total_valid']} | Sufficient: {result['sufficient']}")