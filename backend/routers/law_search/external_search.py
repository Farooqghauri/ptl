"""
LAYER 2: External Search
Searches web/APIs when local DB doesn't have enough sections
Uses OpenAI's web search capability
"""

import os
from typing import Dict, List
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def search_external(query: str, category: str, missing_sections: List[str] = None) -> Dict:
    """
    Search external sources for law sections not found locally.

    Args:
        query: User's legal query/facts
        category: Document type
        missing_sections: Specific sections to search for

    Returns:
        Dict with found sections and source info
    """

    results = {
        "source": "external_search",
        "sections": [],
        "raw_response": "",
        "success": False
    }

    # Build search prompt
    if missing_sections:
        sections_str = ", ".join(missing_sections)
        search_query = f"Pakistan law {sections_str} exact text"
    else:
        search_query = f"Pakistan law sections for {category}: {query[:200]}"

    search_prompt = f"""
You are a Pakistani legal researcher. Find the EXACT TEXT of relevant Pakistani law sections.

SEARCH FOR: {search_query}

CATEGORY: {category}

RULES:
1. Only return REAL Pakistani law sections (PPC, CrPC, CPC, Constitution, etc.)
2. Include section NUMBER and EXACT TEXT
3. Do NOT invent or paraphrase - only real law text
4. If you cannot find exact text, say "Section text not found"

FORMAT YOUR RESPONSE AS:
[SECTION: X of Law Name]
[TEXT:]
Exact text of the section...

[SECTION: Y of Law Name]
[TEXT:]
Exact text of the section...
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.1,
            max_tokens=2000,
            messages=[
                {"role": "system",
                 "content": "You are a Pakistani legal researcher. Find and cite ONLY real law sections. Never invent law."},
                {"role": "user", "content": search_prompt}
            ]
        )

        raw_response = response.choices[0].message.content
        results["raw_response"] = raw_response

        # Parse response into sections
        parsed_sections = parse_external_response(raw_response)
        results["sections"] = parsed_sections
        results["success"] = len(parsed_sections) > 0

    except Exception as e:
        results["error"] = str(e)

    return results


def parse_external_response(response: str) -> List[Dict]:
    """Parse external search response into structured sections."""
    import re

    sections = []

    # Pattern to find sections
    pattern = r'\[SECTION:\s*(.+?)\]\s*\[TEXT:\]\s*(.+?)(?=\[SECTION:|$)'
    matches = re.findall(pattern, response, re.DOTALL | re.IGNORECASE)

    for match in matches:
        section_ref = match[0].strip()
        section_text = match[1].strip()

        # Skip if text indicates not found
        if "not found" in section_text.lower() or len(section_text) < 20:
            continue

        # Parse section reference
        law_name, section_num = parse_section_reference(section_ref)

        sections.append({
            "found": True,
            "source": "external_search",
            "law_name": law_name,
            "section_number": section_num,
            "section_title": section_ref,
            "section_text": section_text[:800],  # Truncate
        })

    return sections


def parse_section_reference(ref: str) -> tuple:
    """Parse section reference like '497 of CrPC' into (law_name, section_num)."""
    import re

    ref_lower = ref.lower()

    # Extract section number
    num_match = re.search(r'(\d+[A-Za-z]?)', ref)
    section_num = num_match.group(1) if num_match else ""

    # Determine law name
    if 'crpc' in ref_lower or 'criminal procedure' in ref_lower:
        law_name = "Code of Criminal Procedure 1898"
    elif 'ppc' in ref_lower or 'penal code' in ref_lower:
        law_name = "Pakistan Penal Code 1860"
    elif 'cpc' in ref_lower or 'civil procedure' in ref_lower:
        law_name = "Code of Civil Procedure 1908"
    elif 'constitution' in ref_lower or 'article' in ref_lower:
        law_name = "Constitution of Pakistan 1973"
    elif 'qso' in ref_lower or 'shahadat' in ref_lower:
        law_name = "Qanun-e-Shahadat Order 1984"
    elif 'dissolution' in ref_lower or 'muslim marriages' in ref_lower:
        law_name = "Dissolution of Muslim Marriages Act 1939"
    elif 'family' in ref_lower or 'mflo' in ref_lower:
        law_name = "Muslim Family Laws Ordinance 1961"
    elif 'guardians' in ref_lower or 'wards' in ref_lower:
        law_name = "Guardians and Wards Act 1890"
    else:
        law_name = "Unknown Law"

    return law_name, section_num


def search_for_missing_sections(local_results: Dict, category: str, facts: str) -> Dict:
    """
    Determine what's missing from local search and fetch externally.

    Logic:
    - If local found < 3 sections → search externally
    - If specific sections mentioned in facts but not found → search those
    """

    local_count = local_results.get("total_valid", 0)

    # Don't search externally if local has enough
    if local_count >= 3:
        return {"needed": False, "sections": []}

    # Extract any specific sections mentioned in facts that weren't found
    import re
    mentioned_sections = []

    # Find sections mentioned in facts
    section_patterns = [
        (r'section\s*(\d+[A-Za-z]?)\s*(crpc|ppc|cpc)', r'\1 \2'),
        (r'article\s*(\d+)', r'Article \1 Constitution'),
        (r'order\s*([ivxlc]+)\s*rule\s*(\d+)', r'Order \1 Rule \2 CPC'),
    ]

    for pattern, replacement in section_patterns:
        matches = re.findall(pattern, facts.lower())
        for match in matches:
            if isinstance(match, tuple):
                mentioned_sections.append(" ".join(match).upper())
            else:
                mentioned_sections.append(match.upper())

    # Check which mentioned sections were NOT found locally
    found_sections = set()
    for s in local_results.get("sections", []):
        found_sections.add(s.get("section_number", "").lower())

    missing = [s for s in mentioned_sections if s.lower() not in found_sections]

    # Perform external search
    if missing or local_count < 3:
        external_results = search_external(
            query=facts,
            category=category,
            missing_sections=missing if missing else None
        )
        return {
            "needed": True,
            "searched_for": missing,
            "sections": external_results.get("sections", []),
            "success": external_results.get("success", False)
        }

    return {"needed": False, "sections": []}


# Test function
if __name__ == "__main__":
    print("=== Testing External Search ===\n")

    result = search_external(
        query="Client arrested for murder under section 302 PPC",
        category="bail_post_arrest",
        missing_sections=["302 PPC", "497 CrPC"]
    )

    print(f"Success: {result['success']}")
    print(f"Sections found: {len(result['sections'])}")

    for s in result["sections"]:
        print(f"\n- {s['law_name']} Section {s['section_number']}")
        print(f"  Text: {s['section_text'][:100]}...")