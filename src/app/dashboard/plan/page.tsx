"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Loader2, Cpu, Mic, Zap, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface TimeBlock {
  time: string;
  duration_min: number;
  task: string;
  type: "deep_work" | "shallow" | "break";
  energy_required: "high" | "medium" | "low";
}

interface Schedule {
  time_blocks: TimeBlock[];
  daily_focus?: string;
  productivity_score_estimate?: number;
}

const TYPE_STYLES = {
  deep_work: { color: "#7c5cfc", label: "Deep Work", bg: "rgba(124,92,252,0.12)" },
  shallow:   { color: "#a0a0c0", label: "Shallow",   bg: "rgba(160,160,192,0.08)" },
  break:     { color: "#22d3a0", label: "Break",      bg: "rgba(34,211,160,0.10)" },
};

const EXAMPLES = [
  "I need to finish my ML assignment by tonight, reply to 3 emails, gym at 6pm, and prep slides for tomorrow's presentation",
  "Write the quarterly report, two client calls at 11 and 3, lunch with team, review the new PRs from Raj",
  "Study for finals (linear algebra + stats), workout, groceries, call mom, and finish that side project feature",
];

export default function PlanPage() {
  const [dump, setDump] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState("");
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [modelUsed, setModelUsed] = useState("");
  const charCount = dump.length;

  const generateSchedule = async () => {
    if (!dump.trim()) return;
    setLoading(true);
    setError("");
    setSchedule(null);
    try {
      const res = await fetch("/api/agents/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate schedule");
      setSchedule(data.schedule);
      setModelUsed(data.model || "Chutes");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "860px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Calendar size={22} color="#7c5cfc" />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f0f0ff", letterSpacing: "-0.03em" }}>
            Plan My Day
          </h1>
        </div>
        <p style={{ color: "#60607a", fontSize: "0.875rem" }}>
          Just brain-dump everything on your plate. The Planner Agent will extract your tasks, estimate time, and build your schedule.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.7rem", color: "#7c5cfc", background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 6, padding: "3px 8px" }}>
          <Cpu size={11} />
          Chutes Latency Pool — Planner Agent
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left: Brain dump input */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Sparkles size={15} color="#7c5cfc" />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f0f0ff" }}>
                What&apos;s on your plate today?
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#60607a", marginBottom: 12, lineHeight: 1.5 }}>
              Write it like you&apos;re texting a friend — tasks, appointments, deadlines, anything. The AI figures out the rest.
            </p>
            <textarea
              className="input-field"
              placeholder="e.g. Need to finish the report by 5pm, two meetings at 11 and 2, gym at 7, and I really should review those PRs today..."
              value={dump}
              onChange={(e) => setDump(e.target.value)}
              rows={8}
              style={{ resize: "none" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generateSchedule();
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: "0.7rem", color: "#3a3a50" }}>
                {charCount > 0 ? `${charCount} chars · ⌘↵ to generate` : "No word count limits — say it all"}
              </span>
              <Mic size={14} color="#3a3a50" />
            </div>
          </div>

          {/* Examples */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.75rem", color: "#60607a", marginBottom: 8 }}>
              Try an example:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setDump(ex)}
                  style={{
                    background: "#111118",
                    border: "1px solid #1f1f2d",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#60607a",
                    fontSize: "0.75rem",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,92,252,0.3)";
                    e.currentTarget.style.color = "#a0a0c0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#1f1f2d";
                    e.currentTarget.style.color = "#60607a";
                  }}
                >
                  &ldquo;{ex.slice(0, 72)}...&rdquo;
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={generateSchedule}
            disabled={loading || !dump.trim()}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.95rem" }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin-slow 1s linear infinite" }} />
                Planner Agent building your schedule...
              </>
            ) : (
              <>
                <Zap size={18} />
                Build My Schedule
              </>
            )}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: "0.8rem", color: "#ef4444" }}>
              {error}
            </div>
          )}
        </div>

        {/* Right: Schedule output */}
        <div>
          <AnimatePresence>
            {schedule ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                {/* Daily focus + score */}
                {schedule.daily_focus && (
                  <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: "0.7rem", color: "#7c5cfc", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Today&apos;s Focus
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#f0f0ff", fontWeight: 500 }}>
                      {schedule.daily_focus}
                    </div>
                    {schedule.productivity_score_estimate && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: "#1f1f2d", borderRadius: 2, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${schedule.productivity_score_estimate}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ height: "100%", background: "linear-gradient(90deg, #7c5cfc, #22d3a0)", borderRadius: 2 }}
                          />
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "#60607a", whiteSpace: "nowrap" }}>
                          {schedule.productivity_score_estimate}% projected
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Time blocks */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1f1f2d", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} color="#60607a" />
                    <span style={{ fontSize: "0.82rem", color: "#a0a0c0", fontWeight: 600, flex: 1 }}>Your Schedule</span>
                    <span style={{ fontSize: "0.7rem", color: "#3a3a50" }}>via {modelUsed}</span>
                  </div>
                  {(schedule.time_blocks || []).map((block, i) => {
                    const style = TYPE_STYLES[block.type] || TYPE_STYLES.shallow;
                    return (
                      <div
                        key={i}
                        style={{ borderBottom: i < schedule.time_blocks.length - 1 ? "1px solid #1f1f2d" : "none", cursor: "pointer" }}
                        onClick={() => setExpandedBlock(expandedBlock === i ? null : i)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                          <span style={{ fontSize: "0.75rem", color: "#60607a", minWidth: 52, fontVariantNumeric: "tabular-nums" }}>
                            {block.time}
                          </span>
                          <div style={{ fontSize: "0.65rem", color: style.color, background: style.bg, borderRadius: 4, padding: "2px 7px", minWidth: 72, textAlign: "center" }}>
                            {style.label}
                          </div>
                          <span style={{ flex: 1, fontSize: "0.82rem", color: "#c0c0e0" }}>{block.task}</span>
                          <span style={{ fontSize: "0.7rem", color: "#60607a" }}>{block.duration_min}m</span>
                          {expandedBlock === i ? <ChevronUp size={13} color="#60607a" /> : <ChevronDown size={13} color="#60607a" />}
                        </div>
                        {expandedBlock === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} style={{ padding: "0 16px 12px 76px" }}>
                            <span style={{ fontSize: "0.75rem", color: "#60607a" }}>
                              Energy: <span style={{ color: style.color }}>{block.energy_required}</span> &nbsp;·&nbsp; {block.duration_min} min block
                            </span>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                  {(!schedule.time_blocks || schedule.time_blocks.length === 0) && (
                    <div style={{ padding: 20, textAlign: "center", color: "#60607a", fontSize: "0.85rem" }}>
                      No time blocks generated. Try again with more detail.
                    </div>
                  )}
                </div>

                {/* Start focus CTA */}
                <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#f0f0ff", fontWeight: 600 }}>Schedule ready 🎯</div>
                    <div style={{ fontSize: "0.72rem", color: "#60607a" }}>Start your first focus block now</div>
                  </div>
                  <a href="/dashboard/focus" className="btn-primary" style={{ padding: "9px 16px", fontSize: "0.82rem" }}>
                    Start Timer →
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: 420, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#16161f", border: "1px dashed #2a2a3a", borderRadius: 16, padding: 32, textAlign: "center" }}>
                <Calendar size={48} color="#2a2a3a" style={{ marginBottom: 16 }} />
                <p style={{ color: "#3a3a50", fontSize: "0.9rem" }}>Your AI schedule appears here</p>
                <p style={{ color: "#2a2a3a", fontSize: "0.78rem", marginTop: 8 }}>
                  Brain-dump your day on the left → AI does the rest
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
