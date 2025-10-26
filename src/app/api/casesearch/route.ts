import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const { text } = await generateText({
      model: groq("llama-3.2-70b-text"),
      system: `
        You are an expert Pakistani Legal Research Assistant.
        Respond with structured legal research including:
        - Case Law summaries
        - Statutory analysis
        - Legal principles
        - Recommendations.
        Always use formal legal English.
      `,
      prompt: `Research the following legal issue: ${prompt}`,
      temperature: 0.4,
    });

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("❌ CaseSearch API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform legal research. Please try again later." },
      { status: 500 }
    );
  }
}
