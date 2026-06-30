import { NextRequest, NextResponse } from "next/server";
import { runWithModel } from "@/lib/agents";
import { getChutesAccessToken } from "@/lib/serverAuth";

// Three different models = genuinely independent perspectives
const MODELS = [
  { id: "Qwen/Qwen3-32B-TEE",           label: "Qwen3 32B",   pool: "TEE", color: "#7c5cfc" },
  { id: "google/gemma-4-31B-turbo-TEE",  label: "Gemma 4 31B", pool: "TEE", color: "#22d3a0" },
  { id: "deepseek-ai/DeepSeek-V3.2-TEE", label: "DeepSeek V3", pool: "TEE", color: "#f59e0b" },
];

const HYPOTHESIS_SYSTEMS: Record<string, string> = {
  error: `You are a senior debugging specialist conducting an independent root cause analysis.
Analyze the error and provide your hypothesis. Be direct, specific, and confident.

Respond ONLY with valid JSON:
{
  "hypothesis": "Your specific theory about the root cause — 2-3 sentences max",
  "confidence": a number 55-97 representing your confidence percentage,
  "rootCause": "The single most specific root cause in 10 words or less",
  "evidence": ["2-3 specific pieces of evidence from the log that support your theory"],
  "suspectLocation": "file:line or function name where the bug lives",
  "quickVerification": "one specific thing the developer can check right now to confirm or deny your theory"
}`,
  code_review: `You are a senior code reviewer conducting an independent security and quality audit.
Analyze this code and identify the most critical issue you find. Be direct and specific.

Respond ONLY with valid JSON:
{
  "hypothesis": "The most critical issue you found — what it is and why it matters, 2-3 sentences",
  "confidence": a number 55-97 representing how certain you are this is a real issue,
  "rootCause": "The specific issue category in 10 words or less (e.g. SQL injection, missing null check)",
  "evidence": ["2-3 specific lines or patterns in the code that show this issue"],
  "suspectLocation": "file:line or function name with the issue",
  "quickVerification": "one specific test or check to confirm this issue exists"
}`,
};

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { rawLog, parsedError, modelIndex, recentChange, mode = "error" } = await request.json();
  if (modelIndex < 0 || modelIndex > 2) return NextResponse.json({ error: "Invalid modelIndex" }, { status: 400 });

  const model = MODELS[modelIndex];

  const userMsg = `Error to analyze:
${rawLog}

${parsedError ? `Already extracted: Error type: ${parsedError.errorType}, Severity: ${parsedError.severity}, Summary: ${parsedError.summary}` : ""}
${recentChange ? `\nRecent change before this error:\n${recentChange}` : ""}

Provide your independent hypothesis.`;

  try {
    const result = await runWithModel(
      model.id,
      HYPOTHESIS_SYSTEMS[mode] || HYPOTHESIS_SYSTEMS.error,
      userMsg,
      accessToken,
      0.4
    );

    let parsed;
    try {
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/({[\s\S]*})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result);
    } catch {
      parsed = { hypothesis: result.slice(0, 300), confidence: 70, rootCause: "Analysis failed to parse", evidence: [], suspectLocation: "unknown", quickVerification: "Check the error manually" };
    }

    return NextResponse.json({
      hypothesis: parsed,
      model: { ...model, modelIndex },
    });
  } catch (error) {
    return NextResponse.json({ error: "Hypothesis failed", details: String(error) }, { status: 500 });
  }
}
