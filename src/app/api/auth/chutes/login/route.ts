// ─── GET /api/auth/chutes/login ───────────────────────────────────────────────
// Initiates the OAuth2 PKCE flow by redirecting to Chutes IDP
import { NextResponse } from "next/server";
import { buildAuthorizationUrl, generatePKCE, generateState } from "@/lib/chutesAuth";
import { cookies } from "next/headers";

export async function GET() {
  const { verifier, challenge } = await generatePKCE();
  const state = generateState();

  // Store verifier + state in cookies for the callback
  const cookieStore = await cookies();
  cookieStore.set("chutes_pkce_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  cookieStore.set("chutes_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const authUrl = buildAuthorizationUrl(challenge, state);
  return NextResponse.redirect(authUrl);
}
