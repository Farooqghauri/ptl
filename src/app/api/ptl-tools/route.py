import os
import pdfplumber
from docx import Document
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from mangum import Mangum
from typing import Annotated

app = FastAPI(title="PTL Tools API", version="1.0.0")

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/extract-text")
async def extract_text(file: Annotated[UploadFile, File(...)]):
    """Extract text from PDF/DOCX/TXT - OCR handled by AI"""
    filename = os.path.join(UPLOAD_DIR, file.filename.replace("/", "_"))
    content = await file.read()

    try:
        with open(filename, "wb") as f:
            f.write(content)

        ext = os.path.splitext(filename)[1].lower()

        # PDF Extraction
        if ext == ".pdf":
            text = ""
            try:
                with pdfplumber.open(filename) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except:
                pass

            if not text.strip():
                return JSONResponse(
                    {
                        "ocr_required": True,
                        "message": "PDF has no extractable text. OCR required."
                    },
                    status_code=200
                )

        # DOCX Extraction
        elif ext == ".docx":
            doc = Document(filename)
            text = "\n".join(p.text for p in doc.paragraphs)

        # TXT Extraction
        elif ext == ".txt":
            text = content.decode("utf-8", errors="ignore")

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        return JSONResponse({"text": text}, status_code=200)

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if os.path.exists(filename):
            os.remove(filename)

handler = Mangum(app)

async def POST(request):
    return await handler(request)

async def GET(request):
    return JSONResponse({"status": "PTL Tools API OK"})