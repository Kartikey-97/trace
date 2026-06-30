// ─── Server-side session management (cookie-based) ───────────────────────────
import { cookies } from "next/headers";
import type { ChutesSession } from "./chutesAuth";

const SESSION_COOKIE = "flowmind_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback-secret-change-me";

// Simple base64 encoding for session (in production use proper encryption)
function encodeSession(data: ChutesSession): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function decodeSession(encoded: string): ChutesSession | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<ChutesSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);
    if (!cookie?.value) return null;
    const session = decodeSession(cookie.value);
    if (!session) return null;
    // Check expiry
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setServerSession(session: ChutesSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearServerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ─── Get the access token for making Chutes API calls ────────────────────────
export async function getChutesAccessToken(): Promise<string | null> {
  const session = await getServerSession();
  if (session?.accessToken) return session.accessToken;
  // Fallback to API key for demo purposes
  return process.env.CHUTES_API_KEY || null;
}
