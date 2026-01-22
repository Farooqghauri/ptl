import os
import io
import pdfplumber
import docx
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
from dotenv import load_dotenv

# Setup
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file."""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from Word document."""
    text = ""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            if para.text.strip():
                text += para.text + "\n"
    except Exception as e:
        print(f"DOCX extraction error: {e}")
    return text.strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from plain text file."""
    try:
        return file_bytes.decode("utf-8").strip()
    except Exception as e:
        print(f"TXT extraction error: {e}")
        return ""


def get_file_text(file_bytes: bytes, content_type: str, filename: str) -> str:
    """Extract text based on file type."""
    if content_type == "application/pdf" or filename.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif content_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ] or filename.endswith((".docx", ".doc")):
        return extract_text_from_docx(file_bytes)
    elif content_type == "text/plain" or filename.endswith(".txt"):
        return extract_text_from_txt(file_bytes)
    else:
        return ""


SYSTEM_PROMPT = """
You are a Senior Legal Research Assistant specializing in Pakistani case law with 20+ years of experience.

Your task is to analyze court judgments and provide COMPREHENSIVE, DETAILED summaries that capture ALL important information.

Format your response EXACTLY as follows:

## 1. Case Title & Citation
- Full case name (Petitioner vs Respondent)
- Case number and year
- Court name (Supreme Court/High Court/Sessions Court)
- Bench composition (names of judges)
- Decision date

## 2. Procedural History
- Original complaint/FIR details (number, date, police station)
- Trial court decision, date, and sentences imposed
- High Court decision and date (if applicable)
- Current appeal/petition stage and outcome

## 3. Key Facts (Detailed)
- All parties involved with full names and relationships
- Complete date, time, and location of incident
- Detailed chronology of events
- How the matter came to police attention
- FIR registration details and sections applied
- Investigation process and timeline
- Evidence collected (physical, forensic, documentary)
- Arrests made and when

## 4. Legal Issues Framed
- List EACH legal question the court considered
- Relevant statutory provisions (PPC, CrPC, Qanun-e-Shahadat, etc.)
- Constitutional issues if any

## 5. Arguments Presented
**Prosecution/Petitioner:**
- Main arguments with supporting points

**Defense/Respondent:**
- Main arguments with supporting points

## 6. Evidence Analysis
- Witness testimonies summarized
- Documentary evidence
- Forensic/Medical evidence
- Recovery evidence
- Confessions (if any) and their validity

## 7. Court's Decision (Held)
- Final verdict clearly stated
- Conviction/Acquittal details
- Sentences imposed or set aside (imprisonment, fine, compensation)
- Any specific directions or orders

## 8. Legal Reasoning & Principles
- Key legal principles applied
- Precedents cited by the court
- Court's reasoning for the decision
- Important observations and obiter dicta

## 9. Sections & Laws Referenced
- All PPC sections mentioned
- All CrPC sections mentioned
- Qanun-e-Shahadat provisions
- Any other statutes
- Previous case citations (PLJ, PLD, SCMR, etc.)

## 10. Key Takeaways for Lawyers
- Practical implications of this judgment
- Points useful for similar cases
- Any new legal interpretation established

IMPORTANT INSTRUCTIONS:
- Be THOROUGH - do not skip any material facts
- Include ALL names, dates, and numbers mentioned
- Quote important observations from the judgment
- If information for any section is not available, write "Not mentioned in judgment"
- Use simple English that Urdu-speaking lawyers can understand
- Maintain accuracy - do not add information not present in the judgment
"""


@router.post("/api/summarize")
async def summarize_case(file: UploadFile = File(...)):
    """Summarize a legal case document."""

    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain"
    ]

    filename = file.filename or ""
    allowed_extensions = (".pdf", ".docx", ".doc", ".txt")

    if file.content_type not in allowed_types and not filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload PDF, Word (.docx, .doc), or Text (.txt) file."
        )

    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    # Extract text
    case_text = get_file_text(content, file.content_type or "", filename)

    if not case_text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from file. Please ensure the file is not corrupted or password-protected."
        )

    # Prepare text for API (GPT-4o-mini has 128k context, but we limit for cost)
    max_chars = 80000
    text_to_analyze = case_text[:max_chars]

    if len(case_text) > max_chars:
        text_to_analyze += "\n\n[Document truncated due to length. Above is the first portion.]"

    # Call OpenAI API
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",
                 "content": f"Analyze this Pakistani court judgment completely and provide a detailed summary:\n\n{text_to_analyze}"}
            ],
            temperature=0.2,
            max_tokens=4000,
        )

        summary = completion.choices[0].message.content

        if not summary:
            raise HTTPException(status_code=500, detail="AI returned empty response.")

        return {"summary": summary}

    except Exception as e:
        error_msg = str(e)
        if "api_key" in error_msg.lower():
            raise HTTPException(status_code=500, detail="OpenAI API key error. Please check configuration.")
        elif "rate_limit" in error_msg.lower():
            raise HTTPException(status_code=429, detail="Too many requests. Please try again in a moment.")
        else:
            raise HTTPException(status_code=500, detail=f"AI processing error: {error_msg}")


