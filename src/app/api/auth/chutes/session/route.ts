// ─── GET /api/auth/chutes/session ─────────────────────────────────────────────
// Returns current session data for client-side use
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/serverAuth";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ isSignedIn: false });
  }
  return NextResponse.json({
    isSignedIn: true,
    user: session.user,
    expiresAt: session.expiresAt,
  });
}
