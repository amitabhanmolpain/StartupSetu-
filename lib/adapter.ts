import type { Evaluation, ScoreItem } from "@/mock/types";

export function adaptLiveEval(liveEval: any, appId: string): Evaluation {
  return {
    applicationId: appId,
    overall: liveEval.overallScore,
    confidence: 85, // AI confidence is generally high
    risk: liveEval.riskScore > 60 ? "High" : liveEval.riskScore > 30 ? "Medium" : "Low",
    breakdown: [
      {
        key: "fit",
        label: "Problem Fit",
        score: liveEval.problemFit,
        confidence: 90,
        reason: liveEval.reasoning,
        evidence: ["Submitted Application"],
      },
      {
        key: "feasibility",
        label: "Feasibility",
        score: liveEval.technicalFeasibility,
        confidence: 85,
        reason: "Derived from technology and solution description.",
        evidence: ["Application tech specs"],
      },
      {
        key: "track",
        label: "Track Record",
        score: liveEval.trackRecord,
        confidence: 80,
        reason: "Derived from previous work section.",
        evidence: ["Previous work description"],
      },
      {
        key: "scalability",
        label: "Innovation",
        score: liveEval.innovation,
        confidence: 75,
        reason: "Derived from innovation criteria.",
        evidence: ["Solution approach"],
      },
      {
        key: "cost",
        label: "Cost Effectiveness",
        score: liveEval.costEffectiveness,
        confidence: 85,
        reason: "Derived from pricing and impact.",
        evidence: ["Financials"],
      }
    ],
    reasoning: liveEval.summary,
    keyReason: `Recommendation: ${liveEval.recommendation}. ${liveEval.strengths[0] || ""}`,
    claims: liveEval.strengths.map((s: string) => ({ text: s, status: "Verified", source: "AI Evaluation" })),
    riskFlags: liveEval.risks.map((r: string) => ({ level: "Medium", text: r })),
    challenger: [],
    evidenceUsed: ["Startup Form"],
  };
}
