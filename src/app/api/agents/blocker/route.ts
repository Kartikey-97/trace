// ─── POST /api/agents/blocker ─────────────────────────────────────────────────
// Runs the Focus Guard Agent — assesses distraction risk and prescribes environment
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents";
import { getChutesAccessToken } from "@/lib/serverAuth";

export async function POST(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { taskTitle, taskType, timeOfDay, energyLevel, environment } = body;

  const userMessage = `
Task: ${taskTitle}
Task Type: ${taskType || "knowledge work"}
Time of Day: ${timeOfDay}
Current Energy Level: ${energyLevel}/10
Current Environment: ${environment || "home office"}

Assess my distraction risk and prescribe an optimal focus environment.
`;

  try {
    const result = await runAgent("blocker", userMessage, accessToken);
    let parsed;
    try {
      const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/({[\s\S]*})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result);
    } catch {
      parsed = {
        distraction_risk: "medium",
        risk_score: 50,
        environment: { noise: "brown_noise", lighting: "natural", location: "quiet desk" },
        focus_ritual: ["Put phone in another room", "Close all tabs except work", "Set a clear intention"],
        warning_signs: ["Checking phone", "Opening new tabs", "Daydreaming"],
        rescue_technique: "Take 3 deep breaths and write down your current task",
      };
    }
    return NextResponse.json({ focus: parsed, model: "Chutes (latency pool)", agentRole: "blocker" });
  } catch (error) {
    console.error("Blocker agent error:", error);
    return NextResponse.json({ error: "Agent error", details: String(error) }, { status: 500 });
  }
}
