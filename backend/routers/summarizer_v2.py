# backend/routers/summarizer_v2.py

from __future__ import annotations

import time
from typing import Dict

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from services.text_extractor import extract_text
from services.summarizer_ai import summarize_judgment_to_json


router = APIRouter(tags=["summarizer_v2"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}

ALLOWED_EXTENSIONS = (".pdf",".docx",".doc",".txt")

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB


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
            details={"allowed_extensions": list(ALLOWED_EXTENSIONS),"file_name": filename},
        )

    if content_type not in ALLOWED_CONTENT_TYPES:
        return error_response(
            status_code=400,
            error_code="UNSUPPORTED_FORMAT",
            message="Unsupported content type",
            details={"allowed_content_types": sorted(list(ALLOWED_CONTENT_TYPES)),"content_type": content_type},
        )

    # 2) Read bytes (and size limit)
    data = await file.read()
    file_size = len(data)

    if file_size > MAX_FILE_SIZE_BYTES:
        return error_response(
            status_code=413,
            error_code="FILE_TOO_LARGE",
            message="File too large (max 15MB)",
            details={"size_bytes": file_size,"limit_bytes": MAX_FILE_SIZE_BYTES},
        )

    # 3) Extract text
    try:
        text = extract_text(
            file_bytes=data,
            content_type=content_type,
            filename=filename,
        )
    except Exception as exc:
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
            details={"file_name": filename,"content_type": content_type},
        )

    # 4) AI summarize to schema-validated JSON
    try:
        summary = summarize_judgment_to_json(judgment_text=text, retries=2)
    except Exception as exc:
        return error_response(
            status_code=500,
            error_code="AI_FAILED",
            message="Summarization failed",
            details={"reason": str(exc)},
        )

    processing_ms = int((time.perf_counter() - start) * 1000)

    # 5) Response
    return {
        "success": True,
        "summary": summary,
        "meta": {
            "file_name": filename,
            "content_type": content_type,
            "file_size_bytes": file_size,
            "extracted_chars": len(text),
            "processing_time_ms": processing_ms,
        },
    }
