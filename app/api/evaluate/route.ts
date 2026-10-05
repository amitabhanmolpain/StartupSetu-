import { NextResponse } from "next/server";
import { evaluateStartupApplication } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    const requiredFields = [
      "startupName",
      "problemStatement",
      "solution",
      "technology",
      "previousWork",
      "pricing",
      "team",
      "impact"
    ];

    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== "string") {
        return NextResponse.json(
          { error: `Missing or invalid required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const evaluation = await evaluateStartupApplication(body);

    return NextResponse.json(evaluation, { status: 200 });

  } catch (error: any) {
    console.error("Evaluation API Error:", error);
    
    // Safely handle errors without exposing sensitive information
    if (error.message?.includes("GROQ_API_KEY is not set")) {
      return NextResponse.json(
        { error: "Internal Server Error: AI Service Configuration Missing" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process evaluation" },
      { status: 500 }
    );
  }
}
