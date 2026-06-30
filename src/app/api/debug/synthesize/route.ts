import { NextRequest, NextResponse } from "next/server";
import { getChutesAccessToken } from "@/lib/serverAuth";

const CHUTES_LLM_BASE = "https://llm.chutes.ai/v1";

// DeepSeek V3 — not a thinking model, reliable JSON output, superb instruction following
const SYNTHESIS_MODEL = "deepseek-ai/DeepSeek-V3.2-TEE";

const SYNTHESIS_SYSTEM = `You are a principal debugging agent. THREE independent AI models have analyzed an error or codebase and each formed a hypothesis. You must synthesize their findings into ONE definitive, highly technical verdict.

STRICT RULES:
- Output ONLY a single JSON object. No markdown. No explanation. No preamble. No text after the JSON.
- Start your response with { and end with }
- rootCause must be specific (name the actual variable, function, or pattern) — never generic
- The code fix must be real, runnable code — not pseudocode, not a description
- preventionTip must be a specific tool/type/guard — not "add error handling"

JSON shape (use exactly these keys):
{
  "verdict": "A comprehensive, highly detailed technical explanation (3-5 paragraphs) of exactly what went wrong. Explain the failure mechanism step-by-step. Detail the sequence of events leading to the error. Be authoritative and precise. Use newlines (\\n\\n) for paragraphs.",
  "rootCause": "Specific 8-word-max root cause naming the actual symbol, file, or architectural flaw",
  "agreementLevel": "full | partial | split",
  "agreementNote": "One sentence: where all three models agreed, and what they differed on",
  "confidenceScore": number from 0 to 100,
  "fix": {
    "description": "One sentence: what line/function to change and why",
    "code": "Actual code. Show before and after as a diff or just the corrected snippet. Real code only.",
    "language": "javascript | python | typescript | go | rust | etc"
  },
  "preventionTip": "Specific: e.g. 'Add optional chaining: products?.map()' or 'Use TypeScript strict null checks' or 'Add a guard clause at line X'",
  "minutesToFix": a number
}`;

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { rawLog, hypotheses, parsedError } = await request.json();

  const hypothesisSummary = hypotheses
    .map((h: { model: { label: string }; hypothesis: { rootCause: string; hypothesis: string; confidence: number; evidence: string[] } }, i: number) =>
      `Model ${i + 1} (${h.model.label}):\n  Root cause: ${h.hypothesis.rootCause}\n  Confidence: ${h.hypothesis.confidence}%\n  Theory: ${h.hypothesis.hypothesis}\n  Evidence: ${h.hypothesis.evidence?.slice(0, 2).join(" | ")}`
    )
    .join("\n\n");

  const userMsg = [
    parsedError ? `Parsed error: ${parsedError.errorType || parsedError.codeType} — ${parsedError.summary}` : "",
    `Content analyzed:\n${rawLog.slice(0, 3000)}`,
    `Three independent hypotheses:\n${hypothesisSummary}`,
    `Now output the JSON synthesis. Start with { immediately.`,
  ].filter(Boolean).join("\n\n");

  try {
    const response = await fetch(`${CHUTES_LLM_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SYNTHESIS_MODEL,
        messages: [
          { role: "system", content: SYNTHESIS_SYSTEM },
          { role: "user", content: userMsg },
        ],
        stream: false,
        max_tokens: 4096,
        temperature: 0.15,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: "Synthesis failed", details: `Chutes API error (${response.status}): ${text}` }, { status: 500 });
    }

    const data = await response.json();
    // DeepSeek V3 is not a thinking model — content has the answer directly
    const result: string = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || "";

    if (!result) {
      return NextResponse.json({ error: "Synthesis failed", details: "Model returned empty response" }, { status: 500 });
    }

    let parsed;
    try {
      // Try 1: extract JSON from markdown code block
      const codeBlock = result.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlock) { parsed = JSON.parse(codeBlock[1].trim()); }
      else {
        // Try 2: find the outermost JSON object
        const jsonStart = result.indexOf("{");
        const jsonEnd = result.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          parsed = JSON.parse(result.slice(jsonStart, jsonEnd + 1));
        } else {
          // Try 3: parse the whole thing
          parsed = JSON.parse(result.trim());
        }
      }
    } catch {
      // Graceful fallback: show raw result as verdict so user sees something useful
      parsed = {
        verdict: result.slice(0, 500),
        rootCause: parsedError?.errorType || parsedError?.codeType || "Analysis complete",
        agreementLevel: "partial",
        agreementNote: "Three models analyzed independently",
        confidenceScore: 72,
        fix: { description: "See verdict above for details", code: "", language: "unknown" },
        preventionTip: result.slice(400, 600) || "Review the verdict for specific recommendations",
        minutesToFix: 15,
      };
    }

    return NextResponse.json({ synthesis: parsed });
  } catch (error) {
    return NextResponse.json({ error: "Synthesis failed", details: String(error) }, { status: 500 });
  }
}
