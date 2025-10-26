// src/types/pdfjs.d.ts

/** Minimal pdfjs type stubs – enough for our use without any 'any' usage */

declare module "pdfjs-dist/legacy/build/pdf" {
  /** A single text item returned from getTextContent() */
  export interface PDFTextItem {
    str: string;
  }

  /** Text content from a page */
  export interface PDFTextContent {
    items: PDFTextItem[];
  }

  /** Represents one PDF page */
  export interface PDFPageProxy {
    getTextContent(): Promise<PDFTextContent>;
  }

  /** Represents the full PDF document */
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  /** Loading task for PDF document */
  export interface PDFLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export function getDocument(
    options: { data: ArrayBuffer | Uint8Array }
  ): PDFLoadingTask;
}

declare module "pdfjs-dist/build/pdf.worker.entry" {
  const workerSrc: string;
  export default workerSrc;
}
