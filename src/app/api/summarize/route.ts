import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface SummarizeRequest {
  text: string;
}

export async function POST(req: Request) {
  try {
    const { text }: SummarizeRequest = await req.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please upload a longer or valid document." },
        { status: 400 }
      );
    }

    const systemPrompt = {
      role: "system",
      content: `You are PTL, an AI legal assistant specialized in Pakistani law.
Only summarize, translate, or analyze legal documents relevant to Pakistan’s legal system.
If the text is unrelated to law, respond: "I can only help with legal documents related to Pakistani law."`
    };

    const userPrompt = {
      role: "user",
      content: `
Summarize the following document in two languages (English and Urdu) and provide a legal analysis based on Pakistani laws and case principles.

--- Document Start ---
${text}
--- Document End ---
`
    };

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [systemPrompt, userPrompt],
      }),
    });

    const raw = await response.text();
    if (!response.ok) return NextResponse.json({ error: raw }, { status: response.status });

    const data = JSON.parse(raw);
    const content = data?.choices?.[0]?.message?.content as string;

    // Expect content format:
    // ENGLISH SUMMARY:
    // ...
    // URDU SUMMARY:
    // ...
    // LEGAL ANALYSIS:
    // ...
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
