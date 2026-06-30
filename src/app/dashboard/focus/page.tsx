"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, Loader2, Cpu, CheckCircle, Plus, Trash2 } from "lucide-react";

type SessionState = "idle" | "running" | "paused" | "debriefing" | "debriefed";

interface Debrief {
  summary: string;
  accomplishments: string[];
  insights: string[];
  tomorrow_priorities: string[];
  focus_score: number;
  momentum_note: string;
}

export default function FocusPage() {
  const [taskTitle, setTaskTitle] = useState("Deep work session");
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [state, setState] = useState<SessionState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [newCompletedTask, setNewCompletedTask] = useState("");
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [distractionsCount, setDistractionsCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current!);
        setState("debriefing");
        return 0;
      }
      return prev - 1;
    });
    setElapsed((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else if (state === "debriefing") {
      runDebrief();
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const runDebrief = async () => {
    setDebriefLoading(true);
    try {
      const res = await fetch("/api/agents/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDuration: Math.round(elapsed / 60),
          taskTitle,
          tasksCompleted: completedTasks,
          userNotes,
          distractionsCount,
        }),
      });
      const data = await res.json();
      setDebrief(data.debrief);
      setState("debriefed");
    } catch {
      setDebrief({
        summary: "Session completed. Great work maintaining your focus!",
        accomplishments: completedTasks,
        insights: ["Consistency builds momentum"],
        tomorrow_priorities: ["Continue from where you left off"],
        focus_score: 80,
        momentum_note: "You showed up — that's the hardest part.",
      });
      setState("debriefed");
    } finally {
      setDebriefLoading(false);
    }
  };

  const startSession = () => {
    setTimeLeft(sessionMinutes * 60);
    setElapsed(0);
    setDistractionsCount(0);
    setState("running");
  };

  const pauseSession = () => {
    setState(state === "running" ? "paused" : "running");
  };

  const resetSession = () => {
    setState("idle");
    setTimeLeft(sessionMinutes * 60);
    setElapsed(0);
    setDebrief(null);
    setCompletedTasks([]);
    setUserNotes("");
    setDistractionsCount(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = state === "idle" ? 0 : 1 - timeLeft / (sessionMinutes * 60);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - progress);

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Timer size={22} color="#f59e0b" />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f0f0ff", letterSpacing: "-0.03em" }}>
            Focus Timer
          </h1>
        </div>
        <p style={{ color: "#60607a", fontSize: "0.875rem" }}>
          Start a deep work session. When you finish, the Debrief Agent will automatically analyze your session via Chutes.
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            fontSize: "0.7rem",
            color: "#f59e0b",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          <Cpu size={11} />
          Chutes Standard Pool — Debrief Agent (Qwen 32B)
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left: Timer */}
        <div>
          {/* Task name */}
          {state === "idle" && (
            <div className="card" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 8 }}>
                What are you focusing on?
              </label>
              <input
                className="input-field"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Write thesis chapter 3..."
              />
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 8 }}>
                  Session length: <span style={{ color: "#f59e0b" }}>{sessionMinutes} min</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[15, 25, 45, 60, 90].map((min) => (
                    <button
                      key={min}
                      onClick={() => { setSessionMinutes(min); setTimeLeft(min * 60); }}
                      style={{
                        flex: 1,
                        padding: "7px",
                        borderRadius: 8,
                        border: `1px solid ${sessionMinutes === min ? "#f59e0b" : "#2a2a3a"}`,
                        background: sessionMinutes === min ? "rgba(245,158,11,0.12)" : "#111118",
                        color: sessionMinutes === min ? "#f59e0b" : "#60607a",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        fontFamily: "inherit",
                        fontWeight: 600,
                        transition: "all 0.15s",
                      }}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timer ring */}
          <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px" }}>
            <div style={{ position: "relative", marginBottom: "24px" }}>
              <svg width={220} height={220} className="timer-ring">
                {/* Background ring */}
                <circle
                  cx={110}
                  cy={110}
                  r={90}
                  fill="none"
                  stroke="#1f1f2d"
                  strokeWidth={8}
                />
                {/* Progress ring */}
                <circle
                  cx={110}
                  cy={110}
                  r={90}
                  fill="none"
                  stroke={state === "running" ? "#f59e0b" : state === "paused" ? "#60607a" : "#2a2a3a"}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 110 110)"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    color: state === "running" ? "#f59e0b" : "#f0f0ff",
                    letterSpacing: "-0.05em",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.3s",
                  }}
                >
                  {formatTime(timeLeft)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#60607a", marginTop: 4 }}>
                  {state === "idle" && "ready"}
                  {state === "running" && "🔥 focusing"}
                  {state === "paused" && "paused"}
                  {state === "debriefing" && "analyzing..."}
                  {state === "debriefed" && "session complete"}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {state === "idle" && (
                <button className="btn-primary" onClick={startSession} style={{ padding: "12px 28px", fontSize: "0.95rem" }}>
                  <Play size={18} />
                  Start Session
                </button>
              )}
              {(state === "running" || state === "paused") && (
                <>
                  <button className="btn-primary" onClick={pauseSession} style={{ padding: "12px 24px" }}>
                    {state === "running" ? <Pause size={18} /> : <Play size={18} />}
                    {state === "running" ? "Pause" : "Resume"}
                  </button>
                  <button className="btn-ghost" onClick={() => setState("debriefing")}>
                    End early
                  </button>
                  <button
                    className="btn-ghost"
                    title="Mark distraction"
                    onClick={() => setDistractionsCount((d) => d + 1)}
                  >
                    ⚠ {distractionsCount}
                  </button>
                </>
              )}
              {(state === "debriefed" || state === "debriefing") && (
                <button className="btn-secondary" onClick={resetSession}>
                  <RotateCcw size={16} />
                  New Session
                </button>
              )}
            </div>

            {state === "debriefing" && debriefLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", fontSize: "0.85rem" }}
              >
                <Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />
                Debrief Agent analyzing your session on Chutes...
              </motion.div>
            )}
          </div>

          {/* Session log (during session) */}
          {(state === "running" || state === "paused") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ marginTop: 16 }}>
              <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 8 }}>
                Quick notes (for debrief)
              </label>
              <textarea
                className="input-field"
                placeholder="Jot what you completed, decisions made, ideas..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
              />
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: "0.82rem", color: "#a0a0c0", display: "block", marginBottom: 8 }}>
                  Completed tasks
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    className="input-field"
                    placeholder="What did you finish?"
                    value={newCompletedTask}
                    onChange={(e) => setNewCompletedTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCompletedTask.trim()) {
                        setCompletedTasks((prev) => [...prev, newCompletedTask.trim()]);
                        setNewCompletedTask("");
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (newCompletedTask.trim()) {
                        setCompletedTasks((prev) => [...prev, newCompletedTask.trim()]);
                        setNewCompletedTask("");
                      }
                    }}
                    style={{ padding: "10px 14px" }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {completedTasks.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <CheckCircle size={13} color="#22d3a0" />
                    <span style={{ flex: 1, fontSize: "0.8rem", color: "#a0a0c0" }}>{t}</span>
                    <button onClick={() => setCompletedTasks((prev) => prev.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#3a3a50" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Debrief output */}
        <div>
          <AnimatePresence>
            {debrief ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                {/* Focus score */}
                <div
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: 14,
                    padding: "18px",
                    marginBottom: 16,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Focus Score
                  </div>
                  <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#f59e0b", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {debrief.focus_score}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#a0a0c0", marginTop: 8, fontStyle: "italic" }}>
                    {debrief.momentum_note}
                  </div>
                </div>

                {/* Summary */}
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Session Summary
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#c0c0e0", lineHeight: 1.6 }}>{debrief.summary}</p>
                </div>

                {/* Accomplishments */}
                {debrief.accomplishments?.length > 0 && (
                  <div className="card" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: "0.7rem", color: "#22d3a0", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      ✅ Accomplishments
                    </div>
                    {debrief.accomplishments.map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <CheckCircle size={14} color="#22d3a0" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: "0.82rem", color: "#a0a0c0" }}>{a}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Insights */}
                {debrief.insights?.length > 0 && (
                  <div className="card" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: "0.7rem", color: "#7c5cfc", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      💡 Insights
                    </div>
                    {debrief.insights.map((insight, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "#7c5cfc", fontSize: "1rem", lineHeight: 1.3, flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: "0.82rem", color: "#a0a0c0" }}>{insight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tomorrow priorities */}
                {debrief.tomorrow_priorities?.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      🎯 Tomorrow&apos;s Priorities
                    </div>
                    {debrief.tomorrow_priorities.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.8rem", minWidth: 16 }}>{i + 1}.</span>
                        <span style={{ fontSize: "0.82rem", color: "#a0a0c0" }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: "#3a3a50" }}>
                  <Cpu size={10} />
                  Analysis by Debrief Agent via Chutes on-chain inference
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
                <span style={{ fontSize: "3rem", marginBottom: 16 }}>📝</span>
                <p style={{ color: "#3a3a50", fontSize: "0.9rem" }}>
                  Your AI session debrief will appear here
                </p>
                <p style={{ color: "#2a2a3a", fontSize: "0.78rem", marginTop: 8 }}>
                  Complete a focus session and the Debrief Agent will analyze it automatically
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
