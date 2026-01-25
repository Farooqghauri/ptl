# backend/services/summarizer_ai.py
# GENERALIZED VERSION - Works for ANY Pakistani court judgment

from __future__ import annotations

import json
import os
import re
import logging
from typing import Dict, List, Tuple, Optional

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import ValidationError

from schemas.judgment_summary import JudgmentSummary

# -----------------------------
# Setup
# -----------------------------

load_dotenv()

_API_KEY = os.getenv("OPENAI_API_KEY")
if not _API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing")

_CLIENT = OpenAI(api_key=_API_KEY)

_DEBUG = os.getenv("PTL_DEBUG_AI", "0") == "1"
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a legal document analyzer for Pakistani court judgments.

Return ONLY a valid JSON object with this exact structure:
{
  "case_title": "string",
  "court": "string",
  "decision_date": "DD.MM.YYYY or null",
  "bench": ["string"],
  "procedural_history": "string",
  "key_facts": "string",
  "issues": ["string"],
  "holding": {
    "outcome": "Allowed|Dismissed|Disposed|Partly allowed|Acquitted|Convicted|Not mentioned",
    "short_order": "string",
    "quoted_lines": ["string"]
  },
  "citations": ["string"],
  "takeaways": ["string"]
}

CRITICAL RULES FOR OUTCOME (MUST FOLLOW):
1) The FINAL disposition is usually near the END. Always prioritize the end portion of the text.
2) Distinguish between:
   - Interim orders (CMAs, applications, stay orders) vs 
   - FINAL outcome (appeals, petitions, reviews, references)
3) If multiple dates exist, use the LATEST date tied to the final order.
4) If split opinions exist (majority/minority/dissent/concurring), report MAJORITY outcome first, then note other opinions.
5) Key phrases for final outcome: "short order", "for reasons to be recorded", "allowed", "dismissed", 
   "set aside", "restored", "disposed of", "acquitted", "convicted", "sentence", "appeal", "petition".
6) Include ALL consequences in short_order:
   - Appeals/petitions dismissed or allowed
   - Lower court judgments set aside or restored
   - Directions to authorities (ECP, police, etc.)
   - Sentences modified, upheld, or set aside
7) If holding.outcome != "Not mentioned", quoted_lines MUST contain at least 1 exact quote.

CITATION RULES (MUST FOLLOW):
1) Extract ALL case-law citations: PLD, SCMR, PCr.LJ, CLC, MLD, YLR, PLJ, PSC, GBLR, KLR, etc.
2) Extract ALL Constitutional Articles mentioned (Article 4, 9, 10, 10A, 14, 17, 25, 184, 185, 187, 188, 199, etc.)
3) Extract ALL statutory references: 
   - Pakistan Penal Code (PPC) sections
   - Criminal Procedure Code (CrPC) sections  
   - Civil Procedure Code (CPC) sections
   - Qanun-e-Shahadat Order 1984
   - Any other Acts, Ordinances, Rules
4) NEVER write "None cited" if any legal references exist.

Rules:
- Return ONLY JSON, no extra text
- If information is missing, use "Not mentioned" for strings or [] for lists
- decision_date must be DD.MM.YYYY format or null
"""

# -----------------------------
# GENERALIZED Keywords (All Case Types)
# -----------------------------

_OUTCOME_KEYWORDS = [
    # Final order markers
    "short order",
    "for reasons to be recorded",
    "disposed of",
    "disposed",

    # Outcome words
    "allowed",
    "dismissed",
    "partly allowed",
    "partially allowed",
    "acquitted",
    "convicted",
    "set aside",
    "upheld",
    "maintained",
    "restored",
    "modified",
    "reduced",
    "enhanced",

    # Case type markers (generalized)
    "appeal",
    "petition",
    "review",
    "reference",
    "application",
    "suit",
    "complaint",

    # Split opinion markers
    "by majority",
    "majority of",
    "unanimous",
    "dissent",
    "dissenting",
    "concurring",
    "separate note",
    "separate opinion",
    "minority view",
    "whereas",
    "recused",
    "rider",

    # Consequence markers (generalized)
    "as a consequence",
    "consequently",
    "resultantly",
    "impugned",
    "judgment",
    "order",
    "decree",
    "sentence",
    "conviction",
    "acquittal",
    "high court",
    "trial court",
    "sessions court",
    "district court",
    "magistrate",

    # Criminal specific
    "bail",
    "remand",
    "death sentence",
    "life imprisonment",
    "rigorous imprisonment",
    "fine",
    "compensation",
]

_DATE_PATTERNS = [r"\b(\d{2})\.(\d{2})\.(\d{4})\b"]

# -----------------------------
# GENERALIZED Citation Patterns
# -----------------------------

_CASE_CITE_PATTERNS = [
    # Pakistan Law Digest
    r"\bPLD\s+\d{4}\s+[A-Z]{1,5}\s+\d+\b",
    # Supreme Court Monthly Review
    r"\b\d{4}\s+SCMR\s+\d+\b",
    # Pakistan Criminal Law Journal
    r"\b\d{4}\s+PCr\.?LJ\s+\d+\b",
    # Civil Law Cases
    r"\b\d{4}\s+CLC\s+\d+\b",
    # Monthly Law Digest
    r"\b\d{4}\s+MLD\s+\d+\b",
    # Yearly Law Reports
    r"\b\d{4}\s+YLR\s+\d+\b",
    # Pakistan Law Journal
    r"\b\d{4}\s+PLJ\s+\d+\b",
    r"\bPLJ\s+\d{4}\s+[A-Z]{1,5}\s+\d+\b",
    # Pakistan Supreme Court cases
    r"\b\d{4}\s+PSC\s+\d+\b",
    # Gilgit-Baltistan Law Reports
    r"\b\d{4}\s+GBLR\s+\d+\b",
    # Kashmir Law Reports
    r"\b\d{4}\s+KLR\s+\d+\b",
    # All Pakistan Legal Decisions
    r"\bAIR\s+\d{4}\s+[A-Z]{1,5}\s+\d+\b",
    # Numbered citations (2024 SC 123)
    r"\b\d{4}\s+SC\s+\d+\b",
]

_ARTICLE_PATTERN = r"\bArticle\s+\d+[A-Z]?(?:\(\d+\))?(?:\([a-z]\))?(?:\s*(?:&|and|,)\s*\d+[A-Z]?(?:\([^)]*\))?)*\b"

_SECTION_PATTERNS = [
    # PPC sections
    r"\b[Ss]ection\s+\d+[A-Za-z]?(?:/\d+)?(?:\s+PPC)?\b",
    r"\b[Ss]\.\s*\d+[A-Za-z]?\s+PPC\b",
    # CrPC sections
    r"\b[Ss]ection\s+\d+[A-Za-z]?(?:\(\d+\))?\s+Cr\.?P\.?C\.?\b",
    r"\b[Ss]\.\s*\d+\s+Cr\.?P\.?C\.?\b",
    # CPC sections
    r"\b[Ss]ection\s+\d+[A-Za-z]?\s+C\.?P\.?C\.?\b",
    r"\bOrder\s+[IVXLCDM]+\s+[Rr]ule\s+\d+\s+C\.?P\.?C\.?\b",
    # General section references
    r"\b[Ss]ection\s+\d+[A-Za-z]?(?:\(\d+\))?(?:\([a-z]\))?\b",
]

_RULE_PATTERN = r"\b[Rr]ule\s+\d+[A-Za-z]?(?:\(\d+\))?\b"
_ORDER_PATTERN = r"\bOrder\s+[IVXLCDM]+(?:\s+[Rr]ule\s+\d+)?\b"

_ACT_PATTERNS = [
    r"\b[A-Z][A-Za-z&,.\s()\-]{2,50}(?:Act|Ordinance|Order|Rules|Regulations),?\s*\d{4}\b",
    r"\bPakistan\s+Penal\s+Code\b",
    r"\bPPC\b",
    r"\bCr\.?P\.?C\.?\b",
    r"\bC\.?P\.?C\.?\b",
    r"\bQanun-e-Shahadat\b",
    r"\bControl\s+of\s+Narcotic\s+Substances\s+Act\b",
    r"\bCNSA\b",
    r"\bAnti-Terrorism\s+Act\b",
    r"\bATA\b",
    r"\bNational\s+Accountability\s+Ordinance\b",
    r"\bNAO\b",
    r"\bElection\s+Act\b",
    r"\bConstitution\s+of\s+(?:the\s+)?Islamic\s+Republic\s+of\s+Pakistan\b",
]


# -----------------------------
# Helper Functions
# -----------------------------

def _debug_write(path: str, content: str) -> None:
    if not _DEBUG:
        return
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass


def _pick_head_and_tail(text: str, head_chars: int, tail_chars: int) -> Tuple[str, str]:
    t = text or ""
    head = t[:head_chars]
    tail = t[-tail_chars:] if len(t) > tail_chars else t
    return head, tail


def _find_keyword_windows(text: str, keywords: List[str], window: int = 900, max_snippets: int = 12) -> List[str]:
    """Extract text windows around important keywords."""
    lower = (text or "").lower()
    snippets: List[str] = []
    seen = set()

    for kw in keywords:
        kw_l = kw.lower()
        start = 0
        while True:
            idx = lower.find(kw_l, start)
            if idx == -1:
                break
            lo = max(0, idx - window)
            hi = min(len(text), idx + len(kw) + window)
            snip = (text[lo:hi] or "").strip()
            key = snip[:200]
            if key and key not in seen:
                snippets.append(snip)
                seen.add(key)
            start = idx + max(1, len(kw_l))
            if len(snippets) >= max_snippets:
                return snippets
    return snippets


def _extract_dates_ddmmyyyy(text: str) -> List[str]:
    """Extract all DD.MM.YYYY dates from text."""
    dates: List[str] = []
    for pat in _DATE_PATTERNS:
        for m in re.finditer(pat, text or ""):
            dd, mm, yyyy = m.group(1), m.group(2), m.group(3)
            dates.append(f"{dd}.{mm}.{yyyy}")
    return dates


def _latest_date(dates: List[str]) -> Optional[str]:
    """Return the chronologically latest date."""

    def to_tuple(d: str) -> Tuple[int, int, int]:
        dd, mm, yyyy = d.split(".")
        return (int(yyyy), int(mm), int(dd))

    if not dates:
        return None
    return max(dates, key=to_tuple)


def _build_outcome_snapshot(tail_text: str) -> str:
    """Build a context snapshot focused on the document's end (where final orders usually are)."""
    tail_dates = _extract_dates_ddmmyyyy(tail_text)
    latest_tail_date = _latest_date(tail_dates)

    windows = _find_keyword_windows(tail_text, _OUTCOME_KEYWORDS, window=900)

    parts: List[str] = []
    parts.append("OUTCOME-SNAPSHOT (from end of document):")
    if latest_tail_date:
        parts.append(f"- Latest date near end: {latest_tail_date}")
    if tail_dates:
        uniq: List[str] = list(dict.fromkeys(tail_dates))[:8]
        parts.append(f"- Dates found near end: {', '.join(uniq)}")

    parts.append("- REMINDER: Interim applications (CMAs, stay orders) may be dismissed while main case is allowed.")
    parts.append("- If split opinions exist, report MAJORITY outcome and note dissent/partial views.")
    parts.append(
        "- Include ALL consequences: appeals dismissed/allowed, lower court orders set aside/restored, directions issued.")

    if windows:
        parts.append("\nKEY EXCERPTS (end-focused):")
        for i, w in enumerate(windows, 1):
            parts.append(f"[EXCERPT {i}]\n{w}")

    return "\n".join(parts).strip()


# -----------------------------
# Citation Extraction (Deterministic Fallback)
# -----------------------------

def _extract_legal_citations(text: str, limit: int = 50) -> List[str]:
    """
    Deterministically extract Pakistani legal citations.
    This ensures citations are never missed even if AI fails.
    """
    t = text or ""
    found: List[str] = []

    def add_matches(matches: List[str]) -> None:
        for m in matches:
            s = re.sub(r"\s+", " ", m.strip())
            if s and s not in found:
                found.append(s)
            if len(found) >= limit:
                return

    # Case law citations
    for pat in _CASE_CITE_PATTERNS:
        add_matches(re.findall(pat, t))

    # Constitutional articles
    add_matches(re.findall(_ARTICLE_PATTERN, t, flags=re.IGNORECASE))

    # Sections (PPC, CrPC, CPC, general)
    for pat in _SECTION_PATTERNS:
        add_matches(re.findall(pat, t))

    # Rules and Orders
    add_matches(re.findall(_RULE_PATTERN, t, flags=re.IGNORECASE))
    add_matches(re.findall(_ORDER_PATTERN, t))

    # Acts and Ordinances
    for pat in _ACT_PATTERNS:
        add_matches(re.findall(pat, t, flags=re.IGNORECASE))

    # Normalize
    normalized: List[str] = []
    for x in found:
        nx = x.strip()
        nx = re.sub(r"^article", "Article", nx, flags=re.IGNORECASE)
        nx = re.sub(r"^section", "Section", nx, flags=re.IGNORECASE)
        nx = re.sub(r"^rule", "Rule", nx, flags=re.IGNORECASE)
        if nx and nx not in normalized:
            normalized.append(nx)
        if len(normalized) >= limit:
            break

    return normalized


def _text_has_legal_refs(text: str) -> bool:
    """Check if text contains any legal references."""
    t = text or ""
    if any(re.search(p, t) for p in _CASE_CITE_PATTERNS):
        return True
    if re.search(_ARTICLE_PATTERN, t, flags=re.IGNORECASE):
        return True
    for pat in _SECTION_PATTERNS:
        if re.search(pat, t):
            return True
    for pat in _ACT_PATTERNS:
        if re.search(pat, t, flags=re.IGNORECASE):
            return True
    return False


# -----------------------------
# Guardrails (Generalized)
# -----------------------------

def _detect_outcome_contradiction(outcome: str, tail_lower: str) -> Optional[str]:
    """Detect if AI output contradicts clear signals in the document."""

    # Patterns for different case types
    allowed_signals = [
        "appeal is allowed",
        "appeals are allowed",
        "petition is allowed",
        "petitions are allowed",
        "review is allowed",
        "review petitions are allowed",
        "civil review petitions are allowed",
        "writ petition is allowed",
        "bail is granted",
        "bail granted",
        "accused is acquitted",
        "appellant is acquitted",
        "conviction is set aside",
        "sentence is set aside",
    ]

    dismissed_signals = [
        "appeal is dismissed",
        "appeals are dismissed",
        "petition is dismissed",
        "petitions are dismissed",
        "review is dismissed",
        "review petitions are dismissed",
        "writ petition is dismissed",
        "bail is refused",
        "bail refused",
        "bail is declined",
        "conviction is upheld",
        "conviction upheld",
        "sentence is maintained",
        "appeal fails",
    ]

    if outcome == "dismissed":
        for signal in allowed_signals:
            if signal in tail_lower:
                return f"Contradiction: Summary says Dismissed but document contains '{signal}'"

    if outcome == "allowed":
        for signal in dismissed_signals:
            if signal in tail_lower:
                return f"Contradiction: Summary says Allowed but document contains '{signal}'"

    return None


def _post_validate_guardrails(result: Dict[str, object], tail_text: str) -> Optional[Tuple[str, str]]:
    """
    Validate AI output against document content.
    Returns (severity, message) or None if valid.
    """
    holding = result.get("holding") or {}
    if not isinstance(holding, dict):
        return ("hard", "Invalid 'holding' structure.")

    outcome = (holding.get("outcome") or "").strip().lower()
    quoted_lines = holding.get("quoted_lines")

    tail_lower = (tail_text or "").lower()

    # HARD: outcome set => needs quotes
    if outcome and outcome != "not mentioned":
        if not isinstance(quoted_lines, list) or len(quoted_lines) < 1:
            return ("hard", "holding.outcome is set but quoted_lines is empty - must include exact quote.")

    # HARD: outcome contradiction
    contradiction = _detect_outcome_contradiction(outcome, tail_lower)
    if contradiction:
        return ("hard", contradiction)

    # SOFT: citations check
    citations = result.get("citations") or []
    if _text_has_legal_refs(tail_text):
        if not isinstance(citations, list) or len(citations) == 0:
            return ("soft", "Citations exist in document but output is empty.")
        if any(isinstance(x, str) and "none" in x.lower() for x in citations):
            return ("soft", "Output says 'None cited' but document has legal references.")

    return None


def _ensure_citations_fallback(result: Dict[str, object], full_text: str) -> None:
    """If AI missed citations, extract them deterministically."""
    citations = result.get("citations")

    # Replace if empty or contains "None"
    needs_replacement = (
            not isinstance(citations, list) or
            len(citations) == 0 or
            any(isinstance(x, str) and "none" in x.lower() for x in citations)
    )

    if needs_replacement and _text_has_legal_refs(full_text):
        result["citations"] = _extract_legal_citations(full_text)
    elif not isinstance(citations, list):
        result["citations"] = []


# -----------------------------
# Main Function
# -----------------------------

def summarize_judgment_to_json(judgment_text: str, retries: int = 2) -> Dict[str, object]:
    """
    Summarize any Pakistani court judgment to structured JSON.

    Works for:
    - Civil Appeals, Criminal Appeals
    - Writ Petitions, Constitutional Petitions
    - Civil/Criminal Review Petitions
    - Bail Applications
    - References
    - Any other case type

    Uses outcome-first approach:
    - Prioritizes document END for final order
    - Guardrails prevent common AI mistakes
    - Deterministic citation extraction as fallback
    """
    full_text = judgment_text or ""
    logger.info("Summarizer: processing %d chars, retries=%d", len(full_text), retries)

    # Include more TAIL than HEAD (final order is at end)
    head_chars = 9000
    tail_chars = 14000
    head_text, tail_text = _pick_head_and_tail(full_text, head_chars=head_chars, tail_chars=tail_chars)

    outcome_snapshot = _build_outcome_snapshot(tail_text=tail_text)

    user_payload = (
        "Summarize this Pakistani court judgment.\n\n"
        f"{outcome_snapshot}\n\n"
        "---- BEGIN HEAD (start of document) ----\n"
        f"{head_text}\n"
        "---- END HEAD ----\n\n"
        "---- BEGIN TAIL (end of document - HIGHEST PRIORITY for final outcome) ----\n"
        f"{tail_text}\n"
        "---- END TAIL ----\n"
    )

    _debug_write("debug_ai_payload.txt", user_payload)

    last_error = "Unknown error"

    for attempt in range(retries + 1):
        try:
            logger.info("Summarizer: attempt %d/%d", attempt + 1, retries + 1)

            extra = ""
            if attempt > 0:
                extra = (
                    "\n\nRETRY: Previous attempt had issues. Please:"
                    "\n1) Find the FINAL order (not interim applications)"
                    "\n2) Include ALL consequences in short_order"
                    "\n3) Extract ALL citations (case law + articles + sections)"
                    "\n4) Include at least one exact quote from final order"
                    "\n5) If split opinions exist, note majority AND minority views"
                )

            resp = _CLIENT.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.1,
                max_tokens=2600,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_payload + extra},
                ],
            )

            raw = (resp.choices[0].message.content or "").strip()
            _debug_write("debug_ai_response.json", raw)

            parsed = json.loads(raw)
            validated = JudgmentSummary.model_validate(parsed)
            result = validated.model_dump()

            # Run guardrails
            guard = _post_validate_guardrails(result=result, tail_text=tail_text)
            if guard:
                severity, msg = guard
                last_error = msg
                logger.warning("Guardrail (%s): %s", severity, msg)

                if severity == "hard" and attempt < retries:
                    continue

            # Always ensure citations (deterministic fallback)
            _ensure_citations_fallback(result=result, full_text=full_text)

            return result

        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = str(exc)
            logger.warning("Validation error: %s", last_error)

        except Exception as exc:
            last_error = str(exc)
            logger.exception("Unexpected error: %s", last_error)

    raise RuntimeError(f"Failed after {retries + 1} attempts: {last_error}")