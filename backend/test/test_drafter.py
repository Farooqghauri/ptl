"""
════════════════════════════════════════════════════════════════
FILE LOCATION: backend/test/test_drafter_full.py
════════════════════════════════════════════════════════════════

DRAFTER FULL TESTER
- Verifies Law Rules Engine government detection
- Verifies /api/draft output doesn't leak CPC 80 into private notices
- Prints clean PASS/FAIL + debug info

RUN:
  (venv) PS ...\backend> python test/test_drafter_full.py

OPTIONAL (API test):
  Start server first:
    uvicorn main:app --reload
  Then script will also hit http://127.0.0.1:8000/api/draft
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure backend/ is on PYTHONPATH
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))


# ---------- CONFIG ----------
API_URL = "http://127.0.0.1:8000/api/draft"  # change if your port differs
ENABLE_API_TEST = True  # set False if you only want rules-engine tests

# ---------- IMPORTS ----------
# Make sure you're running from backend/ folder
try:
    from services.law_rules import get_applicable_sections
except Exception as e:
    print("❌ ERROR importing services.law_rules. Run this from backend/ folder.")
    print("   Example: cd backend  then python test/test_drafter_full.py")
    raise


# ---------- SECTION 80 DETECTORS ----------
SEC80_PATTERNS = [
    r"\bsection\s*80\b.*\b(cpc|c\.?\s*p\.?\s*c\.?|code\s+of\s+civil\s+procedure|civil\s+procedure\s+code)\b",
    r"\bu\s*/\s*s\.?\s*80\b.*\b(cpc|c\.?\s*p\.?\s*c\.?)\b",
    r"\bu/s\.?\s*80\b.*\b(cpc|c\.?\s*p\.?\s*c\.?)\b",
    r"\bcpc\s*section\s*80\b",
]

SEC80_REGEX = re.compile("|".join(SEC80_PATTERNS), flags=re.IGNORECASE)


def contains_section_80(text: str) -> bool:
    return bool(SEC80_REGEX.search(text or ""))


def extract_sections_used_from_analysis(analysis) -> List[str]:
    sections = []
    for s in (analysis.applicable_sections or []):
        sections.append(f"{s.law_short} Section {s.section_number}")
    return sections


def pretty(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


def print_banner(title: str):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


# ---------- OPTIONAL API CALL ----------
def call_api(payload: Dict[str, Any]) -> Dict[str, Any]:
    import requests  # pip install requests (usually already present)

    resp = requests.post(API_URL, json=payload, timeout=120)
    try:
        data = resp.json()
    except Exception:
        data = {"raw_text": resp.text}

    if resp.status_code != 200:
        raise RuntimeError(f"API error {resp.status_code}: {pretty(data)}")

    return data


# ---------- TEST CASES ----------
PRIVATE_FACTS = """My client Muhammad Farooq S/o Abdul Rashid, CNIC 35201-1234567-9, resident of House No. 45, Street 7, Johar Town, Lahore, wants to send notice to his neighbor Ms. Samina Bibi W/o Tariq Mehmood, resident of House No. 47, Street 7, Johar Town, Lahore. The neighbor has been playing loud music every night from 11 PM to 3 AM for the last 2 months causing severe disturbance and sleep deprivation to my client and his family. Despite multiple verbal requests, she has refused to stop. My client demands she cease this nuisance within 7 days or face legal action."""

GOVT_FACTS = """My client Ali Hassan S/o Ghulam Abbas, CNIC 42301-9876543-1, resident of Flat No. 12, Block C, Gulshan-e-Iqbal, Karachi, wants to send notice to WAPDA (Water and Power Development Authority) through its Chief Executive Officer, WAPDA House, Lahore. WAPDA has been sending inflated electricity bills since August 2023. My client's average bill was Rs. 5,000 per month but suddenly increased to Rs. 45,000 without any change in consumption. Despite filing complaints at WAPDA office Karachi on 10th September 2023 (Complaint No. WPD-2023-78456), no action has been taken. My client demands correction of bills and refund of excess amount within 30 days."""

TESTS: List[Tuple[str, str, bool]] = [
    ("PRIVATE LEGAL NOTICE (Neighbor Noise)", PRIVATE_FACTS, False),
    ("GOVT LEGAL NOTICE (WAPDA Bills)", GOVT_FACTS, True),
]


def run_rules_engine_tests() -> bool:
    print_banner("🚀 RULES ENGINE TESTS (NO API)")

    all_ok = True
    for title, facts, expected_gov in TESTS:
        print_banner(title)

        analysis = get_applicable_sections("Legal Notice", facts)
        sections_used = extract_sections_used_from_analysis(analysis)

        result = {
            "expected_is_government_involved": expected_gov,
            "actual_is_government_involved": analysis.is_government_involved,
            "sections_from_rules_engine": sections_used,
            "warnings": analysis.warnings,
            "flags_for_review": analysis.flags_for_review,
        }
        print(pretty(result))

        ok_gov = (analysis.is_government_involved == expected_gov)

        # If private, CPC 80 must NOT be in sections list
        ok_sec80 = True
        if not expected_gov:
            ok_sec80 = all("CPC Section 80" not in s for s in sections_used)

        if ok_gov and ok_sec80:
            print("✅ PASS (Rules Engine)")
        else:
            all_ok = False
            print("❌ FAIL (Rules Engine)")
            if not ok_gov:
                print("   - Govt detection mismatch.")
            if not ok_sec80:
                print("   - Private case still includes CPC Section 80 in rules sections.")

    return all_ok


def run_api_tests() -> bool:
    print_banner("🌐 API TESTS (/api/draft)")

    try:
        import requests  # noqa
    except Exception:
        print("❌ requests not installed. Install: pip install requests")
        return False

    all_ok = True
    for title, facts, expected_gov in TESTS:
        print_banner(title)

        payload = {"category": "Legal Notice", "facts": facts, "tone": "Formal"}

        try:
            data = call_api(payload)
        except Exception as e:
            all_ok = False
            print("❌ API call failed:", str(e))
            continue

        draft_en = data.get("draft_en", "")
        draft_ur = data.get("draft_ur", "")
        is_gov = data.get("is_government_involved")
        sections_used = data.get("sections_used", [])

        checks = {
            "expected_is_government_involved": expected_gov,
            "actual_is_government_involved": is_gov,
            "sections_used": sections_used,
            "draft_en_contains_section_80": contains_section_80(draft_en),
            "draft_ur_contains_section_80": contains_section_80(draft_ur),
            "draft_en_first_25_lines": "\n".join(draft_en.splitlines()[:25]),
        }

        print(pretty(checks))

        ok_gov = (is_gov == expected_gov)

        # For private case: must not contain Section 80 anywhere (EN/UR) + must not show in sections_used
        if not expected_gov:
            ok_no80 = (
                (not contains_section_80(draft_en))
                and (not contains_section_80(draft_ur))
                and (all("CPC Section 80" not in s for s in sections_used))
            )
        else:
            # For govt case: should contain Section 80 somewhere and sections_used should include it
            ok_no80 = (
                (contains_section_80(draft_en) or "CPC Section 80" in " ".join(sections_used))
            )

        if ok_gov and ok_no80:
            print("✅ PASS (API)")
        else:
            all_ok = False
            print("❌ FAIL (API)")
            if not ok_gov:
                print("   - Govt detection mismatch in API response.")
            if not ok_no80:
                if expected_gov:
                    print("   - Govt case is missing CPC 80 (unexpected).")
                else:
                    print("   - Private case still contains CPC 80 somewhere (unexpected).")

    return all_ok


def main():
    print("\n🚀 STARTING FULL DRAFTER VERIFICATION\n")

    ok_rules = run_rules_engine_tests()

    ok_api = True
    if ENABLE_API_TEST:
        ok_api = run_api_tests()
    else:
        print("\n(API test skipped: ENABLE_API_TEST=False)\n")

    print_banner("✅ FINAL RESULT")
    if ok_rules and ok_api:
        print("✅ ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()
