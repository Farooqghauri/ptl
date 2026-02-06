"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  File,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  RefreshCw,
  Clock,
  FileType,
  Loader2,
  Scale,
  Users,
  Calendar,
  List,
  Quote,
  BookOpen,
  Lightbulb,
  Gavel,
  X,
} from "lucide-react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import ProcessFlowAnimation from "@/components/ProcessFlowAnimation";
// import { summaryToBrandedText, summaryToBrandedHtml } from "@/utils/ptlExport";

// Types
type UploadState = "idle" | "uploading" | "extracting" | "summarizing" | "done" | "error";

interface Holding {
  outcome: string;
  short_order: string;
  quoted_lines: string[];
}

interface JudgmentSummary {
  case_title: string;
  court: string;
  decision_date: string | null;
  bench: string[];
  procedural_history: string;
  key_facts: string;
  issues: string[];
  holding: Holding;
  citations: string[];
  takeaways: string[];
}

interface ApiResponse {
  success: boolean;
  summary?: JudgmentSummary;
  meta?: {
    file_name: string;
    content_type: string;
    file_size_bytes: number;
    extracted_chars: number;
    processing_time_ms?: number;
  };
  error_code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

// File type config
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const FILE_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="w-8 h-8 text-red-400" />,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <FileType className="w-8 h-8 text-blue-400" />,
  "application/msword": <FileType className="w-8 h-8 text-blue-400" />,
  "text/plain": <File className="w-8 h-8 text-gray-400" />,
};

export default function CaseSummarizerPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<JudgmentSummary | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  // Validate file
  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
      return "Invalid file format";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }
    setFile(selectedFile);
    setError("");
    setSummary(null);
    setMeta(null);
    setState("idle");
  }, []);

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Submit handler
  const handleSubmit = async () => {
    if (!file) return;

    setState("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      
      setState("extracting");
      
      const response = await fetch(`${baseUrl}/api/summarize-v2`, {
        method: "POST",
        body: formData,
      });

      setState("summarizing");

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.details?.toString() || "Summarization failed");
      }

      if (data.summary) {
        setSummary(data.summary);
        setMeta({
          file_name: data.meta?.file_name || file.name,
          content_type: data.meta?.content_type || file.type,
          file_size_bytes: data.meta?.file_size_bytes || file.size,
          extracted_chars: data.meta?.extracted_chars || 0,
          processing_time_ms: data.meta?.processing_time_ms,
        });
        setState("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setState("error");
    }
  };

  // Reset handler
  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setMeta(null);
    setError("");
    setState("idle");
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!summary) return;
    const text = formatSummaryAsText(summary);
    await navigator.clipboard.writeText(text);
    alert("Summary copied to clipboard!");
  };

  // Download as TXT
  const handleDownloadTxt = () => {
    if (!summary) return;
    const text = formatSummaryAsText(summary);
    downloadFile(text, `${summary.case_title || "summary"}.txt`, "text/plain");
  };

  // Download as DOCX (simplified - creates HTML that Word can open)
  const handleDownloadDocx = () => {
    if (!summary) return;
    const html = formatSummaryAsHtml(summary);
    const blob = new Blob([html], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.case_title || "summary"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download as PDF (opens print dialog)
  const handleDownloadPdf = () => {
    if (!summary) return;
    const html = formatSummaryAsHtml(summary);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

// Format helpers
 const formatSummaryAsText = (s: JudgmentSummary): string => {
    return `
CASE SUMMARY
============

Case Title: ${s.case_title}
Court: ${s.court}
Decision Date: ${s.decision_date || "Not mentioned"}
Bench: ${s.bench.join(", ") || "Not mentioned"}

PROCEDURAL HISTORY
${s.procedural_history}

KEY FACTS
${s.key_facts}

ISSUES
${s.issues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

HOLDING
Outcome: ${s.holding.outcome}
Order: ${s.holding.short_order}
${s.holding.quoted_lines.length > 0 ? `\nKey Quotes:\n${s.holding.quoted_lines.map(q => `"${q}"`).join("\n")}` : ""}

CITATIONS
${s.citations.length > 0 ? s.citations.join("\n") : "None cited"}

KEY TAKEAWAYS
${s.takeaways.map((t, idx) => `${idx + 1}. ${t}`).join("\n")}

---
Generated by PTL AI Legal Suite
    `.trim();
  };


// Format as HTML
 const formatSummaryAsHtml = (s: JudgmentSummary): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${s.case_title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #E85D2A; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    .meta { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .meta p { margin: 5px 0; }
    .quote { border-left: 4px solid #E85D2A; padding-left: 15px; margin: 10px 0; font-style: italic; }
    .outcome { display: inline-block; padding: 5px 15px; background: #22c55e; color: white; border-radius: 20px; font-weight: bold; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${s.case_title}</h1>
  
  <div class="meta">
    <p><strong>Court:</strong> ${s.court}</p>
    <p><strong>Decision Date:</strong> ${s.decision_date || "Not mentioned"}</p>
    <p><strong>Bench:</strong> ${s.bench.join(", ") || "Not mentioned"}</p>
  </div>

  <h2>Procedural History</h2>
  <p>${s.procedural_history}</p>

  <h2>Key Facts</h2>
  <p>${s.key_facts}</p>

  <h2>Issues</h2>
  <ul>
    ${s.issues.map(i => `<li>${i}</li>`).join("")}
  </ul>

  <h2>Holding</h2>
  <p><span class="outcome">${s.holding.outcome}</span></p>
  <p><strong>Order:</strong> ${s.holding.short_order}</p>
  ${s.holding.quoted_lines.length > 0 ? `
    <h3>Key Quotes</h3>
    ${s.holding.quoted_lines.map(q => `<div class="quote">"${q}"</div>`).join("")}
  ` : ""}

  <h2>Citations</h2>
  <ul>
    ${s.citations.length > 0 ? s.citations.map(c => `<li>${c}</li>`).join("") : "<li>None cited</li>"}
  </ul>

  <h2>Key Takeaways</h2>
  <ul>
    ${s.takeaways.map(t => `<li>${t}</li>`).join("")}
  </ul>

  <div class="footer">
    Generated by PTL AI Legal Suite | Pakistan's First AI-Powered Legal Platform
  </div>
</body>
</html>
    `.trim();
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status message
  const getStatusMessage = (): string => {
    switch (state) {
      case "uploading": return "Uploading file...";
      case "extracting": return "Extracting text from document...";
      case "summarizing": return "AI is analyzing and summarizing...";
      case "done": return "Summary complete!";
      case "error": return error;
      default: return "";
    }
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gray-900/50">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    AI Case Summarizer
                  </h1>
                  <p className="text-gray-400">
                    Upload Pakistani court judgments and get instant AI-powered summaries
                  </p>
                </div>
              </div>
            </div>

            {/* Animation - Show only in idle state */}
            {state === "idle" && !summary && (
              <div className="mb-8">
                <ProcessFlowAnimation />
              </div>
            )}

            {/* Upload Section */}
            {!summary && (
              <div className="mb-8">
                <div
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300
                    ${dragActive 
                      ? "border-cyan-400 bg-cyan-400/10" 
                      : "border-gray-600 hover:border-gray-500 bg-gray-800/30"
                    }
                    ${state !== "idle" && state !== "error" ? "opacity-50 pointer-events-none" : ""}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept={ALLOWED_EXTENSIONS.join(",")}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={state !== "idle" && state !== "error"}
                  />

                  <div className="flex flex-col items-center gap-4">
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center transition-all
                      ${dragActive ? "bg-cyan-400/20 scale-110" : "bg-gray-700/50"}
                    `}>
                      <Upload className={`w-8 h-8 ${dragActive ? "text-cyan-400" : "text-gray-400"}`} />
                    </div>

                    <div>
                      <p className="text-lg font-medium text-white mb-1">
                        {dragActive ? "Drop your file here" : "Drag & drop your judgment file"}
                      </p>
                      <p className="text-sm text-gray-400">
                        or click to browse • PDF, DOCX, DOC, TXT • Max 15MB
                      </p>
                    </div>

                    {/* File preview */}
                    {file && (
                      <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                        {FILE_ICONS[file.type] || <File className="w-8 h-8 text-gray-400" />}
                        <div className="text-left">
                          <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-[300px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                          className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                {file && state === "idle" && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleSubmit}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:opacity-90 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                      <Gavel className="w-5 h-5" />
                      Summarize Judgment
                    </button>
                  </div>
                )}

                {/* Progress State */}
                {(state === "uploading" || state === "extracting" || state === "summarizing") && (
                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-cyan-400 animate-spin" />
                      <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <p className="text-lg font-medium text-white">{getStatusMessage()}</p>
                    <p className="text-sm text-gray-400">This may take 15-30 seconds depending on document length</p>
                  </div>
                )}

                {/* Error State */}
                {state === "error" && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-400 font-medium">Error</p>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Summary Results */}
            {summary && state === "done" && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-emerald-400 font-medium">Summary Generated Successfully</p>
                      {meta && (
                        <p className="text-sm text-emerald-300/70">
                          {meta.extracted_chars.toLocaleString()} characters extracted
                          {meta.processing_time_ms && ` • ${(meta.processing_time_ms / 1000).toFixed(1)}s processing time`}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Summary
                  </button>
                </div>

                {/* Case Header */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">{summary.case_title}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Court</p>
                        <p className="text-sm text-white">{summary.court}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="text-xs text-gray-400">Decision Date</p>
                        <p className="text-sm text-white">{summary.decision_date || "Not mentioned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-xs text-gray-400">Bench</p>
                        <p className="text-sm text-white">{summary.bench.length > 0 ? summary.bench.join(", ") : "Not mentioned"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Holding/Outcome */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Gavel className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Holding</h3>
                  </div>
                  <div className="mb-4">
                    <span className={`
                      inline-block px-4 py-1.5 rounded-full text-sm font-semibold
                      ${summary.holding.outcome === "Allowed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        summary.holding.outcome === "Dismissed" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"}
                    `}>
                      {summary.holding.outcome}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{summary.holding.short_order}</p>
                  {summary.holding.quoted_lines.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Quote className="w-4 h-4" /> Key Quotes
                      </p>
                      {summary.holding.quoted_lines.map((quote, idx) => (
                        <blockquote key={idx} className="border-l-4 border-cyan-500 pl-4 italic text-gray-300">
                          &quot;{quote}&quot;
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>

                {/* Procedural History & Key Facts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Procedural History</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{summary.procedural_history}</p>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Key Facts</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{summary.key_facts}</p>
                  </div>
                </div>

                {/* Issues */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <List className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">Issues</h3>
                  </div>
                  <ul className="space-y-2">
                    {summary.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-6 h-6 flex-shrink-0 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-gray-300">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Citations & Takeaways */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-semibold text-white">Citations</h3>
                    </div>
                    {summary.citations.length > 0 ? (
                      <ul className="space-y-2">
                        {summary.citations.map((citation, idx) => (
                          <li key={idx} className="text-gray-300 text-sm bg-gray-700/30 px-3 py-2 rounded-lg">
                            {citation}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 italic">No citations mentioned</p>
                    )}
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">Key Takeaways</h3>
                    </div>
                    <ul className="space-y-2">
                      {summary.takeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                          <span className="text-gray-300">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Export Summary</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
                    >
                      <File className="w-4 h-4" />
                      Download TXT
                    </button>
                    <button
                      onClick={handleDownloadDocx}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center gap-2"
                    >
                      <FileType className="w-4 h-4" />
                      Download DOC
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Print / PDF
                    </button>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 max-w-3xl mx-auto">
                    <strong className="text-gray-400">Legal Disclaimer:</strong> This AI-generated summary is for informational purposes only and does not constitute legal advice. 
                    Verify all information with official court records before relying on it for legal proceedings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
