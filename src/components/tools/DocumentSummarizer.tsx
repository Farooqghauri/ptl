"use client";

import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// ✅ Set worker source using CDN (more reliable than local import)
(pdfjsLib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

import { jsPDF } from "jspdf";

interface SummaryResult {
  english: string;
  urdu: string;
  legalAnalysis: string;
  analysis: string; // Add missing property
}

/**
 * Minimal typed shape for PDF text items (we only need `.str`)
 * This avoids `any` and keeps typing local and strict.
 */
interface PDFTextItem {
  str: string;
}

export default function DocumentSummarizer() {
  const [fileName, setFileName] = useState<string>("");
  const [textContent, setTextContent] = useState<string>("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"english" | "urdu">("english");

  // Extract text from a PDF file using pdfjs
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const txtContent = await page.getTextContent();

      // Use our typed PDFTextItem so we don't use `any`
      const pageText = (txtContent.items as PDFTextItem[]).map((item) => item.str).join(" ");
      fullText += `\n${pageText}`;
    }

    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      if (file.type === "application/pdf") {
        const pdfText = await extractTextFromPDF(file);
        setTextContent(pdfText);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setTextContent(content);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      // handle parsing errors gracefully
      console.error("Failed to extract text from file:", err);
      window.alert("Failed to read the uploaded file. Make sure it is a valid PDF or text file.");
    }
  };

  const handleSummarize = async (): Promise<void> => {
    if (!textContent.trim()) {
      window.alert("Please upload a valid document.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textContent }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Summarization failed.");

      const content = data.content as string;

      const english = content.match(/ENGLISH SUMMARY[:：](.*?)(URDU SUMMARY|LEGAL ANALYSIS|$)/is)?.[1]?.trim() ?? "";
      const urdu = content.match(/URDU SUMMARY[:：](.*?)(LEGAL ANALYSIS|$)/is)?.[1]?.trim() ?? "";
      const analysis = content.match(/LEGAL ANALYSIS[:：](.*)$/is)?.[1]?.trim() ?? "";

      setResult({
        english: english || "No English summary found.",
        urdu: urdu || "کوئی اردو خلاصہ نہیں ملا۔",
        legalAnalysis: analysis || "No analysis available.",
        analysis: analysis || "No analysis available.",
      });
    } catch (error) {
      console.error(error);
      window.alert("Failed to summarize document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (): void => {
    if (!result) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Pakistan Top Lawyers - Document Summary", 10, 10);
    doc.setFontSize(12);

    let y = 20;
    const lines: string[] = [
      `File: ${fileName}`,
      "",
      "=== English Summary ===",
      result.english,
      "",
      "=== Urdu Summary ===",
      result.urdu,
      "",
      "=== Legal Analysis ===",
      result.analysis,
    ];

    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 180);
      wrapped.forEach((txt: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(txt, 10, y);
        y += 8;
      });
    });

    doc.save(`PTL_Summary_${Date.now()}.pdf`);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm h-full overflow-auto">
      <h2 className="text-xl font-semibold text-[#0A2342] mb-3">📄 Document Summarizer</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload a document to generate summaries (English & Urdu) and legal analysis under Pakistani law.
      </p>

      <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} className="mb-4" />

      <button
        onClick={handleSummarize}
        disabled={isLoading}
        className="bg-[#FACC15] text-[#0A2342] px-4 py-2 rounded hover:bg-yellow-400 disabled:opacity-50"
        type="button"
      >
        {isLoading ? "Summarizing..." : "Generate Summary"}
      </button>

      {result && (
        <div className="mt-6">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setActiveTab("english")}
              className={`px-3 py-1 rounded ${activeTab === "english" ? "bg-[#0A2342] text-white" : "bg-gray-200"}`}
              type="button"
            >
              English Summary
            </button>
            <button
              onClick={() => setActiveTab("urdu")}
              className={`px-3 py-1 rounded ${activeTab === "urdu" ? "bg-[#0A2342] text-white" : "bg-gray-200"}`}
              type="button"
            >
              Urdu Summary
            </button>
            <button
              onClick={handleDownloadPDF}
              className="ml-auto bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              type="button"
            >
              Download PDF
            </button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap leading-relaxed">
            {activeTab === "english" ? result.english : result.urdu}

            <div className="mt-6 border-t pt-3">
              <h3 className="font-semibold text-[#0A2342] mb-2">Legal Analysis:</h3>
              <p>{result.analysis}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
