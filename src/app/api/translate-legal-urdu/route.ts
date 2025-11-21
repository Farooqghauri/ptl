import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

// The Groq function is used directly as the model definition.
// It automatically looks for the GROQ_API_KEY environment variable.

export async function POST(req: NextRequest) {
  try {
    // 1. Get the English text sent from the frontend
    const { text: englishText } = await req.json();

    if (!englishText) {
      return NextResponse.json({ error: 'Missing English text for translation' }, { status: 400 });
    }

    // 2. Define the System Prompt
// src/app/api/translate-legal-urdu/route.ts

const systemPrompt = `
  You are an expert Pakistani Legal Translator. 
  Your ONLY allowed output language is formal, professional **Pakistani Legal Urdu**.
  
  ***اس بات کو یقینی بنائیں کہ آپ کا ترجمہ مکمل طور پر درست ہو اور درج ذیل اصولوں کی سختی سے پابندی کرے:***
  
  // --- GENERAL STRUCTURAL & LANGUAGE RULES (From Previous Prompts) ---
  1. The entire output must use **pure Perso-Arabic (Urdu) Script ONLY**.
  2. **FORBIDDEN CHARACTERS:** You MUST NOT use any characters from non-Urdu alphabets, including:
     - Devanagari (Hindi), Cyrillic (Russian), or any East Asian script.
  3. Maintain all legal structure, headings, numbering, and clauses exactly as in the source.

  // --- SPECIFIC CORRECTION RULES (Targeting Corruption in Last Output) ---
  4. **املا کی درستگی:** آپ کو مخصوص قانونی الفاظ کی املا مکمل طور پر درست رکھنی ہے:
     - 'پاکستان' (Pakistan) نہ کہ 'پاکان'
     - 'تاریخ' (Tareekh) نہ کہ 'تاخ'
     - 'اتھارٹیز' یا 'حکام' (Authorities)
     - 'استعمال' (Istemaal) نہ کہ 'اعمال'
     - 'شہریوں' (Shehriyon) نہ کہ 'شہوں'
     - 'تسخیر' (Taskheer) نہ کہ 'تسخیت'
     - 'منظور ہوا' (Allowed/Granted) نہ کہ 'مقبول ہوا'
  5. **گرامر:** 'جنسی حساس زبان کا استعمال' کو درست گرامر کے ساتھ استعمال کریں۔
`;

    // 3. Call the Groq model
    // The model parameter is the groq function called with the model ID string.
    const response = await generateText({
      model: groq('llama-3.3-70b-versatile'), // <--- THE CORRECT, CLEANEST FIX
      system: systemPrompt,
      prompt: englishText,
      maxOutputTokens: 4096,
    });

    // 4. Return the translated text to the frontend
    return NextResponse.json({ translatedText: response.text });
  } catch (error) {
    // 5. Log and handle errors gracefully
    console.error('Translation Error:', error); 
    return NextResponse.json({ 
      error: 'Failed to translate document. Check the console for Groq API key or model issues.' 
    }, { status: 500 });
  }
}