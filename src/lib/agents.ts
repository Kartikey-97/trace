// ─── Chutes Agents — Multi-Agent Orchestrator ────────────────────────────────
// Each agent uses Chutes on-chain inference with different routing strategies

const CHUTES_LLM_BASE = "https://llm.chutes.ai/v1";

export type AgentRole = "planner" | "context" | "debrief" | "blocker";

interface AgentConfig {
  role: AgentRole;
  model: string;
  systemPrompt: string;
  description: string;
}

// Dynamic routing: different pools for different agent roles
const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  planner: {
    role: "planner",
    // Use latency-optimized pool for fast schedule generation
    model: "unsloth/gemma-3-27b-it-GGUF:Q4_K_M,Qwen/Qwen2.5-32B-Instruct:latency",
    systemPrompt: `You are FlowMind's Planner Agent, powered by Chutes decentralized AI inference.
Your job: Analyze the user's tasks and energy level, then create an optimal deep work schedule.

Rules:
- Create focused time blocks (60-90 min deep work, 10-15 min breaks)
- Prioritize high-cognitive tasks during peak energy windows
- Return a structured JSON schedule with time_blocks array
- Each block: { time, duration_min, task, type: "deep_work"|"shallow"|"break", energy_required: "high"|"medium"|"low" }
- Also return a daily_focus (string) and productivity_score_estimate (0-100)

Respond ONLY with valid JSON. No markdown.`,
    description: "Latency-optimized schedule generation",
  },
  context: {
    role: "context",
    // Use throughput pool for document-heavy processing
    model: "Qwen/Qwen2.5-72B-Instruct:throughput",
    systemPrompt: `You are FlowMind's Context Agent, powered by Chutes confidential on-chain inference.
Your job: Read the user's notes/documents and create a concise "brain primer" to get them into flow state.

Output exactly 5 bullet points that:
1. Capture the key concepts they need to hold in working memory
2. Surface the most important open question or decision
3. Remind them of the core goal
4. Note any dependencies or blockers
5. Give a single motivating insight

Format as clean markdown bullets. Be crisp, sharp, and cognitively priming.`,
    description: "Throughput-optimized document analysis",
  },
  debrief: {
    role: "debrief",
    model: "Qwen/Qwen2.5-32B-Instruct",
    systemPrompt: `You are FlowMind's Debrief Agent, powered by Chutes on-chain inference.
Your job: After a deep work session, analyze what happened and extract learnings.

Given session data (tasks attempted, time spent, user notes), produce:
{
  "summary": "2-3 sentence summary of the session",
  "accomplishments": ["list of things completed"],
  "insights": ["key learnings or realizations"],  
  "tomorrow_priorities": ["top 3 tasks for next session"],
  "focus_score": 0-100,
  "momentum_note": "encouraging 1-sentence message"
}

Respond ONLY with valid JSON.`,
    description: "Session analysis and knowledge extraction",
  },
  blocker: {
    role: "blocker",
    model: "unsloth/gemma-3-12b-it-GGUF:Q4_K_M:latency",
    systemPrompt: `You are FlowMind's Focus Guard Agent, powered by Chutes on-chain inference.
Your job: Assess distraction risk and create an optimal focus environment prescription.

Given the task type and context, output:
{
  "distraction_risk": "low"|"medium"|"high",
  "risk_score": 0-100,
  "environment": {
    "noise": "silence"|"brown_noise"|"lo-fi"|"nature",
    "lighting": "dim"|"bright"|"natural",
    "location": "description"
  },
  "focus_ritual": ["3-step pre-session ritual"],
  "warning_signs": ["signs the session is going off track"],
  "rescue_technique": "if distracted, do this immediately"
}

Respond ONLY with valid JSON.`,
    description: "Latency-optimized distraction risk assessment",
  },
};

// ─── Core agent runner ────────────────────────────────────────────────────────
export async function runAgent(
  role: AgentRole,
  userMessage: string,
  accessToken: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const config = AGENT_CONFIGS[role];

  const response = await fetch(`${CHUTES_LLM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: !!onChunk,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Chutes API error (${response.status}): ${text}`);
  }

  if (onChunk && response.body) {
    // Streaming mode
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    }

    return fullText;
  } else {
    // Non-streaming mode
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

// ─── Fetch available Chutes models ───────────────────────────────────────────
export async function fetchChutesModels(
  accessToken: string
): Promise<ChutesModel[]> {
  const res = await fetch(`${CHUTES_LLM_BASE}/models`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export interface ChutesModel {
  id: string;
  confidential_compute?: boolean;
  context_length?: number;
}

// ─── Generic model runner for Trace ──────────────────────────────────────────
export async function runWithModel(
  model: string,
  systemPrompt: string,
  userMessage: string,
  accessToken: string,
  temperature = 0.3
): Promise<string> {
  const response = await fetch(`${CHUTES_LLM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: false,
      max_tokens: 2048,
      temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Chutes API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const msg = data.choices?.[0]?.message ?? {};
  // Qwen3 thinking models: answer is in `content`, chain-of-thought in `reasoning_content`
  // Non-thinking models: answer is in `content` only
  return msg.content || msg.reasoning_content || "";
}

export { AGENT_CONFIGS };
