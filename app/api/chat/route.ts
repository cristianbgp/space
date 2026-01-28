import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Groq API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      content: data.choices[0]?.message?.content || "",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
