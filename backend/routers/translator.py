import os
import io
import pdfplumber
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    2. Maintain formal legal tone
    3. Keep formatting intact
    4. Translate all Urdu text accurately"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.text}
            ],
            temperature=0.3,
        )
        return {"translation": completion.choices[0].message.content}
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
    2. Maintain formal legal tone
    3. Keep formatting intact
    4. Translate all Urdu text accurately"""

    try:
        text_to_translate = doc_text[:30000]
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Translate this:\n\n{text_to_translate}"}
            ],
            temperature=0.3,
        )
        return {
            "original_text": doc_text,
            "translation": completion.choices[0].message.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))