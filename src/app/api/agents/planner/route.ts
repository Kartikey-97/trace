// ─── POST /api/agents/planner ─────────────────────────────────────────────────
// Runs the Planner Agent on Chutes — accepts a raw brain dump, extracts tasks + builds schedule
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents";
import { getChutesAccessToken } from "@/lib/serverAuth";

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { dump } = body;

  const userMessage = `
The user wrote this brain dump of everything on their plate today:
---
${dump}
---

Extract all tasks, appointments, and deadlines from this. Then create an optimal time-blocked deep work schedule for the day.
`;

  try {
    const result = await runAgent("planner", userMessage, accessToken);
    let parsed;
    try {
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/({[\s\S]*})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result);
    } catch {
      parsed = { raw: result, time_blocks: [], daily_focus: result.slice(0, 120) };
    }
    return NextResponse.json({ schedule: parsed, model: "Chutes (latency pool)", agentRole: "planner" });
  } catch (error) {
    console.error("Planner agent error:", error);
    return NextResponse.json({ error: "Agent error", details: String(error) }, { status: 500 });
  }
}
