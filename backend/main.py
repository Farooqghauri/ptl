import os
import fitz # PyMuPDF
import pdfplumber
import pytesseract
from docx import Document
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# Note: PDF-related imports (reportlab, bidi, arabic_reshaper) are removed.


# --- Configuration ---
app = FastAPI()
# UPLOAD_FOLDER is still needed for temporary file storage during extraction
UPLOAD_FOLDER = "backend/UPLOAD_FOLDER"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# 💡 CORS Configuration FIX 💡
# Since the frontend can run on localhost or a dynamic URL (like Vercel preview or Canvas),
# we must allow that specific origin, or use a wildcard for development.
# IMPORTANT: For local testing where the client URL is dynamic, use ["*"].
# In production, replace "*" with your live domain (e.g., "https://www.pakistantoplawyers.com").

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*", # <-- THIS IS THE CRITICAL CHANGE to solve the CORS error during development/testing
]

app.add_middleware(
    CORSMiddleware,
    # When using the wildcard "*", FastAPI simplifies the header handling
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
# --- 1. Text Extraction Endpoint ---
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extracts text from PDF, DOCX, or TXT files using pdfplumber, PyMuPDF+Tesseract, 
    or python-docx, and returns the raw text.
    """
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    
    # Save the uploaded file temporarily
    file_bytes = await file.read()
    with open(filename, "wb") as f:
        f.write(file_bytes)

    text = ""
    file_ext = os.path.splitext(filename)[1].lower()

    if file_ext == ".pdf":
        try:
            # Try structured text extraction (pdfplumber)
            with pdfplumber.open(filename) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or "" + "\n"
        except Exception:
            # Fallback to OCR for scanned/complex PDFs (PyMuPDF + Tesseract)
            try:
                doc = fitz.open(filename)
                for page in doc:
                    # Render page as pixmap/image
                    pix = page.get_pixmap(dpi=300)
                    # Convert to bytes for tesseract
                    img_bytes = pix.tobytes("ppm")
                    text += pytesseract.image_to_string(
                        img_bytes, 
                        lang="eng+urd" 
                    ) + "\n"
            except Exception as e:
                os.remove(filename) 
                raise HTTPException(status_code=500, detail=f"PDF/OCR processing failed: {e}")

    elif file_ext == ".docx":
        try:
            doc = Document(filename)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            os.remove(filename) 
            raise HTTPException(status_code=500, detail=f"DOCX processing failed: {e}")
            
    elif file_ext == ".txt":
        # Decode the file bytes directly for TXT files
        text = file_bytes.decode('utf-8')
    
    else:
        os.remove(filename)
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")

    os.remove(filename) # Clean up the temporary upload
    return {"text": text}