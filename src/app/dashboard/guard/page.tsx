"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, Cpu, Zap } from "lucide-react";

interface FocusGuardResult {
  distraction_risk: "low" | "medium" | "high";
  risk_score: number;
  environment: {
    noise: string;
    lighting: string;
    location: string;
  };
  focus_ritual: string[];
  warning_signs: string[];
  rescue_technique: string;
}

const RISK_CONFIG = {
  low: { color: "#22d3a0", bg: "rgba(34,211,160,0.1)", label: "Low Risk", emoji: "🟢" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium Risk", emoji: "🟡" },
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "High Risk", emoji: "🔴" },
};

const NOISE_ICONS: Record<string, string> = {
  silence: "🔇",
  brown_noise: "🟤",
  "lo-fi": "🎵",
  nature: "🌿",
};

export default function GuardPage() {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("knowledge work");
  const [energyLevel, setEnergyLevel] = useState(7);
  const [environment, setEnvironment] = useState("home office");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FocusGuardResult | null>(null);
  const [error, setError] = useState("");

  const assessRisk = async () => {
    if (!taskTitle.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening";
      const res = await fetch("/api/agents/blocker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle, taskType, timeOfDay, energyLevel, environment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Guard agent failed");
      setResult(data.focus);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? RISK_CONFIG[result.distraction_risk] : null;

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Shield size={22} color="#ef4444" />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f0f0ff", letterSpacing: "-0.03em" }}>
            Focus Guard
          </h1>
        </div>
        <p style={{ color: "#60607a", fontSize: "0.875rem" }}>
          Before you start — let the Focus Guard Agent assess your distraction risk and prescribe the optimal environment.
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            fontSize: "0.7rem",
            color: "#ef4444",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          <Cpu size={11} />
          Chutes Latency Pool — Focus Guard Agent (Gemma 3 12B)
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left: Input */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f0f0ff", marginBottom: 14 }}>
              Session Context
            </h3>

            <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 6 }}>
              What are you working on?
            </label>
            <input
              className="input-field"
              placeholder="e.g. Studying for finals..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              style={{ marginBottom: 14 }}
            />

            <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 6 }}>
              Task Type
            </label>
            <select
              className="input-field"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              style={{ marginBottom: 14 }}
            >
              <option>knowledge work</option>
              <option>creative writing</option>
              <option>coding</option>
              <option>studying</option>
              <option>reading</option>
              <option>data analysis</option>
              <option>design</option>
            </select>

            <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 6 }}>
              Current Energy: <span style={{ color: "#ef4444" }}>{energyLevel}/10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ef4444", marginBottom: 14 }}
            />

            <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 6 }}>
              Current Environment
            </label>
            <select
              className="input-field"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option>home office</option>
              <option>coffee shop</option>
              <option>library</option>
              <option>open office</option>
              <option>bedroom</option>
              <option>coworking space</option>
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={assessRisk}
            disabled={loading || !taskTitle.trim()}
            style={{ width: "100%", justifyContent: "center", padding: "13px" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin-slow 1s linear infinite" }} />
                Focus Guard analyzing...
              </>
            ) : (
              <>
                <Zap size={18} />
                Assess My Focus Risk via Chutes
              </>
            )}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: "0.8rem", color: "#ef4444" }}>
              {error}
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div>
          <AnimatePresence>
            {result && risk ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                {/* Risk score */}
                <div
                  style={{
                    background: risk.bg,
                    border: `1px solid ${risk.color}40`,
                    borderRadius: 14,
                    padding: "20px",
                    marginBottom: 14,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>{risk.emoji}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: risk.color, letterSpacing: "-0.03em" }}>
                    {risk.label}
                  </div>
                  <div style={{ fontSize: "3rem", fontWeight: 900, color: risk.color, lineHeight: 1, marginTop: 4 }}>
                    {result.risk_score}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: risk.color, opacity: 0.7, marginTop: 4 }}>
                    distraction risk score / 100
                  </div>

                  {/* Score bar */}
                  <div style={{ marginTop: 12, height: 6, background: "rgba(0,0,0,0.2)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.risk_score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", background: risk.color, borderRadius: 3 }}
                    />
                  </div>
                </div>

                {/* Environment prescription */}
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.7rem", color: "#a0a0c0", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🎯 Optimal Environment
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Sound", value: `${NOISE_ICONS[result.environment.noise] || "🔊"} ${result.environment.noise}` },
                      { label: "Lighting", value: `💡 ${result.environment.lighting}` },
                      { label: "Location", value: `📍 ${result.environment.location}` },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "#60607a" }}>{item.label}</span>
                        <span style={{ fontSize: "0.82rem", color: "#a0a0c0", fontWeight: 500 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-session ritual */}
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.7rem", color: "#7c5cfc", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🧘 Pre-Session Ritual
                  </div>
                  {result.focus_ritual.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(124,92,252,0.15)",
                          border: "1px solid rgba(124,92,252,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          color: "#7c5cfc",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {i + 1}
                      </div>
                      <span style={{ fontSize: "0.82rem", color: "#a0a0c0" }}>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Rescue technique */}
                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, marginBottom: 6 }}>
                    🚨 If You Get Distracted
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#a0a0c0", lineHeight: 1.5 }}>
                    {result.rescue_technique}
                  </p>
                </div>

                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <a href="/dashboard/focus" className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
                    Start Focus Session →
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  minHeight: 400,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#16161f",
                  border: "1px dashed #2a2a3a",
                  borderRadius: 16,
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "3rem", marginBottom: 16 }}>🛡️</span>
                <p style={{ color: "#3a3a50", fontSize: "0.9rem" }}>
                  Your focus guard assessment will appear here
                </p>
                <p style={{ color: "#2a2a3a", fontSize: "0.78rem", marginTop: 8 }}>
                  Click &ldquo;Assess My Focus Risk&rdquo; to get your personalized environment prescription
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
