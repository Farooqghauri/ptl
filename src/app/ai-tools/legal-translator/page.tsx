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
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
// import "../../styles/dark-theme.css";



export default function LegalTranslator() {
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
        "http://127.0.0.1:8000/api/translate-document",
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

  const downloadAsPDF = () => {
    // Create a simple text-based PDF content
    const content = `
Legal Translation
=================

Direction: ${direction === "en_to_ur" ? "English to Urdu" : "Urdu to English"}
Translated by: PTL AI Legal Translator
Date: ${new Date().toLocaleDateString()}

Original Text:
${originalText}

Translation:
${translatedText}
    `.trim();

    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, "")}_translation.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsWord = () => {
    // Create Word-compatible HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Legal Translation</title>
</head>
<body style="font-family: 'Times New Roman', serif; padding: 40px;">
  <h1 style="text-align: center; color: #1e40af;">Legal Translation</h1>
  <hr style="margin: 20px 0;">
  
  <p><strong>Direction:</strong> ${
    direction === "en_to_ur" ? "English to Urdu" : "Urdu to English"
  }</p>
  <p><strong>Translated by:</strong> PTL AI Legal Translator</p>
  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  
  <h2 style="margin-top: 30px; color: #1e40af;">Original Text:</h2>
  <div style="white-space: pre-wrap; padding: 15px; background: #f3f4f6; border-left: 4px solid #1e40af;">
    ${originalText}
  </div>
  
  <h2 style="margin-top: 30px; color: #1e40af;">Translation:</h2>
  <div style="white-space: pre-wrap; padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; direction: ${
    direction === "en_to_ur" ? "rtl" : "ltr"
  };">
    ${translatedText}
  </div>
  
  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This translation is generated by AI and should be verified by a professional translator.</p>
    <p>PTL - Pakistan Top Lawyers © ${new Date().getFullYear()}</p>
  </footer>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, "")}_translation.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileIcon = () => {
    if (!file) return null;
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-blue-600" />;
  };

  return (
   <> 
   <SignedIn>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
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
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
            Legal Document Translator
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Upload legal documents and get accurate translations with
            specialized Pakistani legal terminology
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Controls Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Direction Toggle */}
              <div className="flex items-center gap-4 bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200">
                <span
                  className={`font-semibold transition-colors ${
                    direction === "en_to_ur" ? "text-blue-700" : "text-gray-400"
                  }`}
                >
                  English
                </span>
                <button
                  onClick={toggleDirection}
                  className="p-2 rounded-full hover:bg-blue-100 transition-all bg-blue-50 border border-blue-200"
                  title="Switch translation direction"
                >
                  <ArrowRightLeft className="w-5 h-5 text-blue-700" />
                </button>
                <span
                  className={`font-semibold transition-colors ${
                    direction === "ur_to_en" ? "text-blue-700" : "text-gray-400"
                  }`}
                >
                  اردو
                </span>
              </div>

              {/* File Upload Status */}
              {file && (
                <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  {getFileIcon()}
                  <span className="text-sm font-medium text-green-800 max-w-[200px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={removeFile}
                    className="p-1 hover:bg-green-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-green-700" />
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
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
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
                      <CheckCircle className="w-12 h-12 text-green-600 mb-3" />
                      <p className="text-green-700 font-semibold mb-1">
                        {file.name}
                      </p>
                      <p className="text-sm text-green-600">
                        {(file.size / 1024).toFixed(2)} KB • Ready to translate
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-700 font-semibold mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
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
                    ? "bg-gray-300 cursor-not-allowed"
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
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Translation Result */}
          {translatedText && (
            <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-8 animate-fade-in">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Translation Complete
                    </h2>
                    <p className="text-sm text-gray-600">
                      {direction === "en_to_ur"
                        ? "English → Urdu"
                        : "Urdu → English"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all hover:shadow-md flex items-center gap-2 font-medium"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-700 text-sm">Copy</span>
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

                  <button
                    onClick={downloadAsWord}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all hover:shadow-md flex items-center gap-2 font-medium"
                    title="Download as Word"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Word</span>
                  </button>
                </div>
              </div>

              {/* Original Text */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original Text
                </h3>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 max-h-[300px] overflow-y-auto">
                  <p
                    className="text-gray-700 whitespace-pre-wrap leading-relaxed"
                    dir={direction === "en_to_ur" ? "ltr" : "rtl"}
                  >
                    {originalText}
                  </p>
                </div>
              </div>

              {/* Translated Text */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Translation
                </h3>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200 max-h-[300px] overflow-y-auto">
                  <p
                    className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium"
                    dir={direction === "en_to_ur" ? "rtl" : "ltr"}
                  >
                    {translatedText}
                  </p>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={removeFile}
                className="w-full mt-6 py-3 px-4 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Translate Another Document
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Languages className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Legal Accuracy</h3>
            <p className="text-sm text-gray-600">
              Trained on Pakistani legal terminology
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Document Support
            </h3>
            <p className="text-sm text-gray-600">PDF, DOC, and DOCX formats</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Export Options</h3>
            <p className="text-sm text-gray-600">
              Download as PDF or Word document
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 max-w-3xl mx-auto">
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
     </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
