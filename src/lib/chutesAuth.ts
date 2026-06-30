// ─── Chutes OAuth Auth Library ────────────────────────────────────────────────
// Implements OAuth 2.0 Authorization Code Flow with PKCE for Sign in with Chutes

const CHUTES_IDP_BASE = "https://api.chutes.ai";
const CHUTES_LLM_BASE = "https://llm.chutes.ai/v1";

export const CHUTES_CONFIG = {
  clientId: process.env.CHUTES_OAUTH_CLIENT_ID || "",
  clientSecret: process.env.CHUTES_OAUTH_CLIENT_SECRET || "",
  apiKey: process.env.CHUTES_API_KEY || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  scopes: ["openid", "profile", "chutes:invoke"],
  llmBase: CHUTES_LLM_BASE,
  idpBase: CHUTES_IDP_BASE,
};

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64url(array.buffer);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = base64url(digest);
  return { verifier, challenge };
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64url(array.buffer);
}

// ─── Build authorization URL ──────────────────────────────────────────────────
export function buildAuthorizationUrl(
  challenge: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CHUTES_CONFIG.clientId,
    redirect_uri: `${CHUTES_CONFIG.appUrl}/api/auth/chutes/callback`,
    scope: CHUTES_CONFIG.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${CHUTES_IDP_BASE}/idp/authorize?${params.toString()}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────
export async function exchangeCodeForTokens(
  code: string,
  verifier: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${CHUTES_IDP_BASE}/idp/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${CHUTES_CONFIG.appUrl}/api/auth/chutes/callback`,
      client_id: CHUTES_CONFIG.clientId,
      client_secret: CHUTES_CONFIG.clientSecret,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }
  return res.json();
}

// ─── Fetch user info ──────────────────────────────────────────────────────────
export async function fetchChutesUser(
  accessToken: string
): Promise<ChutesUser> {
  const res = await fetch(`${CHUTES_IDP_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json();
}

// ─── Fetch balance ────────────────────────────────────────────────────────────
export async function fetchChutesBalance(accessToken: string): Promise<number> {
  try {
    const res = await fetch(`${CHUTES_IDP_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.balance || 0;
  } catch {
    return 0;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ChutesUser {
  id: string;
  username: string;
  email?: string;
  balance?: number;
}

export interface ChutesSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: ChutesUser;
}
