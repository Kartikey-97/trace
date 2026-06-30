"use client";

import { motion } from "framer-motion";
import { Brain, Zap, Shield, ChevronRight, Cpu, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "800px",
          background:
            "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0",
          right: "-200px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(34,211,160,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(42,42,58,0.5)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,15,0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #7c5cfc, #22d3a0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Brain size={20} color="#fff" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "#f0f0ff",
              letterSpacing: "-0.02em",
            }}
          >
            FlowMind
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "#7c5cfc",
              background: "rgba(124,92,252,0.1)",
              border: "1px solid rgba(124,92,252,0.2)",
              borderRadius: 6,
              padding: "4px 10px",
            }}
          >
            Powered by Chutes AI
          </span>
          <a href="/api/auth/chutes/login" className="btn-primary">
            Sign in with Chutes
            <ChevronRight size={16} />
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "120px 40px 80px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(124,92,252,0.1)",
              border: "1px solid rgba(124,92,252,0.25)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "32px",
              fontSize: "0.8rem",
              color: "#9d7fff",
            }}
          >
            <Cpu size={13} />
            Multi-agent AI on Chutes decentralized inference
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              marginBottom: "24px",
              color: "#f0f0ff",
            }}
          >
            Your AI-Powered{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #9d7fff 0%, #22d3a0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Deep Work OS
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.2rem",
              color: "#a0a0c0",
              lineHeight: 1.6,
              marginBottom: "48px",
              maxWidth: "600px",
              margin: "0 auto 48px",
            }}
          >
            Four specialized AI agents — Planner, Context Primer, Debrief, and
            Focus Guard — orchestrated on Chutes on-chain inference to help you
            achieve measurable deep work every day.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/api/auth/chutes/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 28px",
                background: "linear-gradient(135deg, #7c5cfc, #5e40e0)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "12px",
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(124,92,252,0.35)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(124,92,252,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(124,92,252,0.35)";
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 62 41"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M38.01 39.6943C37.1263 41.1364 35.2525 41.4057 34.0442 40.2642L28.6738 35.1904C27.4656 34.049 27.4843 32.0273 28.7133 30.9115L34.1258 25.9979C40.1431 20.5352 48.069 18.406 55.6129 20.2255L59.6853 21.2078C59.8306 21.2428 59.9654 21.3165 60.0771 21.422C60.6663 21.9787 60.3364 23.0194 59.552 23.078L59.465 23.0845C52.0153 23.6409 45.1812 27.9913 40.9759 34.8542L38.01 39.6943Z"
                  fill="currentColor"
                />
                <path
                  d="M15.296 36.5912C14.1726 37.8368 12.2763 37.7221 11.2913 36.349L0.547139 21.3709C-0.432786 20.0048 -0.0547272 18.0273 1.34794 17.1822L22.7709 4.27482C29.6029 0.158495 37.7319 -0.277291 44.8086 3.0934L60.3492 10.4956C60.5897 10.6101 60.7997 10.7872 60.9599 11.0106C61.8149 12.2025 60.8991 13.9056 59.5058 13.7148L50.2478 12.4467C42.8554 11.4342 35.4143 14.2848 30.1165 20.1587L15.296 36.5912Z"
                  fill="currentColor"
                />
              </svg>
              Sign in with Chutes
            </a>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#a0a0c0",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#f0f0ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "#a0a0c0";
              }}
            >
              See how it works
            </a>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            marginTop: "80px",
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "4", label: "AI Agents" },
            { value: "On-Chain", label: "Inference" },
            { value: "2.5h", label: "Saved/Day" },
            { value: "100%", label: "Private via TEE" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #9d7fff, #22d3a0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#60607a", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Agent cards */}
      <div id="how-it-works" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px 120px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: 700,
              color: "#f0f0ff",
              letterSpacing: "-0.03em",
              marginBottom: "12px",
            }}
          >
            Four Agents. One Workflow.
          </h2>
          <p style={{ color: "#60607a", fontSize: "1rem" }}>
            Each agent runs on Chutes on-chain inference with purpose-built routing
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              icon: "📅",
              title: "Planner Agent",
              subtitle: "Latency Pool",
              desc: "Analyzes your tasks and energy level to generate an optimal time-blocked deep work schedule.",
              color: "#7c5cfc",
              model: "Gemma 3 / Qwen 32B",
            },
            {
              icon: "🧠",
              title: "Context Agent",
              subtitle: "Throughput Pool + TEE",
              desc: "Reads your notes and creates a 5-bullet brain primer to prime you for instant flow state.",
              color: "#22d3a0",
              model: "Qwen 72B (confidential)",
            },
            {
              icon: "📝",
              title: "Debrief Agent",
              subtitle: "Standard Pool",
              desc: "After each session, autonomously extracts insights, accomplishments, and tomorrow's priorities.",
              color: "#f59e0b",
              model: "Qwen 32B",
            },
            {
              icon: "🛡️",
              title: "Focus Guard",
              subtitle: "Latency Pool",
              desc: "Assesses distraction risk and prescribes your optimal focus environment before each session.",
              color: "#ef4444",
              model: "Gemma 3 12B",
            },
          ].map((agent, i) => (
            <motion.div
              key={agent.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: "#16161f",
                border: "1px solid #2a2a3a",
                borderRadius: "16px",
                padding: "24px",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              whileHover={{ y: -4, borderColor: agent.color + "55" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "14px" }}>{agent.icon}</div>
              <h3
                style={{
                  fontWeight: 700,
                  color: "#f0f0ff",
                  marginBottom: "4px",
                  fontSize: "1rem",
                }}
              >
                {agent.title}
              </h3>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: agent.color,
                  background: agent.color + "18",
                  border: `1px solid ${agent.color}30`,
                  borderRadius: 6,
                  padding: "2px 8px",
                  display: "inline-block",
                  marginBottom: "12px",
                }}
              >
                {agent.subtitle}
              </div>
              <p style={{ color: "#a0a0c0", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "12px" }}>
                {agent.desc}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Activity size={11} color="#60607a" />
                <span style={{ fontSize: "0.7rem", color: "#60607a" }}>
                  {agent.model}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How it works flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            marginTop: "80px",
            background: "rgba(124,92,252,0.06)",
            border: "1px solid rgba(124,92,252,0.2)",
            borderRadius: "20px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <Zap size={20} color="#7c5cfc" />
            <h2 style={{ fontWeight: 700, color: "#f0f0ff", fontSize: "1.4rem" }}>
              Your Entire Day, Automated
            </h2>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              color: "#a0a0c0",
              fontSize: "0.9rem",
            }}
          >
            {[
              "Sign in with Chutes",
              "Add your tasks",
              "AI plans your day",
              "Get context primed",
              "Start focus timer",
              "Auto-debrief",
            ].map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    background: "rgba(124,92,252,0.15)",
                    border: "1px solid rgba(124,92,252,0.3)",
                    borderRadius: "100px",
                    padding: "6px 14px",
                    color: "#9d7fff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {step}
                </div>
                {i < 5 && <ChevronRight size={14} color="#3a3a50" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginTop: "80px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <Shield size={16} color="#22d3a0" />
            <span style={{ fontSize: "0.85rem", color: "#60607a" }}>
              Your API usage is billed to your own Chutes account. We never store your API keys.
            </span>
          </div>
          <a href="/api/auth/chutes/login" className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
            Start Deep Work — Free
            <ChevronRight size={18} />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
