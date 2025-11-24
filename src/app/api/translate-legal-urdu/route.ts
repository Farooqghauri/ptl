import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

// --- Configuration Constants ---
const DEFAULT_MAX_TOKENS = 16000;
const SAFE_MAX_TOKENS = 24000; // Cap for the Groq output tokens
const MAX_INPUT_CHARACTERS = 150000;

// Rate limiting storage (in production, use Redis or database)
// WARNING: This map is cleared every time the serverless function spins down.
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // Basic rate limiting: 5 seconds cooldown per IP
    const lastRequest = rateLimitMap.get(clientIP) || 0;
    if (now - lastRequest < 5000) {
        return NextResponse.json({ 
            error: 'Rate limit exceeded. Please wait 5 seconds between requests.' 
        }, { status: 429 });
    }
    rateLimitMap.set(clientIP, now);

    try {
        const { text: englishText, fileName, fileType, maxOutputTokens } = await req.json();

        if (!englishText) {
            return NextResponse.json({ 
                error: 'No English text provided for translation.' 
            }, { status: 400 });
        }

        // Validate input length against hard limit
        if (englishText.length > MAX_INPUT_CHARACTERS) {
            return NextResponse.json({ 
                error: `Input text is too long. Maximum ${MAX_INPUT_CHARACTERS.toLocaleString()} characters allowed.` 
            }, { status: 400 });
        }

        // --- Token Configuration ---
        // Prioritize client's request (e.g., 16000 or 20000 from retry), but cap it at the safe maximum
        const calculatedMaxTokens = Math.min(
            maxOutputTokens || DEFAULT_MAX_TOKENS,
            SAFE_MAX_TOKENS
        );
        
        // --- System Prompt for COMPLETE legal translation ---
        const systemPrompt = `You are an expert Pakistani Supreme Court Translator AI. Your mission is to provide COMPLETE, WORD-FOR-WORD translation of legal documents from English to formal Pakistani Legal Urdu.

CRITICAL MANDATE: TRANSLATE EVERY SINGLE WORD AND SENTENCE

ESSENTIAL TRANSLATION PRINCIPLES:

1. COMPLETENESS REQUIREMENT:
    - Translate 100% of the original text without omissions
    - Preserve every legal term, citation, and reference
    - Maintain all procedural details and legal arguments
    - Include all witness numbers, section numbers, and legal codes

2. LEGAL TERMINOLOGY MAPPING (MUST USE THESE EXACT TERMS):
    - "Supreme Court" → "سپریم کورٹ"
    - "High Court" → "ہائی کورٹ" 
    - "Trial Court" → "ٹرائل کورٹ"
    - "Judgment" → "فیصلہ"
    - "Appeal" → "اپیل"
    - "Petition" → "درخواست"
    - "Appellant" → "اپیل کنندہ"
    - "Respondent" → "جواب دہ"
    - "Complainant" → "مدعی"
    - "Accused" → "ملزم"
    - "Witness" → "گواہ"
    - "PW-1" → "پی ڈبلیو-1" (PRESERVE WITNESS NUMBERS)
    - "DW-1" → "ڈی ڈبلیو-1" (PRESERVE WITNESS NUMBERS)
    - "Section" → "سیکشن"
    - "Cr.P.C." → "ضابطہ فوجداری" // Corrected: Code of Criminal Procedure
    - "PPC" → "پینل کوڈ"
    - "FIR" → "ایف آئی آر"
    - "FSL" → "ایف ایس ایل"
    - "Investigation" → "تحقیقات"
    - "Prosecution" → "استغاثہ"
    - "Defense" → "دفاع" // Corrected: Defense/Advocate
    - "Evidence" → "ثبوت"
    - "Confession" → "اعتراف"
    - "Acquitted" → "بری"
    - "Convicted" → "مجرم قرار دیا"
    - "Sentence" → "سزا"
    - "Bail" → "ضمانت"
    - "Custody" → "تحویل"

3. STRUCTURAL INTEGRITY:
    - Preserve ALL headings, numbering, and formatting
    - Maintain EXACT paragraph structure
    - Keep ALL dates, numbers, and statistical data unchanged
    - Retain ALL legal citations and references exactly
    - Translate EVERY witness statement completely

4. LEGAL PHRASE EQUIVALENTS (CRITICAL):
    - "It is ordered that" → "حکم دیا جاتا ہے کہ"
    - "The court finds that" → "عدالت یہ پاتی ہے کہ"
    - "Beyond reasonable doubt" → "معقول شک سے بالاتر"
    - "Benefit of doubt" → "شک کا فائدہ"
    - "Prima facie case" → "بظاہر کیس"
    - "Ex parte" → "یک طرفہ"
    - "In camera" → "خفیہ"
    - "In lieu of" → "کے بدلے میں"
    - "Per incuriam" → "غفلت سے"
    - "Stare decisis" → "سابقہ فیصلوں پر عمل"

5. QUALITY ASSURANCE CHECKLIST:
    ✅ Every English word has Urdu equivalent
    ✅ All legal terms correctly mapped
    ✅ All numbers and dates preserved
    ✅ All witness references maintained
    ✅ All section numbers included
    ✅ Complete sentence structure maintained
    ✅ No summarization or omission
    ✅ Professional legal tone throughout

6. DOCUMENT TYPE SPECIFICS:
    - For judgments: Translate complete legal reasoning
    - For witness statements: Translate every testimony word
    - For evidence: Translate all forensic details
    - For legal arguments: Translate complete submissions
    - For orders: Translate every directive completely

TRANSLATION DIRECTIVE: 
You MUST translate the entire document completely, including every legal citation, witness number, section reference, and procedural detail. Do not summarize, omit, or skip any portion of the text.

DOCUMENT TO TRANSLATE COMPLETELY:`;

        // Enhanced prompt with document context
        const enhancedPrompt = `LEGAL DOCUMENT TRANSLATION - COMPLETE AND COMPREHENSIVE

Document: ${fileName || 'Legal Document'}
Type: ${fileType || 'Legal Judgment'}
Content Length: ${englishText.length} characters
Words: ${englishText.split(/\s+/).length} words
Required Completeness: 100%

SPECIAL INSTRUCTIONS:
- Translate EVERY single word and sentence
- Preserve ALL legal terminology exactly
- Maintain ALL numerical references and dates
- Include ALL witness numbers and section references
- Ensure NO summarization or omission

DOCUMENT CONTENT TO TRANSLATE COMPLETELY:
${englishText}

IMPORTANT: This is a LEGAL DOCUMENT. Every word matters. Translate COMPLETELY without any omissions.`;

        // The core fix: use maxOutputTokens
        const response = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: enhancedPrompt,
            // ⭐️ FIX: Use the correct property for output token limit
            maxOutputTokens: calculatedMaxTokens, 
            temperature: 0.05,
        });

        // Enhanced output validation (Urdu is more verbose, setting a floor of 70% word count ratio)
        const englishWordCount = englishText.split(/\s+/).length;
        const translatedWordCount = response.text.split(/\s+/).length;
        const wordCountRatio = translatedWordCount / englishWordCount;
        
        if (!response.text || wordCountRatio < 0.70) { 
            console.warn('Translation may be incomplete. Original Word Count:', englishWordCount, 'Translated Word Count:', translatedWordCount);
            
            throw new Error('Translation appears incomplete. The output word count is significantly lower than expected. The token limit may have been reached or the model may have truncated the output.');
        }

        // Calculate a basic completeness score
        const completenessScore = Math.min(100, Math.floor(wordCountRatio * 100 * 0.8 + (wordCountRatio >= 0.70 ? 20 : 0)));

        return NextResponse.json({ 
            translatedText: response.text,
            originalLength: englishText.length,
            translatedLength: response.text.length,
            completenessScore: completenessScore,
            timestamp: new Date().toISOString(),
            wordCount: {
                original: englishWordCount,
                translated: translatedWordCount
            },
            tokensUsed: calculatedMaxTokens
        });

    } catch (error) {
        console.error('Legal Translation API Error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            clientIP
        });

        let errorMessage = 'Translation service temporarily unavailable.';
        let statusCode = 500;

        if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase();
            
            if (errorMsg.includes('rate limit')) {
                errorMessage = 'Service usage limit exceeded. Please try again later.';
                statusCode = 429;
            } else if (errorMsg.includes('incomplete') || errorMsg.includes('truncated')) {
                errorMessage = 'Translation appears incomplete or truncated. Please click "Enhance Translation" to retry with a higher token limit, or try a smaller document.';
                statusCode = 422;
            } else if (errorMsg.includes('timeout')) {
                errorMessage = 'Translation timeout. The document might be too large or Groq is busy. Please retry.';
                statusCode = 408;
            } else if (errorMsg.includes('context window')) {
                errorMessage = 'Document too long for the AI model. Please split the document into smaller parts.';
                statusCode = 413;
            }
        }

        return NextResponse.json({ 
            error: errorMessage,
            reference: `ERR_${Date.now()}`,
            suggestion: `Please ensure your document is under ${MAX_INPUT_CHARACTERS.toLocaleString()} characters and use the "Enhance Translation" feature if the result is incomplete.`
        }, { status: statusCode });
    }
}