// ─── GET /api/auth/chutes/logout ──────────────────────────────────────────────
import { NextResponse } from "next/server";
import { clearServerSession } from "@/lib/serverAuth";

export async function GET() {
  await clearServerSession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(appUrl);
}
