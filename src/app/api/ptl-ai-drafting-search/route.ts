import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

// Run this API on Vercel Edge Runtime for low latency
export const runtime = "edge";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

interface RequestBody {
  prompt?: string;
  intent?: "drafting" | "research";
  language?: string;
  tone?: string;
}

/**
 * Builds a system prompt for the Groq model
 * tailored to Pakistani law and polite off-topic handling.
 */
function buildSystemPrompt(intent: "drafting" | "research", tone: string, language: string): string {
  const lines: string[] = [
    "You are PTL Legal Assistant — a professional AI specializing in Pakistani Law, Drafting, and Legal Research.",
    "You must strictly prioritize Pakistan’s legal context, statutes, and procedures.",
    "If a user asks something unrelated to Pakistani law, respond politely that it's outside the PTL legal domain.",
    "Focus on authoritative sources such as PPC, CrPC, CPC, QSO (Qanun-e-Shahadat), Family Laws, Special Acts, and Constitutional provisions.",
    "Provide factual, professional, and court-ready responses.",
    "",
    "For DRAFTING tasks:",
    "- Generate fully formatted legal drafts (Title, Date, Parties, Recitals, Clauses, Prayer, Signature).",
    "- Maintain professional tone, legal formatting, and structure.",
    "- Use clear headings, spacing, and formal wording suitable for legal submissions.",
    "",
    "For RESEARCH tasks:",
    "- List relevant legal sections, short explanations, and references to leading case law (PLD, SCMR, MLD, YLR, etc.).",
    "- Where available, include Tavily references with summaries or direct quotes.",
    "- Summarize laws accurately without adding fictitious citations.",
    "",
    "If asked to translate or explain in Urdu, respond in formal Urdu legal language.",
    "Otherwise, default to formal English used in Pakistani legal writing.",
    "",
    `Tone: ${tone}.`,
  ];

  if (language.toLowerCase() === "urdu") {
    lines.push("Produce the response in formal Urdu with accurate legal terminology.");
  } else {
    lines.push("Respond in clear, professional English following Pakistani legal drafting conventions.");
  }

  return lines.join("\n");
}

/**
 * Handles POST requests from PTL AI Drafting & Search tool.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as RequestBody;
    const prompt = (body.prompt ?? "").trim();
    const intent: "drafting" | "research" = body.intent === "drafting" ? "drafting" : "research";
    const tone = body.tone ?? "formal";
    const language = body.language ?? "english";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    // -------------------------------
    // Step 1: Fetch legal references from Tavily
    // -------------------------------
    let referencesText = "No Tavily results found.";
    try {
      const tavilyResp = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query: `${prompt} Pakistan law references`,
          max_results: 5,
        }),
      });

      if (tavilyResp.ok) {
        const tavilyData = (await tavilyResp.json()) as TavilyResponse;
        if (tavilyData.results && tavilyData.results.length > 0) {
          referencesText = tavilyData.results
            .map(
              (r, i) =>
                `**${i + 1}. [${r.title}](${r.url})** — ${r.content
                  .replace(/\s+/g, " ")
                  .slice(0, 250)}...`
            )
            .join("\n");
        }
      }
    } catch (tavilyError) {
      // Don't block AI generation if Tavily fails
      // eslint-disable-next-line no-console
      console.warn("Tavily fetch warning:", tavilyError);
    }

    // -------------------------------
    // Step 2: Build system prompt
    // -------------------------------
    const systemPrompt = buildSystemPrompt(intent, tone, language);

    // -------------------------------
    // Step 3: Build the user-level instruction
    // -------------------------------
    const aiPrompt = `
User Query:
"${prompt}"

Intent: ${intent}

Tavily References (if any):
${referencesText}

Instructions:
- Follow Pakistani law strictly.
- For drafting: create professional legal drafts with all formal sections.
- For research: list sections, relevant acts, and important judgments.
- For unrelated questions: politely mention that it's outside PTL's domain.
    `.trim();

    // -------------------------------
    // Step 4: Generate AI response
    // -------------------------------
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: aiPrompt,
      temperature: intent === "research" ? 0.3 : 0.6,
      maxOutputTokens: 1500, // ✅ correct property name
    });

    const finalContent = `
### 🧾 PTL • ${intent === "drafting" ? "Draft" : "Legal Research"}

${text}

---

**📚 Tavily References:**
${referencesText}
`;

    return NextResponse.json({ content: finalContent });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("PTL-AI Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error occurred during PTL AI processing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
