import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, documentContext, chatHistory } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "API key not configured. Add GROQ_API_KEY=gsk_xxx to .env.local. Get one free at console.groq.com",
        },
        { status: 500 },
      );
    }

    const extractedText = documentContext.extractedText?.trim() || "";

    console.log("Chat API - extractedText length:", extractedText.length);
    console.log(
      "Chat API - extractedText preview:",
      extractedText.slice(0, 200) || "EMPTY",
    );

    // Increase limit to 6000 chars so full short PDFs aren't truncated
    const MAX_TEXT = 6000;
    const truncatedText =
      extractedText.length > MAX_TEXT
        ? extractedText.slice(0, MAX_TEXT) + "\n[Content truncated for length]"
        : extractedText;

    const hasExtractedText = truncatedText.trim().length > 0;

    const systemPrompt = hasExtractedText
      ? `You are an AI document analysis assistant. You have access to the document's extracted text below. Answer ALL user questions using the document content when possible.

If the extracted text is incomplete (short OCR), do not invent missing values—say what is present and what is not.

=== DOCUMENT METADATA ===
Name: ${documentContext.name}
Status: ${documentContext.status}
Risk Level: ${documentContext.risk}
Risk Score: ${documentContext.score}/100
Details: ${documentContext.details}
Flagged Reason: ${documentContext.flaggedReason || "N/A"}

=== FULL EXTRACTED DOCUMENT TEXT ===
${truncatedText}
=== END OF DOCUMENT ===

Use the extracted text above to answer questions. If a value like a loan amount, name, income, balance, or score appears in the text, state it directly and confidently. If it is not present, say it is not found in the extracted text.`
      : `You are an AI document analysis assistant. The document text could not be extracted (possibly a scanned image PDF). Answer based on the metadata below.

Document Metadata:
- Name: ${documentContext.name}
- Status: ${documentContext.status}
- Risk Level: ${documentContext.risk}
- Risk Score: ${documentContext.score}/100
- Details: ${documentContext.details}
- Flagged Reason: ${documentContext.flaggedReason || "N/A"}

Note: The full document text is unavailable. Inform the user if they ask for specific values from the PDF.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
        .slice(0, -1) // exclude the last user message (sent separately below)
        .map((msg: { role: string; message: string }) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.message,
        })),
      { role: "user", content: message },
    ];

    console.log("Calling Groq API... Key starts with:", apiKey?.slice(0, 10));

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 700,
          temperature: 0.3, // lower temp = more factual, less hallucination
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Groq API error:", error);
      return NextResponse.json(
        { error: error.error?.message || "Groq API error" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "No response from AI.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
