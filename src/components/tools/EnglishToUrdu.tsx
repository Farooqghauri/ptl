"use client";

import { useState } from "react";

// --- Configuration ---
// Base URL for your local Python server (Update this for deployment!)
const PYTHON_API_URL = "/api/ptl-python-tools"; 
// ---------------------

/**
 * Utility function to clean the translated text. This function is tailored to fix:
 * 1. Semantic repetition and looping (the most critical failure in the last output).
 * 2. All known syllabic corruptions (the persistent "حقائق" syndrome).
 * 3. Final English transliteration remnants and lexical errors.
 */
const cleanUrduText = (text: string): string => {
    if (!text) return text;
    
    // Define a map for problematic character replacements
    const replacements: { [key: string]: string } = {
        
        // --- A. DEVANAGARI (HINDI) & FOREIGN CHARACTER FIXES ---
        'پ': 'پ', 'ت': 'ت', 'س': 'س', '۔': '،', '।': '،', // Hindi characters
        'чувствاسیز': 'حساس',
        'artikel': 'آرٹیکل',
        'آرٹیکلز': 'آرٹیکل',
        'ان شے': 'ان امور', // Fixing nonsense phrase
        
        // Removing stray non-Urdu characters
        '案': '', '불': '', '核': '', 'ری': '', 'لی': '', 
        'чув': '', 'ست': '', 'اسیز': 'حساس', 
        
        // --- B. CRITICAL CORRECTIONS BASED ON MODEL BEHAVIOR ---
        
        // 1. Catastrophic Semantic Looping Fix (MUST be addressed first)
        // These are long, repetitive sentences the model gets stuck on.
        'اگر عدالت نے یہ دیکھا ہے کہ سی آر پی کی سماعت کے لیے عدالت کو یہ   دی گئی ہے، تو عدالت کو یہ دیکھنا ہوگا کہ آیا سی آر پی میں کوئی غلطی یا خامی ہے یا نہیں،': ' ',
        'اگر عدالت نے یہ دیکھا ہے کہ سی آر پی کو اس کے لیے سماعت کے لیے بھیج دیا گیا ہے، تو عدالت کو یہ دیکھنا ہوگا کہ آیا سی آر پی کی سماعت کے لیے عدالت کو یہ   دی گئی ہے یا نہیں،': ' ',
        'عدالت نے اپنے فیصلے میں کہا ہے کہ سی بی کی تشکیل کے بعد، سپریم کورٹ کے ججز کو آئینی معاملحقائق سننے کی  حاصل ہے اور وہی ججز آئینی معاملحقائق کو سن سکیں گے،': ' ',
        'اس ے، عدالت نے اپنے فیصلے میں کہا ہے کہ سی آر پی کی سماع کے لیے سی بی کی تشکیل ضرو ہے اور اس کے ذریعے ہی آئینی معاملحقائق سنے جا سکیں گے، عدالت نے اپنے فیصلے میں کہا ہے کہ آئین کی ترمیم کے بعد، سی بی کی تشکیل آئین کا سولازمی حصہ ہے اور اس کے ذریعے ہی آئینی معاملحقائق سنے جا سکیں گے، عدالت نے اپنے فیصلے میں کہا ہے کہ سی بی کی تشکیل کے بعد، سپریم کورٹ کے ججز کو آئینی معاملحقائق سننے کی  حاصل ہے اور وہی ججز آئینی معاملحقائق کو سن سکیں گے،': ' ',
        'عدالت نے اپنے فیصلے میں کہا ہے کہ چونکہ سی بی کی تشکیل ضرو ہے، اس ے سی آر پی کی سماع کے لیے سی بی کی تشکیل کا انتظار کرنا پڑے گا، عدالت نے اپنے فیصلے میں کہا ہے کہ آئین کی ترمیم کے بعد، سی بی کی تشکیل آئین کا سولازمی حصہ ہے اور اس کے ذریعے ہی آئینی معاملحقائق سنے جا سکیں گے، عدالت نے اپنے فیصلے میں کہا ہے کہ سی بی کی تشکیل کے بعد، سپریم کورٹ کے ججز کو آئینی معاملحقائق سننے کی  حاصل ہے اور وہی ججز آئینی معاملحقائق کو سن سکیں گے،': ' ',
        
        // 2. Final Syllabic Injection Fixes (The 'حقائق' Syndrome)
        'سحقائقھ': 'کے ساتھ',   // Fixes persistent 'with' corruption
        'جحقائقا': 'جاتا',      // Fixes 'is read' corruption
        'تعطیلحقائق': 'تعطیلات',     // Fixes 'holidays' corruption
        'حقائقفاق': 'اتفاق',         // Fixes 'agreement' corruption
        'معاملحقائق': 'معاملات', // Fixes 'matters' corruption
        'تغیرحقائق': 'تبدیلیاں', // FIX FOR NEW VARIANT: 'changes/amendments'
        'حقائقحاد': 'اتحاد',
        'نکحقائق': 'نکات',
        
        // 3. Core Lexical, Verb, and Drop-Letter Fixes
        'سپم': 'سپریم',       // Fixes persistent Supreme Court corruption (all forms)
        'سُپم': 'سپریم',       // Fixes persistent Supreme Court corruption (all forms)
        'اعملیال': 'استعمال',    // Fixes corruption of 'exercise/use'
        'تسم': 'تسلیم',         // Fixes corruption of 'accept/concede'
        'کں،': 'سنا جائے،',      // FIX FOR CORRUPTED VERB: 'should be heard'
        'ذعے': 'ذریعے',         // Fixes 'through' corruption
        'تنقیحی': 'نظرثانی',     // Fixes incorrect legal term for Review
        'سولازمی': 'لازمی',      // FIX FOR CORRUPTED ADJECTIVE: 'essential'
        'سنوںی': 'سنی',          // FIX FOR CORRUPTED NAME PART
        'سنونینگ': 'سماعت',       // Fixes transliteration of 'hearing'
        'پٹیشنوں': 'درخواستوں',     // Fixes plural 'petitions'
        'حقائقی مواد': 'متعلقہ مواد', // FIX: Consolidated and corrected the duplicate key error
        'عدالتی مقدمحقائق': 'عدالتی نظائر', // Fixes a complex corruption for 'judicial precedents'
        'اختیار  حاصل ہے': 'اختیار حاصل ہے', // Correcting spacing after missing word
        'اختیار  حاصل ہے اور': 'اختیار حاصل ہے اور', // Correcting spacing
        
        // 4. Verb/Contextual Fixes
        'حاصل ہے،': 'اختیار حاصل ہے،', // FIX for missing authority/permission word
        'سی بی کی تشکیل ضرو ہے': 'سی بی کی تشکیل ضروری ہے', // Corrects the word 'ضرور'
        'آخ فیصلے': 'آخری فیصلے', // Fixes 'final judgment' corruption
        
        // 5. Transliteration and English Leakage Fixes
        'کنسٹیٹیوشن': 'آئین',      // Targets all variants of 'Constitution'
        'آف دی کنسٹیٹیوشن آف دی اسلامک پبلک آف پاکستان': 'اسلامی جمہوریہ پاکستان کے آئین', // Aggressive replacement of full English title
        'کونسٹیٹوشنل': 'آئینی',
        'آف دی کنسٹیٹیوشن': 'آئین',    
        'دی جڈیش': 'عدلیہ',        
        'پٹیشن': 'درخواست',        
        'پٹیشنز': 'درخواستیں',     
        'ایپ کیشن': 'درخواست',      // Targets 'application' singular
        'ایپ کیشنز': 'درخواستیں',    // Targets 'application' plural
        'بینچ': 'بینچ',          
        'مِسکِن': 'متفرقات',     
        'آئینل': 'آئینی',        
        'دی کمیٹی': 'کمیٹی',        
        'دی ایکٹ': 'ایکٹ',          
        'دی ترمیم': 'ترمیم',
        'پروسیڈر': 'طریقہ کار',
        'ٹوئنٹی سکس': 'چھبیسویں',
        'جڈیشل کمیشن': 'عدالتی کمیشن',
        
        // 6. Word/Syllable Duplication Fixes
        'درخواستستز': 'درخواستیں', // FIX FOR NEW VARIANT
        'درخواستستیں': 'درخواستیں', 
        'درخواستست': 'درخواست', 
        'جججز': 'ججز',              
        
        // 7. General Fixes
        'پاکان': 'پاکستان', 'تاخ': 'تاریخ', 'شہوں': 'شہریوں', 'تسخیت': 'تسخیر',
        'ایک ل': 'سول', 'مکس': 'مس', 'مسلہ': 'مس', 'ات': 'حقائق', 'اکثتی': 'اکثریتی', 
        'اثورتھیوں': 'اتھارٹیز', 'زائد': 'زیر سماعت', 'ذمہ دا': 'ذمہ داری', 'خودمختا': 'خودمختاری',
        'درخوا': 'درخواست', 'مقبل': 'مستقبل', 'یرے': 'اعتبار', 'جا رکھیں': 'جاری رکھیں', 
        'کے ے': 'کے لیے', 'عم': 'عملی', 'ڈ میں': 'دائرے میں', 'مقبول ہوا': 'منظور ہوا', 
        'مذمت': 'موضوع', 'منظو': 'منظور', 'عزت کا غیر قابل تغیر': 'عزت کا غیر قابل تسخیر', 
        'منز': 'وقار', 'اعمال کں': 'استعمال کریں', 'اعمال': 'استعمال',
        'منظورر کر ا گیا': 'منظور کر لیا گیا', 'م  کی تفصیل': 'مقدمہ کی تفصیل', 
        'سنو نی اٹیحاد': 'سنی اتحاد',
        'معزول پٹیشن': 'درخواست', 
    };

    let cleanedText = text;
    for (const [badChar, goodChar] of Object.entries(replacements)) {
        // Use a regular expression for global replacement (g flag)
        cleanedText = cleanedText.replace(new RegExp(badChar, 'g'), goodChar);
    }
    
    // Final aggressive cleanup: Removes any character that is NOT standard Arabic/Urdu, 
    // whitespace, newline, digit, or common punctuation.
    cleanedText = cleanedText.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFE70-\uFEFF\s\r\n\d,.:;()\-]/g, '');

    // Replace excessive newlines and leading/trailing spaces for better display
    return cleanedText.replace(/(\n){3,}/g, '\n\n').trim();
};


export default function EnglishToUrdu() {
  const [file, setFile] = useState<File | null>(null);
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

 const handleUploadAndTranslate = async () => {
  if (!file) return;

  setIsLoading(true);
  setError(null);
  setTranslatedText("");

  try {
    const formData = new FormData();
    formData.append("file", file);

    // Step 1: Try Python text extraction
    setCurrentStep("Extracting text from document...");
    const extractRes = await fetch("/api/ptl-tools/extract-text", {
      method: "POST",
      body: formData,
    });

    if (!extractRes.ok) {
      throw new Error("Text extraction failed");
    }

    const extractData = await extractRes.json();
    let extractedText = extractData.text;

    // Step 2: If OCR needed, use Groq Vision
    if (extractData.ocr_required) {
      setCurrentStep("Running AI OCR on scanned document...");
      
      const ocrRes = await fetch("/api/ocr-groq", {
        method: "POST",
        body: formData,
      });

      if (!ocrRes.ok) {
        throw new Error("OCR processing failed");
      }

      const ocrData = await ocrRes.json();
      extractedText = ocrData.text;
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error("No text could be extracted from the document");
    }

    // Step 3: Translate to Legal Urdu
    setCurrentStep("Translating to Legal Urdu...");
    const translateRes = await fetch("/api/translate-legal-urdu", {
      method: "POST",
      body: JSON.stringify({ text: extractedText }),
      headers: { "Content-Type": "application/json" },
    });

    if (!translateRes.ok) {
      throw new Error("Translation failed");
    }

    const translateData = await translateRes.json();
    
    // Step 4: Apply cleaning
    const cleanedTranslation = cleanUrduText(translateData.translatedText);
    setTranslatedText(cleanedTranslation);

  } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setIsLoading(false);
    setCurrentStep(null);
  }
};

  // 🚨 Client-side TXT download function 🚨
  const handleDownloadTxt = () => {
    if (!translatedText) return;

    // 1. Create a Blob (Binary Large Object) containing the Urdu text
    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    
    // 2. Create a temporary download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // 3. Set the file name to a .txt extension
    link.download = 'Legal_Urdu_Document.txt'; 
    
    // 4. Trigger the download and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };


  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">📜 English to Legal Urdu Translator</h2>
      
      <div className="flex flex-col gap-4 p-6 border rounded-xl shadow-lg bg-white">
        <label className="text-lg font-medium text-gray-700">Upload Legal Document (.pdf, .docx, .txt)</label>
        <input 
          type="file" 
          accept=".pdf,.docx,.txt" 
          onChange={(e) => setFile(e.target.files?.[0] || null)} 
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        />
        <button 
          onClick={handleUploadAndTranslate} 
          disabled={!file || isLoading}
          className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition duration-150"
        >
          {isLoading ? "Processing Document..." : "Translate Document to Legal Urdu"}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {translatedText && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-2xl font-semibold mb-4 text-green-700">✅ Translated Legal Urdu Result</h3>
          <pre 
            className="whitespace-pre-wrap p-6 bg-gray-50 border border-gray-300 rounded-lg text-lg text-right font-serif overflow-auto max-h-96" 
            style={{ direction: 'rtl' }}
          >
            {translatedText}
          </pre>
          <div className="mt-4 flex gap-4">
            <button 
                onClick={handleDownloadTxt}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150 font-medium"
            >
                Download
            </button>
            {/* You can add a button here for DOCX download later */}
          </div>
        </div>
      )}
    </div>
  );
}