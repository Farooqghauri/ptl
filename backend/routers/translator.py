import os
import io
import pdfplumber
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()


def extract_text_from_pdf(file_bytes):
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error extracting text: {e}")
    return text


def split_text_into_chunks(text: str, max_chars: int = 800):
    """
    Split text into roughly max_chars chunks, preserving paragraph boundaries.
    """
    if not text:
        return []
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current = ""
    for p in paragraphs:
        candidate = (current + "\n\n" + p).strip() if current else p
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current)
            if len(p) <= max_chars:
                current = p
            else:
                # Hard-split long paragraph
                for i in range(0, len(p), max_chars):
                    chunks.append(p[i:i + max_chars])
                current = ""
    if current:
        chunks.append(current)
    return chunks


# --- 1. Text Translation ---
class TranslationRequest(BaseModel):
    text: str
    direction: str


@router.post("/api/translate")
async def translate_text(request: TranslationRequest):
    if request.direction == "en_to_ur":
        system_prompt = """You are an expert Pakistani Legal Translator. Translate English to Legal Urdu.

    CRITICAL RULES:
    1. Output ONLY Urdu script - NO English, NO Vietnamese, NO other languages
    1.5. Translate ALL content fully. Do NOT summarize, shorten, or omit any text.
    1.6. Preserve line breaks and paragraph structure.
    2. Use Pakistani legal terminology:
       - Jurisdiction = دائرہ اختیار
       - Petitioner = درخواست گزار
       - Respondent = مدعا علیہ
       - Plaintiff = مدعی
       - Defendant = مدعا علیہ
       - Bail = ضمانت
       - Appeal = اپیل
       - Review = نظرثانی
       - Constitution = آئین
       - Amendment = ترمیم
       - Bench = بینچ
       - Judge = جج
       - Court = عدالت
       - Supreme Court = سپریم کورٹ
       - High Court = ہائی کورٹ
       - Sessions Court = سیشن کورٹ
       - Family Court = فیملی کورٹ
       - Evidence = ثبوت / شہادت
       - Witness = گواہ
       - FIR = ایف آئی آر / اطلاع اول
       - Accused = ملزم
       - Complainant = شکایت کنندہ
       - Order = حکم
       - Judgment = فیصلہ
       - Section = دفعہ
       - Article = آرٹیکل
       - Act = ایکٹ / قانون
       - Case = مقدمہ

    3. Keep proper nouns in Urdu transliteration (e.g., Pakistan = پاکستان)
    4. Maintain legal document formatting
    5. NEVER output any non-Urdu characters except numbers"""
    else:
        system_prompt = """You are an expert Pakistani Legal Translator. Translate Urdu to English.

    RULES:
    1. Use proper English legal terminology
    1.5. Translate ALL content fully. Do NOT summarize, shorten, or omit any text.
    1.6. Preserve line breaks and paragraph structure.
    2. Maintain formal legal tone
    3. Keep formatting intact
    4. Translate all Urdu text accurately"""

    try:
        chunks = split_text_into_chunks(request.text, max_chars=800)
        translated_chunks = []
        for chunk in chunks:
            translated = ""
            for attempt in range(2):
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Translate fully without omitting any content. Do NOT summarize. Preserve all details and formatting:\n\n{chunk}"}
                    ],
                    temperature=0.3,
                )
                translated = completion.choices[0].message.content or ""
                # Retry if translation is suspiciously short
                if len(translated.strip()) >= max(200, int(len(chunk) * 0.7)):
                    break
            translated_chunks.append(translated)
        return {"translation": "\n\n".join(translated_chunks).strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- 2. Document Translation ---
@router.post("/api/translate-document")
async def translate_document(
        file: UploadFile = File(...),
        direction: str = Form(...)
):
    content = await file.read()

    if file.content_type == "application/pdf":
        doc_text = extract_text_from_pdf(content)
    else:
        try:
            doc_text = content.decode("utf-8", errors="ignore")
        except:
            doc_text = "Error reading document text."

    if not doc_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text.")

    if direction == "en_to_ur":
        system_prompt = """You are an expert Pakistani Legal Translator. Translate English to Legal Urdu.

    CRITICAL RULES:
    1. Output ONLY Urdu script - NO English, NO Vietnamese, NO other languages
    1.5. Translate ALL content fully. Do NOT summarize, shorten, or omit any text.
    1.6. Preserve line breaks and paragraph structure.
    2. Use Pakistani legal terminology:
       - Jurisdiction = دائرہ اختیار
       - Petitioner = درخواست گزار
       - Respondent = مدعا علیہ
       - Plaintiff = مدعی
       - Defendant = مدعا علیہ
       - Bail = ضمانت
       - Appeal = اپیل
       - Review = نظرثانی
       - Constitution = آئین
       - Amendment = ترمیم
       - Bench = بینچ
       - Judge = جج
       - Court = عدالت
       - Supreme Court = سپریم کورٹ
       - High Court = ہائی کورٹ
       - Sessions Court = سیشن کورٹ
       - Family Court = فیملی کورٹ
       - Evidence = ثبوت / شہادت
       - Witness = گواہ
       - FIR = ایف آئی آر / اطلاع اول
       - Accused = ملزم
       - Complainant = شکایت کنندہ
       - Order = حکم
       - Judgment = فیصلہ
       - Section = دفعہ
       - Article = آرٹیکل
       - Act = ایکٹ / قانون
       - Case = مقدمہ

    3. Keep proper nouns in Urdu transliteration (e.g., Pakistan = پاکستان)
    4. Maintain legal document formatting
    5. NEVER output any non-Urdu characters except numbers"""
    else:
        system_prompt = """You are an expert Pakistani Legal Translator. Translate Urdu to English.

    RULES:
    1. Use proper English legal terminology
    1.5. Translate ALL content fully. Do NOT summarize, shorten, or omit any text.
    1.6. Preserve line breaks and paragraph structure.
    2. Maintain formal legal tone
    3. Keep formatting intact
    4. Translate all Urdu text accurately"""

    try:
        chunks = split_text_into_chunks(doc_text, max_chars=800)
        translated_chunks = []
        for chunk in chunks:
            translated = ""
            for attempt in range(2):
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Translate fully without omitting any content. Do NOT summarize. Preserve all details and formatting:\n\n{chunk}"}
                    ],
                    temperature=0.3,
                )
                translated = completion.choices[0].message.content or ""
                if len(translated.strip()) >= max(200, int(len(chunk) * 0.7)):
                    break
            translated_chunks.append(translated)
        return {
            "original_text": doc_text,
            "translation": "\n\n".join(translated_chunks).strip()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
