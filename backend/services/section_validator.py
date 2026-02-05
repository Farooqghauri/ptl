"""
════════════════════════════════════════════════════════════════
FILE LOCATION: backend/services/section_validator.py
════════════════════════════════════════════════════════════════

SECTION VALIDATOR
Validates AI-generated drafts against law rules engine.

This module:
1. Checks if AI used correct sections
2. Flags wrong sections
3. Injects correct sections if missing
4. Adds warnings for lawyer review
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

try:
    from services.law_rules import (
        get_applicable_sections,
        format_sections_for_draft,
        CaseAnalysis,
        ApplicableSection,
        Confidence
    )
except ImportError:
    # For standalone testing
    from law_rules import (
        get_applicable_sections,
        format_sections_for_draft,
        CaseAnalysis,
        ApplicableSection,
        Confidence
    )


@dataclass
class ValidationResult:
    """Result of validating a draft against law rules."""
    is_valid: bool
    draft: str  # Corrected draft
    original_draft: str  # Original AI draft
    sections_added: List[str]  # Sections that were added
    sections_removed: List[str]  # Wrong sections that were flagged
    sections_correct: List[str]  # Sections that were correct
    warnings: List[str]  # Warnings for lawyer
    flags_for_review: List[str]  # Items needing manual review
    confidence: Confidence


class SectionValidator:
    """Validates and corrects section citations in legal drafts."""

    # Patterns to detect section citations in text
    SECTION_PATTERNS = [
        # "Section 80 CPC", "Section 302 PPC"
        r"(?:section|sec\.?|s\.?)\s*(\d+[-A-Za-z]*)\s+(cpc|crpc|ppc|qso|mflo|constitution)",
        # "under Section 80 of CPC"
        r"(?:under|of)\s+(?:section|sec\.?)\s*(\d+[-A-Za-z]*)\s+(?:of\s+)?(?:the\s+)?(cpc|crpc|ppc|qso|mflo)",
        # "Article 199"
        r"article\s*(\d+)",
        # "u/s 302 PPC"
        r"u/s\s*(\d+[-A-Za-z]*)\s*(ppc|crpc|cpc)",
        # "Order XXXIX Rule 1"
        r"order\s+([IVXLC]+|\d+)\s+rule\s+(\d+)",
    ]

    # Common wrong section usage patterns
    WRONG_SECTION_RULES = {
        # Section 80 CPC should ONLY be for government
        ("CPC", "80"): {
            "rule": "government_only",
            "message": "Section 80 CPC applies ONLY to notices against Government entities"
        },
    }

    def __init__(self):
        pass

    def validate_draft(
            self,
            draft: str,
            category: str,
            facts: str,
            analysis: Optional[CaseAnalysis] = None
    ) -> ValidationResult:
        """
        Validate a draft against law rules.

        Args:
            draft: AI-generated draft text
            category: Document category
            facts: Original user facts
            analysis: Optional pre-computed analysis

        Returns:
            ValidationResult with corrected draft and warnings
        """
        # Get applicable sections from rules engine
        if analysis is None:
            analysis = get_applicable_sections(category, facts)

        result = ValidationResult(
            is_valid=True,
            draft=draft,
            original_draft=draft,
            sections_added=[],
            sections_removed=[],
            sections_correct=[],
            warnings=analysis.warnings.copy(),
            flags_for_review=analysis.flags_for_review.copy(),
            confidence=analysis.confidence
        )

        # Extract sections cited in draft
        cited_sections = self._extract_cited_sections(draft)

        # Get expected sections from analysis
        expected_sections = {
            (s.law_short.upper(), s.section_number.upper()): s
            for s in analysis.applicable_sections
        }

        # Check for wrong sections
        for law, section in cited_sections:
            key = (law.upper(), section.upper())

            # Check against wrong section rules
            if key in self.WRONG_SECTION_RULES:
                rule = self.WRONG_SECTION_RULES[key]
                if rule["rule"] == "government_only" and not analysis.is_government_involved:
                    result.sections_removed.append(f"{law} Section {section}")
                    result.warnings.append(f"⚠️ WRONG SECTION: {rule['message']}")
                    result.is_valid = False
                    # Flag for correction in draft
                    result.draft = self._flag_wrong_section(result.draft, law, section)

            # Check if section is expected
            if key in expected_sections:
                result.sections_correct.append(f"{law} Section {section}")
            elif key not in self.WRONG_SECTION_RULES:
                # Unknown section - flag for review
                result.flags_for_review.append(
                    f"Verify if {law} Section {section} is applicable to this case"
                )

        # Check for missing primary sections
        for key, section_info in expected_sections.items():
            if section_info.is_primary and section_info.confidence == Confidence.HIGH:
                law, section = key
                found = any(
                    c_law.upper() == law and c_sec.upper() == section
                    for c_law, c_sec in cited_sections
                )
                if not found:
                    result.sections_added.append(f"{law} Section {section}")
                    result.flags_for_review.append(
                        f"Consider adding {law} Section {section}: {section_info.reason}"
                    )

        return result

    def _extract_cited_sections(self, text: str) -> List[Tuple[str, str]]:
        """Extract all section citations from text."""
        citations = []
        text_lower = text.lower()

        # Pattern 1: Section X CPC/PPC/CrPC
        pattern1 = r"(?:section|sec\.?|s\.?)\s*(\d+[-A-Za-z]*)\s+(cpc|crpc|ppc|qso|mflo|c\.?p\.?c|cr\.?p\.?c|p\.?p\.?c)"
        for match in re.finditer(pattern1, text_lower, re.IGNORECASE):
            section = match.group(1).upper()
            law = self._normalize_law_name(match.group(2))
            citations.append((law, section))

        # Pattern 2: Article X (Constitution)
        pattern2 = r"article\s*(\d+)"
        for match in re.finditer(pattern2, text_lower, re.IGNORECASE):
            section = match.group(1)
            citations.append(("Constitution", section))

        # Pattern 3: u/s X PPC
        pattern3 = r"u/s\s*(\d+[-A-Za-z]*)\s*(ppc|crpc|cpc)"
        for match in re.finditer(pattern3, text_lower, re.IGNORECASE):
            section = match.group(1).upper()
            law = self._normalize_law_name(match.group(2))
            citations.append((law, section))

        # Pattern 4: Order X Rule Y (CPC)
        pattern4 = r"order\s+([ivxlc]+|\d+)\s+rule\s+(\d+)"
        for match in re.finditer(pattern4, text_lower, re.IGNORECASE):
            order = match.group(1).upper()
            rule = match.group(2)
            citations.append(("CPC", f"Order {order} Rule {rule}"))

        # Deduplicate
        return list(set(citations))

    def _normalize_law_name(self, law: str) -> str:
        """Normalize law abbreviations."""
        law_upper = law.upper().replace(".", "")
        mapping = {
            "CPC": "CPC",
            "CRPC": "CrPC",
            "PPC": "PPC",
            "QSO": "QSO",
            "MFLO": "MFLO",
        }
        return mapping.get(law_upper, law_upper)

    def _flag_wrong_section(self, draft: str, law: str, section: str) -> str:
        """Add warning flag to wrong section in draft."""
        # Find and flag the wrong section citation
        patterns = [
            (rf"((?:section|sec\.?)\s*{section}\s+{law})", r"[⚠️ WRONG: \1]"),
            (rf"((?:section|sec\.?)\s*{section}\s+of\s+(?:the\s+)?{law})", r"[⚠️ WRONG: \1]"),
            (rf"({law}\s+(?:section|sec\.?)\s*{section})", r"[⚠️ WRONG: \1]"),
        ]

        result = draft
        for pattern, replacement in patterns:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return result


# ═══════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def validate_legal_draft(draft: str, category: str, facts: str, analysis=None) -> ValidationResult:
    """
    Main entry point for draft validation.

    Usage:
        from services.section_validator import validate_legal_draft

        result = validate_legal_draft(
            draft="LEGAL NOTICE UNDER SECTION 80 C.P.C....",
            category="Legal Notice",
            facts="my client wants to send notice to neighbor"
        )

        if not result.is_valid:
            print("Draft has issues:")
            for warning in result.warnings:
                print(f"  {warning}")
    """
    validator = SectionValidator()
    return validator.validate_draft(draft, category, facts, analysis)

def get_sections_for_ai(category: str, facts: str) -> str:
    """
    Get formatted sections list to inject into AI prompt.
    This ensures AI only uses correct sections.

    Usage:
        sections_context = get_sections_for_ai("Legal Notice", facts)
        # Pass this to AI prompt instead of raw DB search
    """
    analysis = get_applicable_sections(category, facts)
    return format_sections_for_draft(analysis)


# ═══════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("SECTION VALIDATOR TEST")
    print("=" * 60)

    # Test 1: Wrong Section 80 usage
    print("\n" + "─" * 60)
    print("Test 1: Private notice with wrong Section 80")
    print("─" * 60)

    bad_draft = """
    LEGAL NOTICE UNDER SECTION 80 C.P.C.

    To: Ms. Summya

    Under Section 80 of the Code of Civil Procedure, I hereby serve notice...
    """

    result = validate_legal_draft(
        draft=bad_draft,
        category="Legal Notice",
        facts="my client farooq wants to send notice to summya for noise"
    )

    print(f"Is Valid: {result.is_valid}")
    print(f"Sections Removed: {result.sections_removed}")
    print(f"Warnings: {result.warnings}")
    print(f"\nCorrected Draft Preview:")
    print(result.draft[:300])

    # Test 2: Correct government notice
    print("\n" + "─" * 60)
    print("Test 2: Government notice with correct Section 80")
    print("─" * 60)

    good_draft = """
    LEGAL NOTICE UNDER SECTION 80 C.P.C.

    To: The Chief Executive, WAPDA

    Under Section 80 of the Code of Civil Procedure, I hereby serve notice...
    """

    result = validate_legal_draft(
        draft=good_draft,
        category="Legal Notice",
        facts="my client wants to send notice to WAPDA for overbilling"
    )

    print(f"Is Valid: {result.is_valid}")
    print(f"Sections Correct: {result.sections_correct}")
    print(f"Warnings: {result.warnings}")

    # Test 3: Bail petition
    print("\n" + "─" * 60)
    print("Test 3: Bail petition with Section 497")
    print("─" * 60)

    bail_draft = """
    BAIL PETITION UNDER SECTION 497 Cr.P.C.

    The petitioner is accused under Section 302 PPC...
    """

    result = validate_legal_draft(
        draft=bail_draft,
        category="Bail Petition (Post-Arrest)",
        facts="client arrested for murder under 302 PPC"
    )

    print(f"Is Valid: {result.is_valid}")
    print(f"Sections Correct: {result.sections_correct}")
    print(f"Missing Sections: {result.sections_added}")

    # Test 4: Get sections for AI prompt
    print("\n" + "─" * 60)
    print("Test 4: Sections for AI Prompt")
    print("─" * 60)

    sections = get_sections_for_ai(
        "Divorce Deed (Talaq-nama)",
        "wife wants khula, husband refuses, mehr is 500000"
    )
    print(sections)