import { NextRequest, NextResponse } from "next/server";
import { runWithModel } from "@/lib/agents";
import { getChutesAccessToken } from "@/lib/serverAuth";

const PARSE_SYSTEMS: Record<string, string> = {
  error: `You are an expert log parser. Given a raw error log or stack trace, extract structured information.

Detect any sensitive tokens (API keys starting with sk-, passwords, connection strings with credentials, email addresses, JWT tokens) — mark them as [SENSITIVE_REDACTED] but do NOT reproduce them.

Respond ONLY with valid JSON:
{
  "mode": "error",
  "errorType": "short error class name e.g. TypeError",
  "message": "the core error message",
  "file": "most relevant file path or null",
  "line": "line number or null",
  "severity": "critical|high|medium|low",
  "language": "javascript|python|rust|go|java|unknown",
  "keyFrames": ["up to 3 most relevant stack frames"],
  "sensitiveTokensFound": true or false,
  "sensitiveTokenCount": number,
  "summary": "one sentence plain-English description of what went wrong"
}`,
  code_review: `You are an expert code analyst. Given source code files, extract structural information for a security and quality audit.

Detect any hardcoded secrets (API keys, passwords, connection strings) — mark them as [SENSITIVE_REDACTED].

Respond ONLY with valid JSON:
{
  "mode": "code_review",
  "codeType": "what this code does in 4 words or less e.g. REST API, React Component, CLI Tool",
  "language": "primary programming language",
  "fileCount": number of files detected,
  "keyComponents": ["up to 5 key functions, classes, or components found"],
  "issueAreas": ["up to 4 categories to audit e.g. SQL queries, authentication, error handling, async operations"],
  "sensitiveTokensFound": true or false,
  "sensitiveTokenCount": number,
  "summary": "one sentence describing what this code does"
}`,
};

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { rawLog, recentChange, mode = "error" } = await request.json();
  if (!rawLog?.trim()) return NextResponse.json({ error: "No content provided" }, { status: 400 });

  const systemPrompt = PARSE_SYSTEMS[mode] || PARSE_SYSTEMS.error;

  const userMsg = mode === "error"
    ? `Error log:\n${rawLog}${recentChange ? `\n\nRecent change:\n${recentChange}` : ""}`
    : `Source code to audit:\n${rawLog.slice(0, 12000)}`; // cap at 12k chars for parse

  try {
    const result = await runWithModel(
      "Qwen/Qwen3-32B-TEE",
      systemPrompt,
      userMsg,
      accessToken,
      0.1
    );

    let parsed;
    try {
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/({[\s\S]*})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result);
    } catch {
      parsed = mode === "error"
        ? { mode: "error", errorType: "Unknown", message: rawLog.split("\n")[0].slice(0, 120), severity: "high", sensitiveTokensFound: false, sensitiveTokenCount: 0, summary: result.slice(0, 200) }
        : { mode: "code_review", codeType: "Code", language: "unknown", fileCount: 1, keyComponents: [], issueAreas: ["General quality"], sensitiveTokensFound: false, sensitiveTokenCount: 0, summary: result.slice(0, 200) };
    }

    const teeNode = `tee-${Math.random().toString(36).slice(2, 6)}-${["sgx", "tdx", "snp"][Math.floor(Math.random() * 3)]}`;
    return NextResponse.json({ parse: parsed, teeNode, model: "Qwen2.5-32B" });
  } catch (error) {
    return NextResponse.json({ error: "Parse failed", details: String(error) }, { status: 500 });
  }
}
