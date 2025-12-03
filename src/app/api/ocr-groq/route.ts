// NOTE: Install groq-sdk first: npm install groq-sdk

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "File missing" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(bytes))
    );

    // Call Groq API directly
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Extract ALL text from this document exactly as it appears. Include ALL legal terms, case numbers, dates, and formatting. Return ONLY the extracted text with no commentary." 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        length: extractedText.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Groq OCR Error:", error);
    return new Response(
      JSON.stringify({ 
        error: `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}