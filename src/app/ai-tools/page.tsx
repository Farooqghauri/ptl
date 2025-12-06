"use client";

import { useState } from "react";

// --- Helper Types ---
interface QualityReport {
  isValid: boolean;
  issues: string[];
}

interface CompletenessReport {
  isComplete: boolean;
  missingSections: string[];
  completenessScore: number;
  wordCountComparison: { original: number; translated: number; ratio: number };
}

interface TranslationStats {
  originalLength: number;
  translatedLength: number;
  cleaningApplied: boolean;
  processingTime: number;
}

// --- Helper Functions ---

/**
 * Enhanced Urdu translation validation
 */
const validateUrduTranslation = (text: string): QualityReport => {
  const issues: string[] = [];

  if (!text || text.length < 10) {
    return { isValid: false, issues: ["Text is too short or empty"] };
  }

  // Check for excessive English characters
  const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length;
  const englishRatio = englishCharCount / text.length;
  if (englishRatio > 0.03) {
    issues.push(`High English character ratio: ${(englishRatio * 100).toFixed(1)}%`);
  }

  // Check for common corruption patterns
  const corruptionPatterns = [
    /حقائق/g, /حقات/g, /قائق/g, /سُ?پم\b/g,
    /پٹیشن/g, /ایپ کیشن/g, /جڈیشل/g,
  ];

  corruptionPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 2) {
      issues.push(`Found corruption pattern: ${pattern} (${matches.length} occurrences)`);
    }
  });

  // Check for reasonable Urdu character ratio
  const urduCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const urduRatio = urduCharCount / text.length;
  if (urduRatio < 0.7) {
    issues.push(`Low Urdu character ratio: ${(urduRatio * 100).toFixed(1)}%`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

/**
 * Advanced Legal Urdu Text Cleaner
 */
const cleanLegalUrduText = (text: string): string => {
  if (!text || typeof text !== "string") return "";

  // Phase 1: Comprehensive Character Normalization
  let cleaned = text
    // Normalize Urdu punctuation and characters
    .replace(/[۔]+/g, "۔")
    .replace(/[،]+/g, "،")
    .replace(/[؟]+/g, "؟")
    .replace(/[ءۂ]/g, "ء")
    // Fix common OCR/translation artifacts
    .replace(/\u200e/g, "") // Remove LTR marks
    .replace(/\u200f/g, "") // Remove RTL marks
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    // Remove non-Urdu characters (keeping only Urdu, Arabic, numbers, punctuation)
    .replace(
      /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\r\n0-9۔،؟():-]/g,
      ""
    );

  // Phase 2: Advanced Pattern-based Corrections
  const advancedCorrections: [RegExp, string][] = [
    [/\bسُ?پم\s*کورٹ\b/g, "سپریم کورٹ"],
    [/\bپٹیشن\b/g, "درخواست"],
    [/\bایپ\s*کیشن\b/g, "درخواست"],
    [/\bجڈیشل\b/g, "عدالتی"],
    [/\bحقائق/g, "حقائق"], // Fix common word
    [/\bپاکان\b/g, "پاکستان"],
    [/\s*۔\s*/g, "۔ "],
    [/\s*،\s*/g, "، "],
    [/\s*؟\s*/g, "؟ "],
  ];

  advancedCorrections.forEach(([pattern, replacement]) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  // Phase 3: Structural Integrity and Final Cleanup
  cleaned = cleaned
    .replace(/\s+/g, " ") // Normalize spaces
    .replace(/(\n\s*){3,}/g, "\n\n") // Limit consecutive newlines
    .replace(/^\s+|\s+$/g, "") // Trim
    .replace(/([۔،؟])\1+/g, "$1") // Remove duplicate punctuation
    .trim();

  return cleaned;
};

/**
 * Enhanced Translation Completeness Validator
 */
const validateTranslationCompleteness = (
  original: string,
  translated: string
): CompletenessReport => {
  const missingSections: string[] = [];
  const originalLower = original.toLowerCase();
  const translatedLower = translated.toLowerCase();

  // Calculate word count ratio
  const originalWords = original.split(/\s+/).length;
  const translatedWords = translated.split(/\s+/).length;
  const wordRatio = translatedWords / originalWords;

  // Define critical legal sections and their required Urdu equivalents
  const criticalTermMap = [
    { english: "judgment", urdu: "فیصلہ" },
    { english: "section", urdu: "سیکشن" },
    { english: "evidence", urdu: "ثبوت" },
    { english: "witness", urdu: "گواہ" },
    { english: "confession", urdu: "اعتراف" },
    { english: "investigation", urdu: "تحقیقات" },
    { english: "prosecution", urdu: "استغاثہ" },
    { english: "acquitted", urdu: "بری" },
    { english: "convicted", urdu: "مجرم قرار دیا" },
    { english: "appeal", urdu: "اپیل" },
    { english: "court", urdu: "کورٹ" },
    { english: "legal", urdu: "قانونی" },
    { english: "procedure", urdu: "ضابطہ" },
    { english: "code", urdu: "کوڈ" },
  ];

  const missedTerms: string[] = [];

  criticalTermMap.forEach((term) => {
    if (originalLower.includes(term.english)) {
      if (
        !translatedLower.includes(term.urdu) &&
        !translatedLower.includes(term.english)
      ) {
        missedTerms.push(term.english);
      }
    }
  });

  if (missedTerms.length > 0) {
    missingSections.push(`Missing critical legal terms: ${missedTerms.join(", ")}`);
  }

  const isComplete = wordRatio >= 0.75 && wordRatio <= 3.0 && missedTerms.length === 0;

  const completenessScore = Math.min(
    100,
    Math.floor(wordRatio * 100 * 0.8 + (missedTerms.length === 0 ? 20 : 0))
  );

  return {
    isComplete,
    missingSections,
    completenessScore,
    wordCountComparison: {
      original: originalWords,
      translated: translatedWords,
      ratio: wordRatio,
    },
  };
};

/**
 * Convert file to base64 for JSON upload
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });
};

export default function EnglishToUrdu() {
  const [file, setFile] = useState<File | null>(null);
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [completenessReport, setCompletenessReport] = useState<CompletenessReport | null>(null);
  const [translationStats, setTranslationStats] = useState<TranslationStats | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"formdata" | "json">("formdata");

  const handleUploadAndTranslate = async () => {
    if (!file) return;

    const startTime = Date.now();
    setIsLoading(true);
    setError(null);
    setTranslatedText("");
    setExtractedText("");
    setQualityReport(null);
    setCompletenessReport(null);
    setTranslationStats(null);
    setCurrentStep(null);

    try {
      // Validate file
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size too large. Maximum 50MB allowed.");
      }

      // Step 1: Extract text from document
      setCurrentStep("1/3: Extracting text from document...");
      console.log("Step 1: Extracting text from document...");

      let extractData;
      
      if (uploadMethod === "formdata") {
        // Method 1: FormData upload
        const formData = new FormData();
        formData.append("file", file);

        const extractRes = await fetch("/api/ptl-tools", {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(120000),
        });

        if (!extractRes.ok) {
          const errorText = await extractRes.text();
          throw new Error(`Extraction failed: ${extractRes.status} - ${errorText}`);
        }

        extractData = await extractRes.json();
      } else {
        // Method 2: JSON with base64 upload
        const base64File = await fileToBase64(file);
        
        const extractRes = await fetch("/api/ptl-tools", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            file: base64File
          }),
          signal: AbortSignal.timeout(120000),
        });

        if (!extractRes.ok) {
          const errorData = await extractRes.json();
          throw new Error(`Extraction failed: ${errorData.error || extractRes.statusText}`);
        }

        extractData = await extractRes.json();
      }

      // Check for OCR requirement
      if (extractData.ocr_required) {
        throw new Error(
          extractData.message || 
          "Document requires OCR processing. Please upload a document with selectable text."
        );
      }

      // Check if text exists
      if (!extractData.text || extractData.text.trim().length < 10) {
        throw new Error(
          extractData.message || 
          "Extracted text is too short or empty. The document may not contain readable text."
        );
      }

      setExtractedText(extractData.text);
      console.log("Text extraction successful. Length:", extractData.text.length);

      // Step 2: Translate to Legal Urdu with enhanced API
      setCurrentStep("2/3: Translating to Legal Urdu with AI...");
      console.log("Step 2: Starting comprehensive translation...");
      
      const translateRes = await fetch("/api/translate-legal-urdu", {
        method: "POST",
        body: JSON.stringify({ 
          text: extractData.text,
          fileName: file.name,
          fileType: file.type,
          maxOutputTokens: 16000 
        }),
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(240000),
      });

      if (!translateRes.ok) {
        const errorData = await translateRes.json();
        throw new Error(`Translation failed: ${errorData.error || 'Unknown error'}`);
      }

      const translateData = await translateRes.json();
      console.log("Translation received. Length:", translateData.translatedText?.length);

      // Step 3: Apply comprehensive cleaning and validation
      setCurrentStep("3/3: Validating and cleaning translation...");
      let finalTranslation = translateData.translatedText;
      let cleaningApplied = false;

      if (finalTranslation) {
        const original = finalTranslation;
        finalTranslation = cleanLegalUrduText(finalTranslation);
        cleaningApplied = original !== finalTranslation;

        // Validate quality and completeness
        const qualityCheck = validateUrduTranslation(finalTranslation);
        const completenessCheck = validateTranslationCompleteness(
          extractData.text,
          finalTranslation
        );

        setQualityReport(qualityCheck);
        setCompletenessReport(completenessCheck);

        if (!qualityCheck.isValid || !completenessCheck.isComplete) {
          console.warn("Quality/completeness issues detected:", {
            quality: qualityCheck.issues,
            completeness: completenessCheck.missingSections,
          });
        }
      }

      setTranslatedText(finalTranslation);

      const processingTime = Date.now() - startTime;
      setTranslationStats({
        originalLength: extractData.text.length,
        translatedLength: finalTranslation.length,
        cleaningApplied,
        processingTime,
      });

      console.log("Process completed successfully in", processingTime, "ms");
      
    } catch (err) {
      console.error("Processing error:", err);
      if (err instanceof Error) {
        if (err.name === "TimeoutError") {
          setError("Request timeout. The document might be too large or complex. Please try with a smaller document.");
        } else if (err.name === "AbortError") {
          setError("Request was cancelled.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  };

  const handleDownloadTxt = () => {
    if (!translatedText) return;

    const blob = new Blob([translatedText], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Legal_Urdu_${
      file?.name?.split(".")[0] || "Document"
    }_${new Date().getTime()}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleRetryTranslation = async () => {
    if (!extractedText) return;

    const startTime = Date.now();
    setError(null);
    setTranslatedText("");
    setQualityReport(null);
    setCompletenessReport(null);

    try {
      setCurrentStep("Retrying translation with enhanced settings...");
      console.log("Retrying translation with enhanced settings...");
      setIsLoading(true);
      
      const translateRes = await fetch("/api/translate-legal-urdu", {
        method: "POST",
        body: JSON.stringify({
          text: extractedText,
          fileName: file?.name,
          fileType: file?.type,
          maxOutputTokens: 20000,
        }),
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(300000),
      });

      if (!translateRes.ok) {
        const errorData = await translateRes.json();
        throw new Error(`Retry failed: ${errorData.error || "Unknown error"}`);
      }

      const translateData = await translateRes.json();
      const finalTranslation = cleanLegalUrduText(translateData.translatedText);

      setTranslatedText(finalTranslation);

      // Re-validate
      const qualityCheck = validateUrduTranslation(finalTranslation);
      const completenessCheck = validateTranslationCompleteness(
        extractedText,
        finalTranslation
      );
      setQualityReport(qualityCheck);
      setCompletenessReport(completenessCheck);

      const processingTime = Date.now() - startTime;
      setTranslationStats((prev) => ({
        ...prev!,
        translatedLength: finalTranslation.length,
        processingTime: (prev?.processingTime || 0) + processingTime,
        cleaningApplied: true,
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setTranslatedText("");
    setExtractedText("");
    setQualityReport(null);
    setCompletenessReport(null);
    setTranslationStats(null);
  };

  const supportedFormats = ".pdf, .docx, .doc, .txt";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-800 mb-3">
            Professional Legal Document Translation
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            English to Complete Legal Urdu - AI-Powered Precision Translation
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 md:p-8 mb-8">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <span className="text-2xl text-blue-600">📄</span>
              </div>
              <div>
                <label className="block text-xl md:text-2xl font-semibold text-gray-800">
                  Upload Legal Document
                </label>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Supported formats: {supportedFormats} | Max size: 50MB
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setUploadMethod("formdata")}
                  className={`px-4 py-2 rounded-lg font-medium ${uploadMethod === "formdata" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  Standard Upload (Recommended)
                </button>
                <button
                  onClick={() => setUploadMethod("json")}
                  className={`px-4 py-2 rounded-lg font-medium ${uploadMethod === "json" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  JSON Upload
                </button>
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="block w-full text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white hover:file:from-blue-600 hover:file:to-blue-700 transition-all duration-200 cursor-pointer"
              />
            </div>
          </div>

          {file && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    <p className="font-semibold text-green-800 truncate">{file.name}</p>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Unknown type"}
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition duration-150"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleUploadAndTranslate}
            disabled={!file || isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {currentStep || "Processing Legal Document..."}
              </>
            ) : (
              <>
                <span className="mr-2">⚖️</span>
                Translate to Complete Legal Urdu
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl shadow-lg">
            <div className="flex items-start mb-4">
              <div className="bg-red-100 p-3 rounded-xl mr-4">
                <span className="text-xl text-red-600">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-red-800 mb-2">
                  Processing Error
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                {extractedText && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleRetryTranslation}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 font-medium shadow-md"
                    >
                      Retry with Enhanced Settings
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150 font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Extracted Text Preview */}
        {extractedText && !translatedText && (
          <div className="mb-8 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <span className="text-xl text-blue-600">📝</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Extracted English Text
                </h3>
                {translationStats && (
                  <p className="text-sm text-gray-500 mt-1">
                    {translationStats.originalLength.toLocaleString()} characters •{" "}
                    {extractedText.split(/\s+/).length.toLocaleString()} words
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-300 rounded-xl text-sm md:text-base overflow-auto max-h-80 font-mono leading-relaxed">
              {extractedText.substring(0, 2000)}
              {extractedText.length > 2000 && (
                <>
                  <span className="text-gray-500">...</span>
                  <p className="text-gray-400 text-sm mt-2">
                    (Showing first 2000 characters)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Translation Result */}
        {translatedText && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 md:p-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0 lg:mr-8">
                  <div className="flex items-center mb-3">
                    <div className="bg-white/20 p-2 rounded-lg mr-3">
                      <span className="text-xl">✅</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold">
                      Complete Legal Urdu Translation
                    </h3>
                  </div>
                  
                  {translationStats && (
                    <div className="text-green-100 text-sm md:text-base space-y-1">
                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center">
                          <span className="mr-1">📊</span>
                          {translationStats.translatedLength.toLocaleString()} characters
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📝</span>
                          {translatedText.split(/\s+/).length.toLocaleString()} words
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">⏱️</span>
                          {(translationStats.processingTime / 1000).toFixed(1)} seconds
                        </span>
                      </div>
                      {translationStats.cleaningApplied && (
                        <div className="flex items-center mt-2">
                          <span className="mr-1">✨</span>
                          Auto-cleaning applied for optimal quality
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownloadTxt}
                    className="px-5 py-3 bg-white text-green-700 rounded-xl hover:bg-green-50 transition duration-150 font-semibold flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <span className="mr-2">📥</span>
                    Download Translation
                  </button>
                  {completenessReport && !completenessReport.isComplete && (
                    <button
                      onClick={handleRetryTranslation}
                      className="px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition duration-150 font-semibold flex items-center justify-center shadow-lg hover:shadow-xl"
                    >
                      <span className="mr-2">🔄</span>
                      Enhance Translation
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quality & Completeness Reports */}
            {(qualityReport || completenessReport) && (
              <div className="border-b border-gray-200">
                {qualityReport && !qualityReport.isValid && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200 p-5">
                    <div className="flex items-start mb-3">
                      <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                        <span className="text-yellow-600">⚠</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-800 text-lg mb-2">
                          Quality Check Notes
                        </h4>
                        <ul className="text-yellow-700 text-sm md:text-base space-y-1">
                          {qualityReport.issues.map((issue, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {completenessReport && (
                  <div
                    className={`p-5 ${
                      completenessReport.isComplete
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                        : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                    } border-b`}
                  >
                    <div className="flex items-start mb-3">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          completenessReport.isComplete
                            ? "bg-green-100"
                            : "bg-orange-100"
                        }`}
                      >
                        <span
                          className={`text-lg ${
                            completenessReport.isComplete
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {completenessReport.isComplete ? "✓" : "⚠"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-semibold text-lg mb-2 ${
                            completenessReport.isComplete
                              ? "text-green-800"
                              : "text-orange-800"
                          }`}
                        >
                          Translation Completeness: {completenessReport.completenessScore}%
                        </h4>
                        <div className="text-sm md:text-base space-y-2">
                          <div
                            className={
                              completenessReport.isComplete
                                ? "text-green-700"
                                : "text-orange-700"
                            }
                          >
                            <div className="flex items-center">
                              <span className="mr-2">📈</span>
                              <span>
                                Word count ratio:{" "}
                                <span className="font-semibold">
                                  {completenessReport.wordCountComparison.translated.toLocaleString()} /{" "}
                                  {completenessReport.wordCountComparison.original.toLocaleString()}
                                </span>{" "}
                                ({(
                                  completenessReport.wordCountComparison.ratio * 100
                                ).toFixed(1)}
                                %)
                              </span>
                            </div>
                          </div>
                          {completenessReport.missingSections.length > 0 && (
                            <div className="mt-3 text-sm text-orange-700">
                              <p className="font-medium mb-1">Missing or weak sections detected:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {completenessReport.missingSections.map((section, index) => (
                                  <li key={index}>{section}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Final Translated Text Area */}
            <div className="p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-gray-700 text-lg">
                  Translated Text
                </h4>
                <div className="text-sm text-gray-500">
                  <span className="flex items-center">
                    <span className="mr-1">🔤</span>
                    Right-to-Left (Urdu) Format
                  </span>
                </div>
              </div>
              <div
                className="p-5 md:p-6 bg-gray-50 border border-gray-300 rounded-xl overflow-auto max-h-[500px] shadow-inner"
                style={{ direction: "rtl" }}
              >
                <p
                  className="text-base md:text-lg leading-relaxed whitespace-pre-wrap text-gray-800"
                  style={{
                    fontFamily: "'Noto Naskh Arabic', 'Alvi Nastaleeq', 'Jameel Noori Nastaleeq', Tahoma, serif",
                    lineHeight: "2",
                    textAlign: "justify",
                  }}
                >
                  {translatedText}
                </p>
              </div>
              
              {/* Additional Actions */}
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={handleDownloadTxt}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-150 font-medium shadow-md"
                >
                  Download as TXT
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 font-medium"
                >
                  Print Translation
                </button>
                <button
                  onClick={() => {
                    setTranslatedText("");
                    setExtractedText("");
                    setFile(null);
                    setQualityReport(null);
                    setCompletenessReport(null);
                    setTranslationStats(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 font-medium"
                >
                  Start New Translation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        {!translatedText && !isLoading && (
          <div className="mt-12 text-center text-gray-500 text-sm">
            <p className="mb-2">
              <span className="text-blue-600 font-medium">Note:</span> For best results, upload clear documents with selectable text
            </p>
            <p>
              Translation powered by AI with legal terminology validation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}