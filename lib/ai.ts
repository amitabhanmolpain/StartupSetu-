import Groq from "groq-sdk";

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

export interface StartupApplicationData {
  startupName: string;
  problemStatement: string;
  solution: string;
  technology: string;
  previousWork: string;
  pricing: string;
  team: string;
  impact: string;
}

export interface EvaluationResult {
  overallScore: number;
  recommendation: "SHORTLIST" | "REVIEW" | "REJECT";
  problemFit: number;
  technicalFeasibility: number;
  trackRecord: number;
  innovation: number;
  costEffectiveness: number;
  riskScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  reasoning: string;
}

export async function evaluateStartupApplication(data: StartupApplicationData): Promise<EvaluationResult> {
  const groq = getGroqClient();

  const prompt = `You are an expert startup evaluator for the government.
Evaluate the following startup application carefully and objectively.
Provide individual scores (0-100) for these criteria:
- problemFit
- technicalFeasibility
- trackRecord
- innovation
- costEffectiveness
- riskScore (where 100 means extreme risk, 0 means no risk)

Startup Application Details:
- Startup Name: ${data.startupName}
- Problem Statement: ${data.problemStatement}
- Solution: ${data.solution}
- Technology: ${data.technology}
- Previous Work/Track Record: ${data.previousWork}
- Pricing/Cost: ${data.pricing}
- Team: ${data.team}
- Impact: ${data.impact}

Provide the result ONLY as a JSON object matching this exact structure:
{
  "problemFit": number,
  "technicalFeasibility": number,
  "trackRecord": number,
  "innovation": number,
  "costEffectiveness": number,
  "riskScore": number,
  "summary": string,
  "strengths": string[],
  "risks": string[],
  "reasoning": string
}
`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a highly capable evaluation AI. Always respond in pure JSON matching the requested structure.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "qwen/qwen3.8-27b",
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const responseContent = completion.choices[0]?.message?.content || "{}";
  
  try {
    const rawData = JSON.parse(responseContent);

    // Calculate deterministic overallScore
    const overallScore = Math.round(
      (rawData.problemFit * 0.30) +
      (rawData.technicalFeasibility * 0.20) +
      (rawData.trackRecord * 0.20) +
      (rawData.innovation * 0.10) +
      (rawData.costEffectiveness * 0.10) +
      ((100 - rawData.riskScore) * 0.10)
    );

    // Calculate deterministic recommendation
    let recommendation: "SHORTLIST" | "REVIEW" | "REJECT" = "REJECT";
    if (overallScore >= 80) {
      recommendation = "SHORTLIST";
    } else if (overallScore >= 60) {
      recommendation = "REVIEW";
    }

    const parsed: EvaluationResult = {
      overallScore,
      recommendation,
      problemFit: rawData.problemFit,
      technicalFeasibility: rawData.technicalFeasibility,
      trackRecord: rawData.trackRecord,
      innovation: rawData.innovation,
      costEffectiveness: rawData.costEffectiveness,
      riskScore: rawData.riskScore,
      summary: rawData.summary,
      strengths: rawData.strengths,
      risks: rawData.risks,
      reasoning: rawData.reasoning,
    };

    return parsed;
  } catch (error) {
    throw new Error("Failed to parse Groq response as JSON");
  }
}
