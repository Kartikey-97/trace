// ─── GET /api/auth/chutes/login ───────────────────────────────────────────────
// Initiates the OAuth2 PKCE flow by redirecting to Chutes IDP
import { NextResponse } from "next/server";
import { buildAuthorizationUrl, generatePKCE, generateState } from "@/lib/chutesAuth";
import { cookies } from "next/headers";

export async function GET() {
  const { verifier, challenge } = await generatePKCE();
  const state = generateState();

  const authUrl = buildAuthorizationUrl(challenge, state);
  const response = NextResponse.redirect(authUrl);

  response.cookies.set("chutes_pkce_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  
  response.cookies.set("chutes_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
