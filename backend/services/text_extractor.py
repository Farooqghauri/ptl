import io
import pdfplumber
import docx


MAX_CHARS = 80000  # safety cap before AI stage


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return "\n".join(text).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8",errors="ignore").strip()


def extract_text(
    file_bytes: bytes,
    content_type: str,
    filename: str
) -> str:
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)

    elif content_type in {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    } or filename.lower().endswith((".docx",".doc")):
        text = extract_text_from_docx(file_bytes)

    elif content_type == "text/plain" or filename.lower().endswith(".txt"):
        text = extract_text_from_txt(file_bytes)

    else:
        raise ValueError("Unsupported file format")

    if not text:
        raise ValueError("No extractable text found")

    return text[:MAX_CHARS]
