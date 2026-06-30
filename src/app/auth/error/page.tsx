"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Brain, AlertCircle } from "lucide-react";

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") || "unknown_error";

  const ERROR_MESSAGES: Record<string, string> = {
    missing_params: "The OAuth callback was missing required parameters.",
    state_mismatch: "Security check failed — the OAuth state didn't match. Please try again.",
    token_exchange_failed: "Failed to exchange the authorization code for tokens. Check your OAuth credentials.",
    access_denied: "You declined the authorization request.",
    unknown_error: "An unknown error occurred during sign-in.",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          background: "#16161f",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 20,
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={28} color="#ef4444" />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <Brain size={16} color="#7c5cfc" />
          <span style={{ fontWeight: 700, color: "#f0f0ff", fontSize: "1rem" }}>FlowMind</span>
        </div>

        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f0f0ff", marginBottom: 12, letterSpacing: "-0.02em" }}>
          Sign-in Failed
        </h1>

        <p style={{ color: "#a0a0c0", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 8 }}>
          {ERROR_MESSAGES[error]}
        </p>

        <p style={{ fontSize: "0.75rem", color: "#3a3a50", marginBottom: 28, fontFamily: "monospace" }}>
          Error: {error}
        </p>

        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            background: "linear-gradient(135deg, #7c5cfc, #5e40e0)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Try Again
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  );
}
