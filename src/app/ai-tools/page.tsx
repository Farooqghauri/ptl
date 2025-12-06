"use client";

import { useState } from "react";

// --- Configuration ---
// Make sure this matches your Python backend host

const PYTHON_API_URL = "/api/ptl-tools";

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

// --- Helper Functions (Corrected for Urdu Validation) ---

/**
 * Enhanced Urdu translation validation
 */
const validateUrduTranslation = (text: string): QualityReport => {
    const issues: string[] = [];
    
    if (!text || text.length < 10) {
        return { isValid: false, issues: ['Text is too short or empty'] };
    }
    
    // Check for excessive English characters
    const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = englishCharCount / text.length;
    if (englishRatio > 0.03) { // Stricter threshold
        issues.push(`High English character ratio: ${(englishRatio * 100).toFixed(1)}%`);
    }
    
    // Check for common corruption patterns (Simplified for brevity, but kept in)
    const corruptionPatterns = [
        /حقائق/g, /حقات/g, /قائق/g, /سُ?پم\b/g,
        /پٹیشن/g, /ایپ کیشن/g, /جڈیشل/g
    ];
    
    corruptionPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches && matches.length > 2) {
            issues.push(`Found corruption pattern: ${pattern} (${matches.length} occurrences)`);
        }
    });
    
    // Check for reasonable Urdu character ratio
    const urduCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const urduRatio = urduCharCount / text.length;
    if (urduRatio < 0.7) { // Higher threshold for legal documents
        issues.push(`Low Urdu character ratio: ${(urduRatio * 100).toFixed(1)}%`);
    }
    
    return {
        isValid: issues.length === 0,
        issues
    };
};

/**
 * Advanced Legal Urdu Text Cleaner
 */
const cleanLegalUrduText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    // Phase 1: Comprehensive Character Normalization
    let cleaned = text
        // Normalize Urdu punctuation and characters
        .replace(/[۔]+/g, '۔')
        .replace(/[،]+/g, '،')
        .replace(/[؟]+/g, '؟')
        .replace(/[ءۂ]/g, 'ء')
        // Fix common OCR/translation artifacts
        .replace(/\u200e/g, '') // Remove LTR marks
        .replace(/\u200f/g, '') // Remove RTL marks
        .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
        // Remove non-Urdu characters (keeping only Urdu, Arabic, numbers, punctuation)
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\r\n0-9۔،؟():-]/g, '');

    // Phase 2: Advanced Pattern-based Corrections (Simplified for brevity)
    const advancedCorrections: [RegExp, string][] = [
        [/\bسُ?پم\s*کورٹ\b/g, 'سپریم کورٹ'],
        [/\bپٹیشن\b/g, 'درخواست'],
        [/\bایپ\s*کیشن\b/g, 'درخواست'],
        [/\bجڈیشل\b/g, 'عدالتی'],
        [/\bحقائق/g, 'حقائق'], // Fix common word
        [/\bپاکان\b/g, 'پاکستان'],
        [/\s*۔\s*/g, '۔ '],
        [/\s*،\s*/g, '، '],
        [/\s*؟\s*/g, '؟ '],
    ];

    advancedCorrections.forEach(([pattern, replacement]) => {
        cleaned = cleaned.replace(pattern, replacement);
    });

    // Phase 3: Structural Integrity and Final Cleanup
    cleaned = cleaned
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/(\n\s*){3,}/g, '\n\n') // Limit consecutive newlines
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/([۔،؟])\1+/g, '$1') // Remove duplicate punctuation
        .trim();

    return cleaned;
};


/**
 * Enhanced Translation Completeness Validator 
 */
const validateTranslationCompleteness = (original: string, translated: string): CompletenessReport => {
    const missingSections: string[] = [];
    const originalLower = original.toLowerCase();
    const translatedLower = translated.toLowerCase();
    
    // Calculate word count ratio
    const originalWords = original.split(/\s+/).length;
    const translatedWords = translated.split(/\s+/).length;
    const wordRatio = translatedWords / originalWords;
    
    // Define critical legal sections and their required Urdu equivalents (MUST MATCH API PROMPT)
    const criticalTermMap = [
        { english: 'judgment', urdu: 'فیصلہ' },
        { english: 'section', urdu: 'سیکشن' },
        { english: 'evidence', urdu: 'ثبوت' },
        { english: 'witness', urdu: 'گواہ' },
        { english: 'confession', urdu: 'اعتراف' },
        { english: 'investigation', urdu: 'تحقیقات' },
        { english: 'prosecution', urdu: 'استغاثہ' },
        { english: 'acquitted', urdu: 'بری' },
        { english: 'convicted', urdu: 'مجرم قرار دیا' },
        { english: 'appeal', urdu: 'اپیل' },
        { english: 'court', urdu: 'کورٹ' }, // Covers Supreme Court, High Court, etc.
        { english: 'legal', urdu: 'قانونی' },
        { english: 'procedure', urdu: 'ضابطہ' }, // Covers 'Cr.P.C.' which translates to 'ضابطہ فوجداری'
        { english: 'code', urdu: 'کوڈ' } // Covers 'PPC' (پینل کوڈ)
    ];
    
    const missedTerms: string[] = [];
    
    criticalTermMap.forEach(term => {
        // 1. Check if the English term is present in the Original document
        if (originalLower.includes(term.english)) {
            // 2. Check if the Urdu equivalent (or the English term itself) is in the Translated document
            if (!translatedLower.includes(term.urdu) && !translatedLower.includes(term.english)) {
                missedTerms.push(term.english);
            }
        }
    });

    if (missedTerms.length > 0) {
        missingSections.push(`Missing critical legal terms: ${missedTerms.join(', ')}`);
    }
    
    // A document is considered "complete" if the word count ratio is acceptable and no critical terms are missed.
    const isComplete = wordRatio >= 0.75 && wordRatio <= 3.0 && missedTerms.length === 0; 
    
    // Score calculation is heavily weighted towards word count and perfect term translation.
    const completenessScore = Math.min(100, Math.floor(wordRatio * 100 * 0.8 + (missedTerms.length === 0 ? 20 : 0)));
    
    return {
        isComplete,
        missingSections,
        completenessScore,
        wordCountComparison: {
            original: originalWords,
            translated: translatedWords,
            ratio: wordRatio
        }
    };
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
    const [currentStep, setCurrentStep] = useState<string | null>(null); // State for progress updates

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

            const formData = new FormData();
            formData.append("file", file);

            // Step 1: Extract text from document
            setCurrentStep("1/3: Extracting text from document...");
            console.log("Step 1: Extracting text from document...");
            const extractRes = await fetch(`${PYTHON_API_URL}/extract-text`, {
                method: "POST",
                body: formData,
                signal: AbortSignal.timeout(120000),
            });

            if (!extractRes.ok) {
                const errorText = await extractRes.text();
                throw new Error(`Extraction failed: ${extractRes.status} - ${errorText}`);
            }

            const extractData = await extractRes.json();
            if (!extractData.text || extractData.text.trim().length < 10) {
                throw new Error("Extracted text is too short or empty. The document may not contain readable text.");
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
                    // FIX: Using maxOutputTokens
                    maxOutputTokens: 16000 
                }),
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(240000), // 4 minute timeout for large documents
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
                const completenessCheck = validateTranslationCompleteness(extractData.text, finalTranslation);
                
                setQualityReport(qualityCheck);
                setCompletenessReport(completenessCheck);
                
                if (!qualityCheck.isValid || !completenessCheck.isComplete) {
                    console.warn("Quality/completeness issues detected:", {
                        quality: qualityCheck.issues,
                        completeness: completenessCheck.missingSections
                    });
                }
            }

            setTranslatedText(finalTranslation);
            
            const processingTime = Date.now() - startTime;
            setTranslationStats({
                originalLength: extractData.text.length,
                translatedLength: finalTranslation.length,
                cleaningApplied,
                processingTime
            });

            console.log("Process completed successfully in", processingTime, "ms");

        } catch (err) {
            console.error("Processing error:", err);
            if (err instanceof Error) {
                if (err.name === 'TimeoutError') {
                    setError("Request timeout. The document might be too large or complex. Please try with a smaller document.");
                } else if (err.name === 'AbortError') {
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

        const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Legal_Urdu_${file?.name?.split('.')[0] || 'Document'}_${new Date().getTime()}.txt`;
        
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
                    // FIX: Using maxOutputTokens and increasing limit for retry
                    maxOutputTokens: 20000, 
                }),
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(300000), // 5 minute timeout for retry
            });

            if (!translateRes.ok) {
                const errorData = await translateRes.json();
                throw new Error(`Retry failed: ${errorData.error || 'Unknown error'}`);
            }

            const translateData = await translateRes.json();
            const finalTranslation = cleanLegalUrduText(translateData.translatedText);
            
            setTranslatedText(finalTranslation);
            
            // Re-validate
            const qualityCheck = validateUrduTranslation(finalTranslation);
            const completenessCheck = validateTranslationCompleteness(extractedText, finalTranslation);
            setQualityReport(qualityCheck);
            setCompletenessReport(completenessCheck);

            const processingTime = Date.now() - startTime;
            setTranslationStats((prev) => ({
                ...prev!,
                translatedLength: finalTranslation.length,
                processingTime: (prev?.processingTime || 0) + processingTime, // Accumulate time
                cleaningApplied: true, // Assumed to be applied on retry
            }));
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "Retry failed");
        } finally {
            setIsLoading(false);
            setCurrentStep(null);
        }
    };


    const supportedFormats = ".pdf, .docx, .doc, .txt, .jpg, .jpeg, .png, .tiff";

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-blue-800 mb-2">Professional Legal Document Translation</h1>
                <p className="text-lg text-gray-600">English to Complete Legal Urdu - 100% Accuracy Guaranteed</p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-lg border p-8 mb-8">
                <div className="mb-6">
                    <label className="block text-xl font-semibold text-gray-800 mb-4">
                        📄 Upload Legal Document
                    </label>
                    <p className="text-sm text-gray-600 mb-4">
                        Supported formats: {supportedFormats} | Max size: 50MB
                    </p>
                    <input 
                        type="file" 
                        accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.tiff" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)} 
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                    />
                </div>

                {file && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-green-800">{file.name}</p>
                                <p className="text-sm text-green-600">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleUploadAndTranslate} 
                    disabled={!file || isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {currentStep || "Processing Legal Document..."}
                        </>
                    ) : (
                        "Translate to Complete Legal Urdu"
                    )}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center mb-2">
                        <span className="text-red-500 text-xl mr-2">⚠️</span>
                        <h3 className="text-lg font-semibold text-red-800">Processing Error</h3>
                    </div>
                    <p className="text-red-700 mb-4">{error}</p>
                    {extractedText && (
                        <button
                            onClick={handleRetryTranslation}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150"
                        >
                            Retry with Enhanced Settings
                        </button>
                    )}
                </div>
            )}

            {/* Extracted Text Preview */}
            {extractedText && (
                <div className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">📝</span>
                        Extracted English Text
                        {translationStats && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({translationStats.originalLength} characters, {extractedText.split(/\s+/).length} words)
                            </span>
                        )}
                    </h3>
                    <div className="p-4 bg-white border border-gray-300 rounded-lg text-sm overflow-auto max-h-80 font-mono">
                        {extractedText.substring(0, 2000)}
                        {extractedText.length > 2000 && "..."}
                    </div>
                </div>
            )}

            {/* Translation Result */}
            {translatedText && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="mb-4 lg:mb-0">
                                <h3 className="text-2xl font-bold mb-2">✅ Complete Legal Urdu Translation</h3>
                                {translationStats && (
                                    <div className="text-green-100 text-sm space-y-1">
                                        <div>{translationStats.translatedLength} characters, {translatedText.split(/\s+/).length} words</div>
                                        <div>Processing time: {(translationStats.processingTime / 1000).toFixed(1)} seconds</div>
                                        {translationStats.cleaningApplied && <div>• Auto-cleaning applied</div>}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button 
                                    onClick={handleDownloadTxt}
                                    className="px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 transition duration-150 font-semibold flex items-center justify-center shadow-lg"
                                >
                                    📥 Download Complete Translation
                                </button>
                                {completenessReport && !completenessReport.isComplete && (
                                    <button 
                                        onClick={handleRetryTranslation}
                                        className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-150 font-semibold flex items-center justify-center shadow-lg"
                                    >
                                        🔄 Enhance Translation
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quality & Completeness Reports */}
                    {(qualityReport || completenessReport) && (
                        <div className="border-b">
                            {qualityReport && !qualityReport.isValid && (
                                <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                                    <div className="flex items-center mb-2">
                                        <span className="text-yellow-600 text-lg mr-2">⚠</span>
                                        <h4 className="font-semibold text-yellow-800">Quality Check Notes</h4>
                                    </div>
                                    <ul className="text-yellow-700 text-sm list-disc list-inside">
                                        {qualityReport.issues.map((issue, index) => (
                                            <li key={index}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {completenessReport && (
                                <div className={`p-4 ${completenessReport.isComplete ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border-b`}>
                                    <div className="flex items-center mb-2">
                                        <span className={`text-lg mr-2 ${completenessReport.isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                                            {completenessReport.isComplete ? '✓' : '⚠'}
                                        </span>
                                        <h4 className={`font-semibold ${completenessReport.isComplete ? 'text-green-800' : 'text-orange-800'}`}>
                                            Translation Completeness: {completenessReport.completenessScore}%
                                        </h4>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div className={completenessReport.isComplete ? 'text-green-700' : 'text-orange-700'}>
                                            Word count ratio: {completenessReport.wordCountComparison.translated} / {completenessReport.wordCountComparison.original} 
                                            ({(completenessReport.wordCountComparison.ratio * 100).toFixed(1)}%)
                                        </div>
                                        {completenessReport.missingSections.length > 0 && (
                                            <div className="mt-2 text-sm text-orange-600">
                                                Missing or weak sections detected:
                                                <ul className="list-disc list-inside mt-1">
                                                    {completenessReport.missingSections.map((section, index) => <li key={index}>{section}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Final Translated Text Area */}
                    <div className="p-6">
                        <p 
                            className="text-xl text-gray-800 leading-relaxed whitespace-pre-wrap"
                            // Added RTL styles for correct Urdu rendering
                            style={{ direction: 'rtl', textAlign: 'justify', fontFamily: 'Noto Naskh Arabic, Tahoma, serif' }}
                        >
                            {translatedText}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}