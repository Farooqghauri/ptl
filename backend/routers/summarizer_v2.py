# backend/routers/summarizer_v2.py

from __future__ import annotations

import re
import time
import logging
from typing import Dict, List, Tuple

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from services.text_extractor import extract_text
from services.summarizer_ai import summarize_judgment_to_json

router = APIRouter(tags=["summarizer_v2"])
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}

ALLOWED_EXTENSIONS = (".pdf", ".docx", ".doc", ".txt")

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB

# -----------------------------
# TEXT TRUNCATION LIMITS
# -----------------------------
MAX_TEXT_CHARS = 50000  # Maximum characters to send to AI
HEAD_CHARS = 18000  # From start (metadata, parties, background)
TAIL_CHARS = 28000  # From end (holding, outcome, final order)
CITATION_BUDGET = 4000  # Reserved for extracted citations from middle

# -----------------------------
# CITATION EXTRACTION PATTERNS
# -----------------------------
CITATION_PATTERNS = [
    # Case law citations
    r"PLD\s+\d{4}\s+[A-Z]{1,5}\s+\d+",
    r"\d{4}\s+SCMR\s+\d+",
    r"\d{4}\s+PCr\.?LJ\s+\d+",
    r"\d{4}\s+CLC\s+\d+",
    r"\d{4}\s+MLD\s+\d+",
    r"\d{4}\s+YLR\s+\d+",
    r"\d{4}\s+PLJ\s+\d+",
    r"PLJ\s+\d{4}\s+[A-Z]{1,5}\s+\d+",
    # Constitutional articles
    r"Article\s+\d+[A-Z]?(?:\(\d+\))?(?:\([a-z]\))?",
    # Sections
    r"[Ss]ection\s+\d+[A-Za-z]?(?:\(\d+\))?(?:\s+(?:PPC|Cr\.?P\.?C\.?|C\.?P\.?C\.?))?",
    # Rules and Orders
    r"[Rr]ule\s+\d+[A-Za-z]?(?:\(\d+\))?",
    r"Order\s+[IVXLCDM]+(?:\s+[Rr]ule\s+\d+)?",
]

DATE_PATTERNS = [
    r"\b\d{1,2}[./\-]\d{1,2}[./\-]\d{4}\b",  # DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY
    r"\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b",
]


def _extract_citations_from_middle(middle_text: str) -> str:
    """
    Extract all citations and legal references from the middle section.
    Returns them as a condensed string to preserve in context.
    """
    if not middle_text:
        return ""

    found_citations = set()

    for pattern in CITATION_PATTERNS:
        matches = re.findall(pattern, middle_text, re.IGNORECASE)
        for match in matches:
            # Normalize whitespace
            clean = re.sub(r"\s+", " ", match.strip())
            found_citations.add(clean)

    if not found_citations:
        return ""

    # Format as a block to insert
    citations_list = sorted(found_citations)
    citations_block = "\n\n[CITATIONS EXTRACTED FROM MIDDLE SECTION]\n"
    citations_block += "\n".join(f"- {c}" for c in citations_list[:50])  # Limit to 50
    citations_block += "\n[END CITATIONS]\n\n"

    return citations_block


def _extract_key_dates_from_middle(middle_text: str) -> str:
    """
    Extract important dates from middle section.
    """
    if not middle_text:
        return ""

    found_dates = set()

    for pattern in DATE_PATTERNS:
        matches = re.findall(pattern, middle_text, re.IGNORECASE)
        for match in matches:
            found_dates.add(match.strip())

    if not found_dates:
        return ""

    # Only include if we have meaningful dates (not too many)
    if len(found_dates) > 20:
        return ""  # Too many dates, probably noise

    dates_block = "\n[KEY DATES FROM MIDDLE SECTION]\n"
    dates_block += ", ".join(sorted(found_dates)[:15])
    dates_block += "\n[END DATES]\n\n"

    return dates_block


def _smart_truncate_text(text: str) -> Tuple[str, bool, Dict]:
    """
    Smart truncation that preserves:
    - Head: Case metadata, parties, procedural history
    - Tail: Final order, holding, outcome
    - Citations: Extracted from middle section

    Returns:
        tuple: (truncated_text, was_truncated, truncation_info)
    """
    if not text or len(text) <= MAX_TEXT_CHARS:
        return text, False, {"method": "none"}

    original_len = len(text)

    # Extract head and tail
    head = text[:HEAD_CHARS]
    tail = text[-TAIL_CHARS:]

    # Get middle section
    middle_start = HEAD_CHARS
    middle_end = len(text) - TAIL_CHARS
    middle = text[middle_start:middle_end] if middle_end > middle_start else ""

    # Extract citations and dates from middle (what would be lost)
    citations_block = _extract_citations_from_middle(middle)
    dates_block = _extract_key_dates_from_middle(middle)

    # Build truncated text
    truncated = head

    if citations_block or dates_block:
        truncated += "\n\n[... MIDDLE SECTION SUMMARIZED ...]\n"
        if citations_block:
            truncated += citations_block
        if dates_block:
            truncated += dates_block
    else:
        truncated += "\n\n[... DOCUMENT TRUNCATED - MIDDLE SECTION OMITTED ...]\n\n"

    truncated += tail

    # Ensure we're within limits
    if len(truncated) > MAX_TEXT_CHARS + 2000:  # Allow small overflow for citations
        # Need to trim more aggressively
        truncated = text[:HEAD_CHARS] + "\n\n[...TRUNCATED...]\n\n" + text[-TAIL_CHARS:]

    truncation_info = {
        "method": "smart",
        "original_chars": original_len,
        "head_chars": HEAD_CHARS,
        "tail_chars": TAIL_CHARS,
        "middle_chars_lost": len(middle),
        "citations_preserved": len(citations_block) > 0,
        "dates_preserved": len(dates_block) > 0,
    }

    logger.info(f"Smart truncation: {original_len} -> {len(truncated)} chars, "
                f"citations_preserved={truncation_info['citations_preserved']}")

    return truncated, True, truncation_info


def error_response(
        status_code: int,
        error_code: str,
        message: str,
        details: Dict[str, object] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error_code": error_code,
            "message": message,
            "details": details or {},
        },
    )


@router.post("/api/summarize-v2")
async def summarize_v2(file: UploadFile = File(...)):
    start = time.perf_counter()

    # 1) Basic file checks
    filename = file.filename or ""
    content_type = file.content_type or ""

    if not filename.lower().endswith(ALLOWED_EXTENSIONS):
        return error_response(
            status_code=400,
            error_code="UNSUPPORTED_FORMAT",
            message="Unsupported file extension",
            details={"allowed_extensions": list(ALLOWED_EXTENSIONS), "file_name": filename},
        )

    if content_type not in ALLOWED_CONTENT_TYPES:
        return error_response(
            status_code=400,
            error_code="UNSUPPORTED_FORMAT",
            message="Unsupported content type",
            details={"allowed_content_types": sorted(list(ALLOWED_CONTENT_TYPES)), "content_type": content_type},
        )

    # 2) Read bytes (and size limit)
    data = await file.read()
    file_size = len(data)

    if file_size > MAX_FILE_SIZE_BYTES:
        return error_response(
            status_code=413,
            error_code="FILE_TOO_LARGE",
            message="File too large (max 15MB)",
            details={"size_bytes": file_size, "limit_bytes": MAX_FILE_SIZE_BYTES},
        )

    # 3) Extract text
    try:
        text = extract_text(
            file_bytes=data,
            content_type=content_type,
            filename=filename,
        )
    except Exception as exc:
        logger.exception(f"Text extraction failed: {exc}")
        return error_response(
            status_code=500,
            error_code="EXTRACTION_FAILED",
            message="Failed to extract text from file",
            details={"reason": str(exc)},
        )

    if not (text or "").strip():
        return error_response(
            status_code=400,
            error_code="NO_TEXT_EXTRACTED",
            message="No readable text extracted",
            details={"file_name": filename, "content_type": content_type},
        )

    # 4) Smart truncate for large files (preserves citations)
    original_chars = len(text)
    text_for_ai, was_truncated, truncation_info = _smart_truncate_text(text)

    if was_truncated:
        logger.info(f"Large file: {filename} ({original_chars} chars), truncation_info={truncation_info}")

    # 5) AI summarize to schema-validated JSON
    try:
        summary = summarize_judgment_to_json(judgment_text=text_for_ai, retries=2)
    except Exception as exc:
        logger.exception(f"AI summarization failed: {exc}")
        return error_response(
            status_code=500,
            error_code="AI_FAILED",
            message="Summarization failed",
            details={"reason": str(exc)},
        )

    processing_ms = int((time.perf_counter() - start) * 1000)

    # 6) Response
    return {
        "success": True,
        "summary": summary,
        "meta": {
            "file_name": filename,
            "content_type": content_type,
            "file_size_bytes": file_size,
            "extracted_chars": original_chars,
            "processed_chars": len(text_for_ai),
            "was_truncated": was_truncated,
            "truncation_info": truncation_info if was_truncated else None,
            "processing_time_ms": processing_ms,
        },
    }