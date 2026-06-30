// ─── POST /api/agents/debrief ─────────────────────────────────────────────────
// Runs the Debrief Agent — autonomously analyzes a completed session
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents";
import { getChutesAccessToken } from "@/lib/serverAuth";

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionDuration, taskTitle, tasksCompleted, userNotes, distractionsCount } = body;

  const userMessage = `
Session Data:
- Task: ${taskTitle}
- Duration: ${sessionDuration} minutes
- Tasks completed: ${tasksCompleted?.join(", ") || "Not specified"}
- User notes: ${userNotes || "None"}
- Estimated distractions: ${distractionsCount || 0}

Generate my session debrief.
`;

  try {
    const result = await runAgent("debrief", userMessage, accessToken);
    let parsed;
    try {
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/({[\s\S]*})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result);
    } catch {
      parsed = { summary: result, accomplishments: [], insights: [], tomorrow_priorities: [], focus_score: 75, momentum_note: "Great work today!" };
    }
    return NextResponse.json({ debrief: parsed, model: "Chutes", agentRole: "debrief" });
  } catch (error) {
    console.error("Debrief agent error:", error);
    return NextResponse.json({ error: "Agent error", details: String(error) }, { status: 500 });
  }
}
