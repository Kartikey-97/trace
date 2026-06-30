"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Flame,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Timer,
  Shield,
  Cpu,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

interface Stats {
  totalFocusHours: number;
  sessionsCompleted: number;
  currentStreak: number;
  avgFocusScore: number;
}

const QUICK_ACTIONS = [
  {
    icon: Calendar,
    label: "Plan My Day",
    desc: "Generate your AI schedule",
    path: "/dashboard/plan",
    color: "#7c5cfc",
    agent: "Planner Agent",
  },
  {
    icon: FileText,
    label: "Context Primer",
    desc: "Prime your brain for a task",
    path: "/dashboard/context",
    color: "#22d3a0",
    agent: "Context Agent",
  },
  {
    icon: Timer,
    label: "Start Focus",
    desc: "Begin a deep work session",
    path: "/dashboard/focus",
    color: "#f59e0b",
    agent: "Debrief Agent",
  },
  {
    icon: Shield,
    label: "Focus Guard",
    desc: "Check distraction risk",
    path: "/dashboard/guard",
    color: "#ef4444",
    agent: "Blocker Agent",
  },
];

const AGENT_STATUSES = [
  { name: "Planner Agent", pool: "latency", status: "ready", color: "#7c5cfc" },
  { name: "Context Agent", pool: "throughput + TEE", status: "ready", color: "#22d3a0" },
  { name: "Debrief Agent", pool: "standard", status: "ready", color: "#f59e0b" },
  { name: "Focus Guard", pool: "latency", status: "ready", color: "#ef4444" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats] = useState<Stats>({
    totalFocusHours: 12.5,
    sessionsCompleted: 8,
    currentStreak: 3,
    avgFocusScore: 78,
  });

  const [greeting, setGreeting] = useState("Good morning");
  const [username, setUsername] = useState("there");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetch("/api/auth/chutes/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.username) setUsername(data.user.username);
      });
  }, []);

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "32px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#60607a", fontSize: "0.875rem", marginBottom: "6px" }}>
              {today}
            </p>
            <h1
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#f0f0ff",
                letterSpacing: "-0.03em",
                marginBottom: "4px",
              }}
            >
              {greeting}, {username} 👋
            </h1>
            <p style={{ color: "#a0a0c0", fontSize: "0.9rem" }}>
              Ready for deep work? Your AI agents are standing by on Chutes.
            </p>
          </div>
          <div
            style={{
              background: "rgba(124,92,252,0.08)",
              border: "1px solid rgba(124,92,252,0.2)",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22d3a0",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: "0.8rem", color: "#7c5cfc", fontWeight: 600 }}>
              Chutes On-Chain Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {[
          { icon: Clock, label: "Focus Hours", value: `${stats.totalFocusHours}h`, sub: "this week", color: "#7c5cfc" },
          { icon: Target, label: "Sessions", value: stats.sessionsCompleted, sub: "completed", color: "#22d3a0" },
          { icon: Flame, label: "Streak", value: `${stats.currentStreak}d`, sub: "on fire 🔥", color: "#f59e0b" },
          { icon: TrendingUp, label: "Focus Score", value: `${stats.avgFocusScore}%`, sub: "avg this week", color: "#ef4444" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-hover"
            style={{
              background: "#16161f",
              border: "1px solid #2a2a3a",
              borderRadius: "14px",
              padding: "18px",
              cursor: "default",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "9px",
                background: stat.color + "18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <stat.icon size={17} color={stat.color} />
            </div>
            <div
              style={{
                fontSize: "1.7rem",
                fontWeight: 800,
                color: "#f0f0ff",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: "4px",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#60607a" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#3a3a50", marginTop: 2 }}>
              {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginBottom: "32px" }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#a0a0c0",
            marginBottom: "14px",
            letterSpacing: "-0.01em",
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "14px",
          }}
        >
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              whileHover={{ y: -2, borderColor: action.color + "55" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(action.path)}
              style={{
                background: "#16161f",
                border: "1px solid #2a2a3a",
                borderRadius: "14px",
                padding: "18px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "border-color 0.2s, transform 0.15s",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "11px",
                  background: action.color + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <action.icon size={20} color={action.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#f0f0ff",
                    fontSize: "0.9rem",
                    marginBottom: "2px",
                  }}
                >
                  {action.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#60607a" }}>
                  {action.desc}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: action.color,
                    background: action.color + "18",
                    borderRadius: 4,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {action.agent}
                </div>
                <ChevronRight size={14} color="#3a3a50" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Agent status panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#a0a0c0",
            marginBottom: "14px",
          }}
        >
          Chutes Agent Network
        </h2>
        <div
          style={{
            background: "#16161f",
            border: "1px solid #2a2a3a",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 18px",
              borderBottom: "1px solid #1f1f2d",
              background: "rgba(124,92,252,0.04)",
            }}
          >
            <Cpu size={15} color="#7c5cfc" />
            <span style={{ fontSize: "0.82rem", color: "#7c5cfc", fontWeight: 600 }}>
              Chutes Decentralized Inference — llm.chutes.ai/v1
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22d3a0",
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "#22d3a0" }}>All systems operational</span>
            </div>
          </div>
          {AGENT_STATUSES.map((agent, i) => (
            <div
              key={agent.name}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 18px",
                borderBottom: i < AGENT_STATUSES.length - 1 ? "1px solid #1f1f2d" : "none",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: agent.color,
                  marginRight: "12px",
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${agent.color}`,
                }}
              />
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#a0a0c0",
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                {agent.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: agent.color,
                    background: agent.color + "18",
                    border: `1px solid ${agent.color}30`,
                    borderRadius: 5,
                    padding: "2px 8px",
                  }}
                >
                  {agent.pool}
                </span>
                <Activity size={13} color="#3a3a50" />
                <span style={{ fontSize: "0.75rem", color: "#22d3a0" }}>
                  {agent.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Productivity tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: "16px",
            background: "rgba(34,211,160,0.06)",
            border: "1px solid rgba(34,211,160,0.2)",
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Zap size={16} color="#22d3a0" />
          <div>
            <span style={{ fontSize: "0.82rem", color: "#22d3a0", fontWeight: 600 }}>
              Pro tip:{" "}
            </span>
            <span style={{ fontSize: "0.82rem", color: "#a0a0c0" }}>
              Start with{" "}
              <button
                onClick={() => router.push("/dashboard/plan")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#22d3a0",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  padding: 0,
                }}
              >
                Plan My Day
              </button>{" "}
              — the Planner Agent will organize your tasks into optimal deep work blocks using Chutes inference.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
