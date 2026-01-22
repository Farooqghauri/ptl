"""
LAYER 3: Filter and Organize
Validates, deduplicates, and organizes search results
"""

from typing import List, Dict, Any
import re


def remove_duplicates(results: List[Dict]) -> List[Dict]:
    """Remove duplicate entries based on law_name + section_number."""
    seen = set()
    unique = []

    for item in results:
        if not item.get("found"):
            continue

        # Create unique key
        key = f"{item.get('law_name', '')}_{item.get('section_number', '')}".lower()
        key = re.sub(r"\s+", "", key)

        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique


def validate_section(item: Dict) -> bool:
    """Check if section data is valid and complete."""
    required_fields = ["law_name", "section_number"]

    for field in required_fields:
        if not item.get(field):
            return False

    # Must have either title or text
    if not item.get("section_title") and not item.get("section_text"):
        return False

    # Section text should have reasonable length
    text = item.get("section_text", "")
    if text and len(text) < 10:
        return False

    return True


def validate_judgment(item: Dict) -> bool:
    """Check if judgment data is valid."""
    if not item.get("title"):
        return False
    if not item.get("citation") and not item.get("summary"):
        return False
    return True


def calculate_relevance(item: Dict, query: str) -> int:
    """
    Calculate relevance score (0-100).
    Higher = more relevant.
    """
    score = 50  # Base score
    query_lower = query.lower()

    # Title match
    title = (item.get("section_title") or "").lower()
    if query_lower in title:
        score += 30

    # Exact section number match
    section_num = str(item.get("section_number", "")).lower()
    if section_num in query_lower:
        score += 20

    # Law name match
    law_name = (item.get("law_name") or "").lower()
    query_words = query_lower.split()
    for word in query_words:
        if len(word) > 3 and word in law_name:
            score += 10

    # Keyword match bonus
    if item.get("matched_keyword"):
        score += 15

    # Has complete text
    if item.get("section_text") and len(item.get("section_text", "")) > 100:
        score += 10

    return min(score, 100)


def format_section_for_ai(item: Dict) -> str:
    """Format section data for AI prompt."""
    law = item.get("law_name", "Unknown Law")
    section = item.get("section_number", "")
    title = item.get("section_title", "")
    text = item.get("section_text", "")

    # Truncate text if too long
    if len(text) > 800:
        text = text[:800] + "..."

    formatted = f"""
[LAW: {law}]
[SECTION: {section}]
[TITLE: {title}]
[TEXT:]
{text}
""".strip()

    return formatted


def format_judgment_for_ai(item: Dict) -> str:
    """Format judgment data for AI prompt."""
    title = item.get("title", "Unknown Case")
    citation = item.get("citation", "")
    date = item.get("date", "")
    summary = item.get("summary", "")

    # Truncate summary if too long
    if len(summary) > 500:
        summary = summary[:500] + "..."

    formatted = f"""
[CASE: {title}]
[CITATION: {citation}]
[DATE: {date}]
[SUMMARY:]
{summary}
""".strip()

    return formatted


def organize_results(raw_results: Dict, query: str) -> Dict:
    """
    Main function: Filter, validate, organize search results.

    Input: Raw results from local_search or external_search
    Output: Clean, organized, validated results ready for AI
    """
    output = {
        "query": query,
        "sections": [],
        "judgments": [],
        "formatted_for_ai": "",
        "total_valid": 0,
        "sufficient": False,
    }

    # Process sections
    raw_sections = raw_results.get("sections", [])

    # Step 1: Remove duplicates
    unique_sections = remove_duplicates(raw_sections)

    # Step 2: Validate each
    valid_sections = [s for s in unique_sections if validate_section(s)]

    # Step 3: Calculate relevance
    for section in valid_sections:
        section["relevance_score"] = calculate_relevance(section, query)

    # Step 4: Sort by relevance
    valid_sections.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

    # Step 5: Limit to top results
    output["sections"] = valid_sections[:10]

    # Process judgments
    raw_judgments = raw_results.get("judgments", [])
    valid_judgments = [j for j in raw_judgments if validate_judgment(j)]
    output["judgments"] = valid_judgments[:5]

    # Calculate totals
    output["total_valid"] = len(output["sections"]) + len(output["judgments"])
    output["sufficient"] = output["total_valid"] >= 1

    # Format for AI
    ai_parts = []

    if output["sections"]:
        ai_parts.append("=== RELEVANT LAW SECTIONS ===")
        for i, section in enumerate(output["sections"], 1):
            ai_parts.append(f"\n--- Section {i} ---")
            ai_parts.append(format_section_for_ai(section))

    if output["judgments"]:
        ai_parts.append("\n\n=== RELEVANT JUDGMENTS ===")
        for i, judgment in enumerate(output["judgments"], 1):
            ai_parts.append(f"\n--- Judgment {i} ---")
            ai_parts.append(format_judgment_for_ai(judgment))

    if not ai_parts:
        ai_parts.append("[NO RELEVANT LAW SECTIONS FOUND IN DATABASE]")

    output["formatted_for_ai"] = "\n".join(ai_parts)

    return output


# Quick test
if __name__ == "__main__":
    # Simulated raw results
    test_raw = {
        "sections": [
            {
                "found": True,
                "law_name": "Code of Criminal Procedure 1898",
                "section_number": "497",
                "section_title": "When bail may be taken in cases of non-bailable offence",
                "section_text": "When any person accused of non-bailable offence is arrested or detained..."
            },
            {
                "found": True,
                "law_name": "Code of Criminal Procedure 1898",
                "section_number": "497",
                "section_title": "When bail may be taken in cases of non-bailable offence",
                "section_text": "When any person accused of non-bailable offence is arrested or detained..."
            },
        ],
        "judgments": []
    }

    result = organize_results(test_raw, "Section 497 CrPC bail")

    print("=== Filter Test ===")
    print(f"Total valid: {result['total_valid']}")
    print(f"Sufficient: {result['sufficient']}")
    print(f"\nFormatted for AI:\n{result['formatted_for_ai'][:500]}...")