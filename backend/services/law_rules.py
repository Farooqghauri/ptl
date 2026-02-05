"""
════════════════════════════════════════════════════════════════
FILE LOCATION: backend/services/law_rules.py
════════════════════════════════════════════════════════════════

LAW RULES ENGINE - Deterministic Pakistani Law Rules (NO AI)

This engine:
1) Detects whether government/public authority is involved
2) Returns applicable sections deterministically
3) Adds warnings/flags for lawyer review
"""

import re
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum


class Confidence(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNCERTAIN = "uncertain"


@dataclass
class ApplicableSection:
    law_name: str
    law_short: str
    section_number: str
    section_title: str
    confidence: Confidence
    reason: str
    is_primary: bool = True


@dataclass
class CaseAnalysis:
    case_type: str
    sub_type: Optional[str]
    applicable_sections: List[ApplicableSection] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    flags_for_review: List[str] = field(default_factory=list)
    detected_parties: Dict[str, str] = field(default_factory=dict)
    is_government_involved: bool = False
    confidence: Confidence = Confidence.HIGH


GOVERNMENT_KEYWORDS: Set[str] = {
    "government", "govt", "federal", "ministry", "minister",
    "president", "prime minister", "pm",
    "provincial", "chief minister", "cm", "governor",
    "secretary", "additional secretary", "joint secretary",
    "commissioner", "deputy commissioner", "dc",
    "assistant commissioner", "ac",
    "police", "ssp", "dsp", "dpo", "sho", "ig", "dig",
    "inspector general", "station house officer",
    "wapda", "sui gas", "sngpl", "ssgc", "ptcl",
    "pakistan railway", "railways", "pia", "pakistan international",
    "ogdcl", "pso", "pakistan state oil",
    "pda", "lda", "cda", "kda", "rda", "fda",
    "lahore development", "capital development", "karachi development", "rawalpindi development",
    "municipal", "corporation", "metropolitan",
    "city council", "union council", "town committee",
    "board of revenue", "bor",
    "nadra", "fbr", "secp", "nepra", "ogra", "pemra", "pta",
    "authority", "public authority",
    "university", "board of education", "bise", "higher education", "hec",
    "public hospital", "government hospital", "dho",
    "registrar", "court", "tribunal",
}


CRIMINAL_PATTERNS = {
    "nuisance": {
        "keywords": ["nuisance", "noise", "disturbance", "public nuisance", "loud music"],
        "sections": [("PPC", "268", "Public nuisance"), ("PPC", "290", "Punishment for public nuisance")],
    },
    "cheque_dishonour": {
        "keywords": ["cheque", "check", "dishonour", "dishonored", "bounced", "bounce"],
        "sections": [("PPC", "489-F", "Dishonestly issuing a cheque")],
    },
    "defamation": {
        "keywords": ["defamation", "defamed", "reputation", "slander", "libel"],
        "sections": [("PPC", "499", "Defamation"), ("PPC", "500", "Punishment for defamation")],
    },
    # keep expanding safely over time
}


class LawRulesEngine:
    def __init__(self):
        self.government_keywords = GOVERNMENT_KEYWORDS

    def analyze_case(self, category: str, facts: str) -> CaseAnalysis:
        facts_lower = (facts or "").lower()

        analysis = CaseAnalysis(case_type=category, sub_type=None)
        analysis.is_government_involved = self._detect_government(facts_lower)

        cat = (category or "").lower()

        if "notice" in cat:
            self._analyze_legal_notice(analysis, facts_lower)
        elif "writ" in cat:
            self._analyze_writ(analysis, facts_lower)
        elif "bail" in cat:
            self._analyze_bail(analysis, facts_lower, cat)
        elif "recovery" in cat:
            self._analyze_recovery(analysis, facts_lower)
        elif "divorce" in cat or "talaq" in cat or "khula" in cat:
            self._analyze_divorce(analysis, facts_lower)
        elif "custody" in cat or "hizanat" in cat:
            self._analyze_custody(analysis, facts_lower)
        elif "quashing" in cat or "fir" in cat:
            self._analyze_quashing_fir(analysis, facts_lower)
        elif "stay" in cat:
            self._analyze_stay(analysis, facts_lower)
        elif "cheque" in cat or "dishonour" in cat:
            self._add_sections_from_pattern(analysis, facts_lower, "cheque_dishonour", primary=True)
        else:
            self._analyze_general(analysis, facts_lower)

        return analysis

    def _detect_government(self, facts_lower: str) -> bool:
        for keyword in self.government_keywords:
            pattern = r"\b" + re.escape(keyword) + r"\b"
            if re.search(pattern, facts_lower):
                return True
        return False

    def _detect_criminal_offenses(self, facts_lower: str) -> List[Tuple[str, dict]]:
        detected = []
        for offense_type, config in CRIMINAL_PATTERNS.items():
            for kw in config["keywords"]:
                if kw in facts_lower:
                    detected.append((offense_type, config))
                    break
        return detected

    def _analyze_legal_notice(self, analysis: CaseAnalysis, facts_lower: str):
        # Govt notice: Section 80 CPC mandatory
        if analysis.is_government_involved:
            analysis.applicable_sections.append(
                ApplicableSection(
                    law_name="Code of Civil Procedure 1908",
                    law_short="CPC",
                    section_number="80",
                    section_title="Notice",
                    confidence=Confidence.HIGH,
                    reason="Notice to Government/Public Authority - Section 80 CPC mandatory",
                    is_primary=True,
                )
            )
            analysis.warnings.append("Two months' notice period required before filing suit against Government")
        else:
            analysis.flags_for_review.append(
                "PRIVATE PARTY dispute: Section 80 CPC does NOT apply. Do NOT cite CPC 80."
            )

        # Add supporting cause-of-action sections (e.g., nuisance)
        for offense_type, config in self._detect_criminal_offenses(facts_lower):
            for law_short, section, title in config["sections"]:
                analysis.applicable_sections.append(
                    ApplicableSection(
                        law_name=self._get_full_law_name(law_short),
                        law_short=law_short,
                        section_number=section,
                        section_title=title,
                        confidence=Confidence.MEDIUM,
                        reason=f"Possible cause of action: {offense_type.replace('_', ' ')}",
                        is_primary=False,
                    )
                )

    def _analyze_writ(self, analysis: CaseAnalysis, facts_lower: str):
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Constitution of Pakistan 1973",
                law_short="Constitution",
                section_number="199",
                section_title="Jurisdiction of High Court",
                confidence=Confidence.HIGH,
                reason="High Court writ jurisdiction",
                is_primary=True,
            )
        )
        analysis.sub_type = "general_writ"

    def _analyze_bail(self, analysis: CaseAnalysis, facts_lower: str, category_lower: str):
        # Distinguish pre-arrest vs post-arrest (anticipatory bail)
        if (
            "pre-arrest" in facts_lower
            or "pre arrest" in facts_lower
            or "anticipatory" in facts_lower
            or "pre-arrest" in category_lower
            or "pre arrest" in category_lower
            or "anticipatory" in category_lower
        ):
            analysis.applicable_sections.append(
                ApplicableSection(
                    law_name="Code of Criminal Procedure 1898",
                    law_short="CrPC",
                    section_number="498",
                    section_title="Power to direct admission to bail",
                    confidence=Confidence.HIGH,
                    reason="Pre-arrest/anticipatory bail",
                    is_primary=True,
                )
            )
        else:
            analysis.applicable_sections.append(
                ApplicableSection(
                    law_name="Code of Criminal Procedure 1898",
                    law_short="CrPC",
                    section_number="497",
                    section_title="When bail may be taken in case of non-bailable offence",
                    confidence=Confidence.HIGH,
                    reason="Post-arrest bail",
                    is_primary=True,
                )
            )
            analysis.applicable_sections.append(
                ApplicableSection(
                    law_name="Code of Criminal Procedure 1898",
                    law_short="CrPC",
                    section_number="498",
                    section_title="Power to direct admission to bail",
                    confidence=Confidence.MEDIUM,
                    reason="Supplementary bail discretion (post-arrest)",
                    is_primary=False,
                )
            )

    def _analyze_recovery(self, analysis: CaseAnalysis, facts_lower: str):
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Code of Civil Procedure 1908",
                law_short="CPC",
                section_number="9",
                section_title="Courts to try all civil suits unless barred",
                confidence=Confidence.MEDIUM,
                reason="Civil recovery jurisdiction",
                is_primary=True,
            )
        )

    def _analyze_divorce(self, analysis: CaseAnalysis, facts_lower: str):
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Muslim Family Laws Ordinance 1961",
                law_short="MFLO",
                section_number="7",
                section_title="Talaq",
                confidence=Confidence.MEDIUM,
                reason="Divorce/Talaq procedure",
                is_primary=True,
            )
        )

    def _analyze_custody(self, analysis: CaseAnalysis, facts_lower: str):
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Guardians and Wards Act 1890",
                law_short="GWA",
                section_number="7",
                section_title="Power of the court to make order as to guardianship",
                confidence=Confidence.MEDIUM,
                reason="Child custody petition",
                is_primary=True,
            )
        )
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Guardians and Wards Act 1890",
                law_short="GWA",
                section_number="17",
                section_title="Matters to be considered by the court in appointing guardian",
                confidence=Confidence.MEDIUM,
                reason="Custody factors and welfare assessment",
                is_primary=False,
            )
        )
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Guardians and Wards Act 1890",
                law_short="GWA",
                section_number="25",
                section_title="Title of guardian to custody of ward",
                confidence=Confidence.MEDIUM,
                reason="Custody enforcement",
                is_primary=False,
            )
        )

    def _analyze_quashing_fir(self, analysis: CaseAnalysis, facts_lower: str):
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Code of Criminal Procedure 1898",
                law_short="CrPC",
                section_number="561-A",
                section_title="Inherent powers of High Court",
                confidence=Confidence.MEDIUM,
                reason="Quashing FIR (inherent powers)",
                is_primary=True,
            )
        )
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Constitution of Pakistan 1973",
                law_short="Constitution",
                section_number="199",
                section_title="Jurisdiction of High Court",
                confidence=Confidence.MEDIUM,
                reason="Constitutional jurisdiction for quashing relief",
                is_primary=False,
            )
        )

    def _analyze_stay(self, analysis: CaseAnalysis, facts_lower: str):
        analysis.applicable_sections.append(
            ApplicableSection(
                law_name="Code of Civil Procedure 1908",
                law_short="CPC",
                section_number="151",
                section_title="Saving of inherent powers of Court",
                confidence=Confidence.MEDIUM,
                reason="Stay application",
                is_primary=True,
            )
        )

    def _add_sections_from_pattern(self, analysis: CaseAnalysis, facts_lower: str, key: str, primary: bool):
        config = CRIMINAL_PATTERNS.get(key)
        if not config:
            return
        for law_short, section, title in config["sections"]:
            analysis.applicable_sections.append(
                ApplicableSection(
                    law_name=self._get_full_law_name(law_short),
                    law_short=law_short,
                    section_number=section,
                    section_title=title,
                    confidence=Confidence.HIGH,
                    reason=f"Detected offense: {key.replace('_', ' ')}",
                    is_primary=primary,
                )
            )

    def _analyze_general(self, analysis: CaseAnalysis, facts_lower: str):
        offenses = self._detect_criminal_offenses(facts_lower)
        if not offenses:
            analysis.flags_for_review.append(
                "Could not automatically determine applicable sections. Manual review required."
            )
            analysis.confidence = Confidence.UNCERTAIN
            return

        for offense_type, config in offenses:
            for law_short, section, title in config["sections"]:
                analysis.applicable_sections.append(
                    ApplicableSection(
                        law_name=self._get_full_law_name(law_short),
                        law_short=law_short,
                        section_number=section,
                        section_title=title,
                        confidence=Confidence.MEDIUM,
                        reason=f"Detected from facts: {offense_type.replace('_', ' ')}",
                        is_primary=True,
                    )
                )

    def _get_full_law_name(self, short: str) -> str:
        mapping = {
            "PPC": "Pakistan Penal Code 1860",
            "CrPC": "Code of Criminal Procedure 1898",
            "CPC": "Code of Civil Procedure 1908",
            "Constitution": "Constitution of Pakistan 1973",
            "MFLO": "Muslim Family Laws Ordinance 1961",
            "GWA": "Guardians and Wards Act 1890",
        }
        return mapping.get(short, short)


def get_applicable_sections(category: str, facts: str) -> CaseAnalysis:
    return LawRulesEngine().analyze_case(category, facts)


def format_sections_for_draft(analysis: CaseAnalysis) -> str:
    if not analysis.applicable_sections:
        return "[NO SPECIFIC SECTIONS DETERMINED - Draft without section citations]"

    lines = ["APPLICABLE LAW SECTIONS (Use ONLY these):"]
    primary = [s for s in analysis.applicable_sections if s.is_primary]
    secondary = [s for s in analysis.applicable_sections if not s.is_primary]

    if primary:
        lines.append("\nPRIMARY SECTIONS:")
        for s in primary:
            mark = "✓" if s.confidence == Confidence.HIGH else "?"
            lines.append(f"  {mark} {s.law_short} Section {s.section_number}: {s.section_title}")
            lines.append(f"      Reason: {s.reason}")

    if secondary:
        lines.append("\nSUPPORTING SECTIONS:")
        for s in secondary:
            mark = "✓" if s.confidence == Confidence.HIGH else "?"
            lines.append(f"  {mark} {s.law_short} Section {s.section_number}: {s.section_title}")

    if analysis.warnings:
        lines.append("\nWARNINGS:")
        lines.extend([f"  ⚠️ {w}" for w in analysis.warnings])

    if analysis.flags_for_review:
        lines.append("\nFLAGS FOR LAWYER REVIEW:")
        lines.extend([f"  🔍 {f}" for f in analysis.flags_for_review])

    return "\n".join(lines)
