// ─── POST /api/agents/context ─────────────────────────────────────────────────
// Runs the Context Agent — summarizes docs into a "brain primer" for focus
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents";
import { getChutesAccessToken } from "@/lib/serverAuth";

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { content, taskTitle } = body;

  const userMessage = `
Task: ${taskTitle}

Document/Notes Content:
---
${content}
---

Generate my brain primer — 5 focused bullets to prime me for deep work on this task.
`;

  try {
    const result = await runAgent("context", userMessage, accessToken);
    return NextResponse.json({
      primer: result,
      model: "Chutes (throughput pool)",
      agentRole: "context",
    });
  } catch (error) {
    console.error("Context agent error:", error);
    return NextResponse.json({ error: "Agent error", details: String(error) }, { status: 500 });
  }
}
