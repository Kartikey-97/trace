"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Cpu, Zap, Copy, Check } from "lucide-react";

export default function ContextPage() {
  const [taskTitle, setTaskTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [primer, setPrimer] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [modelUsed, setModelUsed] = useState("");

  const generatePrimer = async () => {
    if (!content.trim() || !taskTitle.trim()) return;
    setLoading(true);
    setError("");
    setPrimer("");
    try {
      const res = await fetch("/api/agents/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, taskTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Context agent failed");
      setPrimer(data.primer || "");
      setModelUsed(data.model || "Chutes");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const copyPrimer = async () => {
    await navigator.clipboard.writeText(primer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse markdown bullets to render nicely
  const renderPrimer = (text: string) => {
    return text.split("\n").map((line, i) => {
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*");
      const clean = line.trim().replace(/^[•\-*]\s*/, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (!clean) return null;
      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "14px",
            padding: "12px 14px",
            background: "#111118",
            borderRadius: "10px",
            border: "1px solid #1f1f2d",
            borderLeft: `3px solid #7c5cfc`,
          }}
        >
          {isBullet && (
            <span
              style={{
                color: "#7c5cfc",
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.3,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
          )}
          <span
            className="ai-output"
            style={{ fontSize: "0.875rem", color: "#c0c0e0", lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: clean }}
          />
        </motion.div>
      );
    }).filter(Boolean);
  };

  return (
    <div style={{ padding: "32px", maxWidth: "860px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <FileText size={22} color="#22d3a0" />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f0f0ff", letterSpacing: "-0.03em" }}>
            Context Primer
          </h1>
        </div>
        <p style={{ color: "#60607a", fontSize: "0.875rem" }}>
          Paste your notes or documents — the Context Agent will create a 5-bullet brain primer to get you into flow state instantly.
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            fontSize: "0.7rem",
            color: "#22d3a0",
            background: "rgba(34,211,160,0.08)",
            border: "1px solid rgba(34,211,160,0.2)",
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          <Cpu size={11} />
          Chutes Throughput Pool + TEE — Context Agent (Qwen 72B)
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left: Input */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 8, fontWeight: 500 }}>
              Task / Topic
            </label>
            <input
              className="input-field"
              placeholder="e.g. Finish machine learning assignment..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 8, fontWeight: 500 }}>
              Paste Your Notes or Document
            </label>
            <textarea
              className="input-field"
              placeholder="Paste lecture notes, research papers, project docs, meeting notes, or any text you need to focus on..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              style={{ resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: "0.7rem", color: "#3a3a50" }}>
                {content.length.toLocaleString()} chars
              </span>
              <span style={{ fontSize: "0.7rem", color: "#3a3a50" }}>
                ~{Math.ceil(content.length / 4).toLocaleString()} tokens
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={generatePrimer}
            disabled={loading || !content.trim() || !taskTitle.trim()}
            style={{ width: "100%", justifyContent: "center", padding: "13px" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin-slow 1s linear infinite" }} />
                Context Agent processing...
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate Brain Primer via Chutes
              </>
            )}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: "0.8rem", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {/* What is a brain primer? */}
          <div style={{ marginTop: 16, padding: "14px", background: "rgba(34,211,160,0.04)", border: "1px solid rgba(34,211,160,0.1)", borderRadius: 10 }}>
            <p style={{ fontSize: "0.78rem", color: "#60607a", lineHeight: 1.6 }}>
              <strong style={{ color: "#22d3a0" }}>What&apos;s a brain primer?</strong> A 5-bullet distillation that loads the most critical context into your working memory so you can enter flow state within seconds — not minutes.
            </p>
          </div>
        </div>

        {/* Right: Output */}
        <div>
          <AnimatePresence>
            {primer ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #1f1f2d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.85rem", color: "#22d3a0", fontWeight: 600 }}>
                        🧠 Brain Primer
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.7rem", color: "#60607a" }}>{modelUsed}</span>
                      <button
                        className="btn-ghost"
                        onClick={copyPrimer}
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      >
                        {copied ? <Check size={13} color="#22d3a0" /> : <Copy size={13} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#60607a",
                        marginBottom: 14,
                        fontStyle: "italic",
                      }}
                    >
                      Read these 5 bullets, then start your timer. You&apos;re ready.
                    </div>
                    {renderPrimer(primer)}
                  </div>
                </div>

                {/* Start session CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    marginTop: 14,
                    padding: "14px 16px",
                    background: "rgba(124,92,252,0.06)",
                    border: "1px solid rgba(124,92,252,0.2)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#f0f0ff", fontWeight: 600 }}>Ready to focus?</div>
                    <div style={{ fontSize: "0.75rem", color: "#60607a" }}>Start a session while this is fresh</div>
                  </div>
                  <a href="/dashboard/focus" className="btn-primary" style={{ padding: "9px 18px", fontSize: "0.85rem" }}>
                    Start Timer →
                  </a>
                </motion.div>
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
                <span style={{ fontSize: "3rem", marginBottom: 16 }}>🧠</span>
                <p style={{ color: "#3a3a50", fontSize: "0.9rem" }}>
                  Your 5-bullet brain primer will appear here
                </p>
                <p style={{ color: "#2a2a3a", fontSize: "0.78rem", marginTop: 8 }}>
                  Paste your notes and click &ldquo;Generate Brain Primer&rdquo;
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
