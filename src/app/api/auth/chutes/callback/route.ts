// ─── GET /api/auth/chutes/callback ────────────────────────────────────────────
// Handles the OAuth2 redirect, exchanges code for tokens, sets session
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchChutesUser } from "@/lib/chutesAuth";
import { setServerSession } from "@/lib/serverAuth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${appUrl}/auth/error?error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/auth/error?error=missing_params`);
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("chutes_pkce_verifier")?.value;
  const savedState = cookieStore.get("chutes_oauth_state")?.value;

  if (!verifier || !savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/auth/error?error=state_mismatch`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, verifier);
    const user = await fetchChutesUser(tokens.access_token);

    await setServerSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      user,
    });

    // Clean up PKCE cookies
    cookieStore.delete("chutes_pkce_verifier");
    cookieStore.delete("chutes_oauth_state");

    return NextResponse.redirect(`${appUrl}/debug`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/auth/error?error=token_exchange_failed`);
  }
}
