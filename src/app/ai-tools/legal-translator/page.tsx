// Path: src/app/ai-tools/legal-translator/page.tsx

"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  Copy,
  CheckCircle,
  Sparkles,
  Languages,
  Upload,
  FileText,
  Download,
  X,
  AlertCircle,
  File,
} from "lucide-react";
import ToolHeader from "@/components/ToolHeader";
import { downloadBlob } from "@/lib/download";
import { jsPDF } from "jspdf";

let urduFontLoaded = false;
const URDU_FONT_FILE = "NotoNastaliqUrdu-Regular.ttf";
const URDU_FONT_NAME = "NotoNastaliqUrdu";
const URDU_CSS_FONT = "Noto Nastaliq Urdu";

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};
// import "../../styles/dark-theme.css";



export default function LegalTranslator() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [file, setFile] = useState<File | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [direction, setDirection] = useState<"en_to_ur" | "ur_to_en">(
    "en_to_ur"
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword", // .doc
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError("");
    setTranslatedText("");
    setOriginalText("");
  };

  const removeFile = () => {
    setFile(null);
    setOriginalText("");
    setTranslatedText("");
    setError("");
  };

  const handleTranslate = async () => {
    if (!file) {
      setError("Please upload a document first");
      return;
    }

    setLoading(true);
    setError("");
    setTranslatedText("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("direction", direction);

    try {
      const response = await fetch(
        `${API_BASE}/api/translate-document`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Translation failed");
      }

      setOriginalText(data.original_text || "");
      setTranslatedText(data.translation || "");
    } catch (err: Error | unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to connect to the server. Please ensure the backend is running.";
      setError(
        errorMessage ||
          "Failed to connect to the server. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDirection = () => {
    setDirection((prev) => (prev === "en_to_ur" ? "ur_to_en" : "en_to_ur"));
    setTranslatedText("");
  };

  const loadUrduFont = async (doc: jsPDF): Promise<boolean> => {
    if (urduFontLoaded) {
      doc.setFont(URDU_FONT_NAME, "normal");
      doc.setR2L(true);
      return true;
    }
    try {
      const res = await fetch(`/fonts/${URDU_FONT_FILE}`);
      if (!res.ok) throw new Error("Urdu font not found");
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      doc.addFileToVFS(URDU_FONT_FILE, base64);
      doc.addFont(URDU_FONT_FILE, URDU_FONT_NAME, "normal");
      urduFontLoaded = true;
      doc.setFont(URDU_FONT_NAME, "normal");
      doc.setR2L(true);
      return true;
    } catch (err) {
      console.error("Urdu font load failed:", err);
      return false;
    }
  };

  const downloadAsPDF = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const scale = 2;

    const isUrduFirst = direction === "ur_to_en";
    const urduFontFamily = `'${URDU_CSS_FONT}','Jameel Noori Nastaleeq','Times New Roman',serif`;
    const enFontFamily = "'Times New Roman',serif";

    try {
      const face = new FontFace(
        URDU_CSS_FONT,
        `url(/fonts/${URDU_FONT_FILE})`
      );
      await face.load();
      document.fonts.add(face);
    } catch (err) {
      console.error("Urdu font load failed:", err);
      setError(
        "Urdu PDF requires a font. Ensure NotoNastaliqUrdu-Regular.ttf is in public/fonts."
      );
    }

    await document.fonts.load(`16px '${URDU_CSS_FONT}'`);
    await document.fonts.ready;

    const segmenter =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter("ur", { granularity: "grapheme" })
        : null;

    const wrapText = (
      ctx: CanvasRenderingContext2D,
      text: string,
      maxWidthPx: number,
      rtl: boolean
    ): string[] => {
      const lines: string[] = [];
      const paragraphs = text.split("\n");
      for (const para of paragraphs) {
        if (!para.trim()) {
          lines.push("");
          continue;
        }
        const tokens = para.split(" ");

        let line = "";
        for (const token of tokens) {
          const test = line ? `${line} ${token}` : token;
          if (ctx.measureText(test).width <= maxWidthPx) {
            line = test;
          } else {
            if (line) lines.push(line);
            line = token;
          }
        }
        if (line) lines.push(line);
      }
      return lines;
    };

    type Block = { title: string; body: string; rtl: boolean; font: string };
    const blocks: Block[] = isUrduFirst
      ? [
          { title: "Original Text", body: originalText, rtl: true, font: urduFontFamily },
          { title: "Translation", body: translatedText, rtl: false, font: enFontFamily },
        ]
      : [
          { title: "Original Text", body: originalText, rtl: false, font: enFontFamily },
          { title: "Translation", body: translatedText, rtl: true, font: urduFontFamily },
        ];

    const renderPage = (
      blockLines: { title: string; lines: string[]; rtl: boolean; font: string }[],
      startBlock: number,
      startLine: number
    ): { canvas: HTMLCanvasElement; nextBlock: number; nextLine: number } => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(pageWidth * scale);
      canvas.height = Math.floor(pageHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const px = (pt: number) => pt * scale;
      const startX = px(margin);
      const rightX = px(pageWidth - margin);
      let y = px(60);
      const maxY = px(pageHeight - margin);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";

      ctx.font = `${px(18)}px ${enFontFamily}`;
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillText("Legal Translation", startX, y);
      y += px(24);

      ctx.font = `${px(11)}px ${enFontFamily}`;
      ctx.fillText(
        `Direction: ${direction === "en_to_ur" ? "English to Urdu" : "Urdu to English"}`,
        startX,
        y
      );
      y += px(16);
      ctx.fillText("Translated by: PTL AI Legal Translator", startX, y);
      y += px(16);
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, startX, y);
      y += px(24);

      let b = startBlock;
      let l = startLine;
      while (b < blockLines.length) {
        const block = blockLines[b];
        ctx.font = `${px(13)}px ${enFontFamily}`;
        ctx.direction = "ltr";
        ctx.textAlign = "left";
        if (y + px(18) > maxY) break;
        ctx.fillText(block.title, startX, y);
        y += px(18);

        const bodyFontSize = block.rtl ? 16 : 12;
        const bodyLineHeight = block.rtl ? 28 : 16;
        ctx.font = `${px(bodyFontSize)}px ${block.font}`;
        ctx.direction = block.rtl ? "rtl" : "ltr";
        ctx.textAlign = block.rtl ? "right" : "left";
        const textX = block.rtl ? rightX : startX;
        const lineHeight = px(bodyLineHeight);

        while (l < block.lines.length) {
          if (y + lineHeight > maxY) {
            return { canvas, nextBlock: b, nextLine: l };
          }
          ctx.fillText(block.lines[l], textX, y);
          y += lineHeight;
          l += 1;
        }
        b += 1;
        l = 0;
        y += px(10);
      }

      return { canvas, nextBlock: b, nextLine: l };
    };

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("Canvas context not available");

    const blockLines = blocks.map((b) => {
      const size = b.rtl ? 16 : 12;
      tempCtx.font = `${size * scale}px ${b.font}`;
      return {
        title: b.title,
        rtl: b.rtl,
        font: b.font,
        lines: wrapText(tempCtx, b.body, contentWidth * scale, b.rtl),
      };
    });

    let blockIndex = 0;
    let lineIndex = 0;
    let first = true;
    while (blockIndex < blockLines.length) {
      const { canvas, nextBlock, nextLine } = renderPage(
        blockLines,
        blockIndex,
        lineIndex
      );
      const imgData = canvas.toDataURL("image/png");
      if (!first) doc.addPage();
      doc.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      first = false;
      blockIndex = nextBlock;
      lineIndex = nextLine;
    }

    const baseName = file?.name
      ? file.name.replace(/\.[^/.]+$/, "")
      : "translation";
    const blob = doc.output("blob");
    downloadBlob(blob, `${baseName}_translation.pdf`);
  };


  const getFileIcon = () => {
    if (!file) return null;
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-blue-300" />;
  };

  return (
   <> 
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <ToolHeader
          title="Legal Translator"
          description="Translate legal documents between English and Urdu."
          steps={[
            {
              step: "Choose Direction",
              description: "Select English to Urdu or Urdu to English",
            },
            {
              step: "Enter Text or Upload",
              description: "Paste text or upload a document",
            },
            { step: "Translate", description: "Click Translate button" },
            { step: "Download", description: "Save the translated document" },
          ]}
        />

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-emerald-200 bg-clip-text text-transparent mb-3">
            Legal Document Translator
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Upload legal documents and get accurate translations with
            specialized Pakistani legal terminology
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
          {/* Controls Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Direction Toggle */}
              <div className="flex items-center gap-4 bg-slate-900 rounded-xl px-6 py-3 shadow-sm border border-slate-700">
                <span
                  className={`font-semibold transition-colors ${
                    direction === "en_to_ur" ? "text-blue-300" : "text-slate-500"
                  }`}
                >
                  English
                </span>
                <button
                  onClick={toggleDirection}
                  className="p-2 rounded-full hover:bg-blue-900/40 transition-all bg-blue-900/20 border border-blue-800"
                  title="Switch translation direction"
                >
                  <ArrowRightLeft className="w-5 h-5 text-blue-300" />
                </button>
                <span
                  className={`font-semibold transition-colors ${
                    direction === "ur_to_en" ? "text-blue-300" : "text-slate-500"
                  }`}
                >
                  اردو
                </span>
              </div>

              {/* File Upload Status */}
              {file && (
                <div className="flex items-center gap-3 bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-700/50">
                  {getFileIcon()}
                  <span className="text-sm font-medium text-emerald-200 max-w-[200px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={removeFile}
                    className="p-1 hover:bg-green-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-emerald-200" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer ${
                file
                  ? "border-green-300 bg-emerald-900/30"
                  : "border-slate-700 bg-slate-900/60 hover:border-blue-400 hover:bg-blue-900/20"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center text-center">
                  {file ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-emerald-300 mb-3" />
                      <p className="text-emerald-200 font-semibold mb-1">
                        {file.name}
                      </p>
                      <p className="text-sm text-emerald-300">
                        {(file.size / 1024).toFixed(2)} KB • Ready to translate
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-500 mb-3" />
                      <p className="text-slate-200 font-semibold mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-slate-400">
                        PDF, DOC, DOCX files (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Translate Button */}
            <button
              onClick={handleTranslate}
              disabled={loading || !file}
              className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
                ${
                  loading || !file
                    ? "bg-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Translating Document...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Translate Document
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-800/60 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200 mb-1">Error</p>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Translation Result */}
          {translatedText && (
            <div className="border-t border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-8 animate-fade-in">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">
                      Translation Complete
                    </h2>
                    <p className="text-sm text-slate-300">
                      {direction === "en_to_ur"
                        ? "English → Urdu"
                        : "Urdu → English"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-gray-50 transition-all hover:shadow-md flex items-center gap-2 font-medium"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-300 text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-200 text-sm">Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={downloadAsPDF}
                    className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all hover:shadow-md flex items-center gap-2 font-medium"
                    title="Download as PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">PDF</span>
                  </button>

                </div>
              </div>

              {/* Original Text */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original Text
                </h3>
                <div className="bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-700 max-h-[300px] overflow-y-auto">
                  <p
                    className="text-slate-200 whitespace-pre-wrap leading-relaxed"
                    dir={direction === "en_to_ur" ? "ltr" : "rtl"}
                  >
                    {originalText}
                  </p>
                </div>
              </div>

              {/* Translated Text */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Translation
                </h3>
                <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 rounded-xl p-6 shadow-sm border border-emerald-700/50 max-h-[300px] overflow-y-auto">
                  <p
                    className="text-slate-100 whitespace-pre-wrap leading-relaxed font-medium"
                    dir={direction === "en_to_ur" ? "rtl" : "ltr"}
                  >
                    {translatedText}
                  </p>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={removeFile}
                className="w-full mt-6 py-3 px-4 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-semibold hover:bg-gray-50 transition-all"
              >
                Translate Another Document
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-5 border border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-900/40 rounded-lg flex items-center justify-center mb-3">
              <Languages className="w-5 h-5 text-blue-300" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">Legal Accuracy</h3>
            <p className="text-sm text-slate-300">
              Trained on Pakistani legal terminology
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-5 border border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-emerald-900/40 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">
              Document Support
            </h3>
            <p className="text-sm text-slate-300">PDF, DOC, and DOCX formats</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-5 border border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-purple-900/40 rounded-lg flex items-center justify-center mb-3">
              <Download className="w-5 h-5 text-purple-300" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-1">Export Options</h3>
            <p className="text-sm text-slate-300">
              Download as PDF or Word document
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 max-w-3xl mx-auto">
            <strong>Translation Disclaimer:</strong> This AI-powered translation
            is designed for legal documents but should be reviewed by a
            professional translator before official use. PTL Legal Translator
            uses specialized models trained on Pakistani legal terminology
            (Mudai, Mudda &apos; alaih, Istaghasa, etc.).
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
    </>
  );
}

