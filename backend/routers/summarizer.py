import os
import io
import pdfplumber
from fastapi import APIRouter, UploadFile, File, HTTPException
from groq import Groq
from dotenv import load_dotenv

# Setup
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

@router.post("/api/summarize")
async def summarize_case(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    content = await file.read()
    case_text = extract_text_from_pdf(content)

    if not case_text.strip():
        raise HTTPException(status_code=400, detail="Could not read text.")

    try:
        text_to_analyze = case_text[:60000]
        system_instruction = """
        You are a Senior Legal Research Assistant.
        Format your response strictly as:
        ## 1. Case Title & Citation
        ## 2. Key Facts
        ## 3. Legal Issues
        ## 4. Court's Decision (Held)
        ## 5. Key Legal Principle
        """
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Analyze this:\n\n{text_to_analyze}"}
            ],
            temperature=0.3,
        )
        return {"summary": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")