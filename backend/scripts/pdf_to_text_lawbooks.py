from pathlib import Path
import pdfplumber

LAWBOOKS_DIR = Path("data/lawbooks")

def pdf_to_text(pdf_path: Path):
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            try:
                txt = page.extract_text()
                if txt:
                    text_parts.append(txt)
            except Exception:
                continue
    return "\n\n".join(text_parts)


def main():
    pdf_files = list(LAWBOOKS_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found in lawbooks folder")
        return

    for pdf in pdf_files:
        txt_path = pdf.with_suffix(".pdf.txt")

        if txt_path.exists():
            print(f"⏭ Skipping (already exists): {pdf.name}")
            continue

        print(f"📄 Converting: {pdf.name}")
        text = pdf_to_text(pdf)

        if not text.strip():
            print(f"⚠ Warning: No text extracted from {pdf.name}")
            continue

        txt_path.write_text(text, encoding="utf-8")
        print(f"✔ Saved: {txt_path.name}")

    print("\nDONE: PDF → text conversion completed")


if __name__ == "__main__":
    main()
