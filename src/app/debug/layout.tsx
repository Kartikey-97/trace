"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Session { isSignedIn: boolean; user?: { username: string } }

export default function DebugLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/chutes/session");
      const data = await res.json();
      if (!data.isSignedIn) router.replace("/");
      else setSession(data);
    } catch { router.replace("/"); }
  }, [router]);

  useEffect(() => { checkSession(); }, [checkSession]);

  if (!session?.isSignedIn) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #1f1f2d", borderTopColor: "#ef4444", margin: "0 auto 14px", animation: "spin-slow 0.8s linear infinite" }} />
        <p style={{ color: "#60607a", fontSize: "0.875rem", fontFamily: "system-ui" }}>Loading Trace...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#f0f0ff", fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>
      {/* Topbar */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", background: "rgba(8,8,16,0.9)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/debug")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #ef4444, #7c5cfc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🔍</div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.03em", color: "#f0f0ff" }}>trace</span>
          </button>
        </div>

        {/* Privacy indicator — always visible */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "5px 12px" }}>
          <span style={{ fontSize: "0.65rem" }}>🔒</span>
          <span style={{ fontSize: "0.72rem", color: "#f87171", fontWeight: 600 }}>Chutes TEE · Private Inference</span>
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #ef4444, #7c5cfc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>
              {session.user?.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: "0.8rem", color: "#60607a" }}>{session.user?.username}</span>
          </div>
          <button onClick={() => window.location.href = "/api/auth/chutes/logout"} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "5px 12px", color: "#f87171", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
