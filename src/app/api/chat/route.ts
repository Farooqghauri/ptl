import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const runtime = "edge"; // For faster response times

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1]?.content || "";

    // ✅ Use the updated, currently supported Groq model
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `
You are an expert Pakistani legal AI assistant.
Always respond with complete, professional legal drafts and formatted documents.
If the user asks for a contract, notice, agreement, or affidavit, include:
- Title
- Date
- Party Names
- Clauses
- Signature Section.
Write in clear, formal legal English used in Pakistan.
      `,
      prompt: lastMessage,
    });

    return NextResponse.json({ content: text });
  } catch (error) {
    // ✅ Strongly typed error handling (no "any")
    console.error("Chat API error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error occurred during AI generation.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
