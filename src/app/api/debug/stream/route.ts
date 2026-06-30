import { NextRequest } from "next/server";
import { getChutesAccessToken } from "@/lib/serverAuth";

const CHUTES_LLM_BASE = "https://llm.chutes.ai/v1";

const MODELS = [
  { id: "Qwen/Qwen3-32B-TEE",                   label: "Qwen3 32B",  color: "#7c5cfc" },
  { id: "google/gemma-4-31B-turbo-TEE",          label: "Gemma 4 31B", color: "#22d3a0" },
  { id: "deepseek-ai/DeepSeek-V3.2-TEE",         label: "DeepSeek V3", color: "#f59e0b" },
];

const SYSTEMS: Record<string, string> = {
  error: `You are a principal debugging specialist conducting an independent root cause analysis.
Analyze this error log with extreme technical depth. DO NOT narrate. Be direct, specific, and confident.

Respond ONLY with valid JSON:
{
  "hypothesis": "A highly technical, 2-3 sentence theory about the exact root cause. Name the specific variables, states, or architectural flaws involved.",
  "confidence": number between 55-97,
  "rootCause": "The single most specific root cause in 10 words or less (e.g., 'Race condition in fetch callback' instead of 'Code error')",
  "evidence": ["2-3 specific lines, stack frames, or patterns proving your theory"],
  "suspectLocation": "file:line or function name where the bug lives",
  "quickVerification": "One specific, concrete test the developer can run immediately to confirm this issue"
}`,
  code_review: `You are a principal security and architecture auditor conducting a deep code review.
Analyze this code for hidden side-effects, security vulnerabilities, or severe architectural anti-patterns. Ignore trivial style issues.

Respond ONLY with valid JSON:
{
  "hypothesis": "A highly technical, 2-3 sentence description of the most critical structural or security issue found. Explain the attack vector or failure mode.",
  "confidence": number between 55-97,
  "rootCause": "Specific issue category in 10 words or less (e.g., 'Unsanitized input in SQL query', 'State mutation outside useEffect')",
  "evidence": ["2-3 specific lines or code patterns proving the vulnerability or flaw"],
  "suspectLocation": "file:line or exact function name",
  "quickVerification": "One specific exploit payload or edge-case test to prove the issue exists"
}`,
};

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const { rawLog, parsedError, modelIndex, recentChange, mode = "error" } = await request.json();
  if (modelIndex < 0 || modelIndex > 2)
    return new Response("Invalid modelIndex", { status: 400 });

  const model = MODELS[modelIndex];
  const systemPrompt = SYSTEMS[mode] || SYSTEMS.error;

  const userMsg = mode === "error"
    ? `Error log:\n${rawLog}\n\n${parsedError ? `Parsed: type=${parsedError.errorType}, severity=${parsedError.severity}, summary=${parsedError.summary}` : ""}\n${recentChange ? `\nRecent change: ${recentChange}` : ""}\n\nProvide your independent hypothesis.`
    : `Code to audit:\n${rawLog}\n\n${parsedError ? `Pre-analysis: ${parsedError.summary}` : ""}\n\nIdentify the most critical issue in this code.`;

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const chutesRes = await fetch(`${CHUTES_LLM_BASE}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model.id,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMsg },
            ],
            stream: true,
            max_tokens: 1024,
            temperature: 0.4,
          }),
        });

        if (!chutesRes.ok || !chutesRes.body) {
          const errText = await chutesRes.text();
          send({ type: "error", message: `Chutes API error (${chutesRes.status}): ${errText}` });
          controller.close();
          return;
        }

        const reader = chutesRes.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buf = "";

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const chunk = JSON.parse(raw);
              const delta = chunk.choices?.[0]?.delta ?? {};
              // Qwen3 thinking models: reasoning_content = chain of thought, content = actual answer
              const thinkingToken: string = delta.reasoning_content ?? "";
              const answerToken: string = delta.content ?? "";
              if (thinkingToken) {
                // Stream thinking phase as separate event — UI shows it dimmed/italic
                send({ type: "thinking", content: thinkingToken });
              }
              if (answerToken) {
                fullText += answerToken;
                send({ type: "token", content: answerToken });
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }

        send({ type: "done", fullText, model });
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
    cancel() { cancelled = true; },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
