"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Lock, ClipboardList, Zap, GitMerge, CheckCircle, GitBranch, Folder } from "lucide-react";

export default function Home() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/chutes/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.isSignedIn) router.replace("/debug");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) return null;
  return <TraceLanding />;
}

// ── Mock analysis cards for the hero visual ────────────────────────────────────
const MOCK_MODELS = [
  { label: "Qwen3 32B · TEE", color: "#7c5cfc", confidence: 94, rootCause: "products prop is undefined before render", analysis: "The ProductList component calls .map() on props.products before the parent's async fetch resolves. No null guard exists at the call site, so the component crashes on initial render when products is undefined.", check: "Add products?.map() or guard with if (!products) return null" },
  { label: "Gemma 4 31B · TEE", color: "#22d3a0", confidence: 91, rootCause: "Missing default prop in ProductList component", analysis: "The parent passes products={data} where data is initially undefined. ProductList has no defaultProps or fallback. React renders the component before the data is ready.", check: "Set defaultProps: ProductList.defaultProps = { products: [] }" },
  { label: "DeepSeek V3 · TEE", color: "#f59e0b", confidence: 88, rootCause: "Race condition between state update and render", analysis: "The fetch callback calls setState but doesn't check if the component is still mounted. On first render, products state hasn't been set yet. The .map() call runs on undefined.", check: "Initialize state as useState([]) not useState(null)" },
];

function MockCard({ model, animate, delay }: { model: typeof MOCK_MODELS[0]; animate: boolean; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (animate) setTimeout(() => setVisible(true), delay);
    else setVisible(true);
  }, [animate, delay]);

  return (
    <div style={{ background: "#111118", border: `1px solid ${model.color}25`, borderRadius: 12, overflow: "hidden", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transition: "opacity 0.5s ease, transform 0.5s ease", flex: 1, minWidth: 0 }}>
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${model.color}20`, background: `${model.color}0a`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: model.color }} />
          <span style={{ fontSize: "0.8rem", color: model.color, fontWeight: 700 }}>{model.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 28, height: 3, background: "#1f1f2d", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${model.confidence}%`, height: "100%", background: model.color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: "0.75rem", color: model.color, fontWeight: 700 }}>{model.confidence}%</span>
        </div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f0f0ff", marginBottom: 6, lineHeight: 1.3 }}>{model.rootCause}</div>
        <p style={{ fontSize: "0.8rem", color: "#a0a0c0", lineHeight: 1.5, marginBottom: 8 }}>{model.analysis}</p>
        <div style={{ padding: "6px 10px", background: `${model.color}08`, borderRadius: 5, fontSize: "0.75rem", color: "#60607a", borderLeft: `2px solid ${model.color}35` }}>
          <span style={{ color: model.color, fontWeight: 600 }}>Check: </span>{model.check}
        </div>
      </div>
    </div>
  );
}

function ProductDemo() {
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), 800); return () => clearTimeout(t); }, []);

  return (
    <div style={{ background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 16, overflow: "hidden", maxWidth: 920, margin: "0 auto", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}>
      {/* Window chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderBottom: "1px solid #1a1a24", background: "#0d0d1a" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22d3a0", opacity: 0.5 }} />
        <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "#3a3a50" }}>trace — Error Debugger</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "0.75rem", color: "#f87171" }}>Chutes TEE · Private</span>
        </div>
      </div>

      {/* Error input */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr" }}>
        {/* Left: input */}
        <div style={{ borderRight: "1px solid #1a1a24", padding: "14px", background: "#090912" }}>
          <div style={{ fontSize: "0.75rem", color: "#3a3a50", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Error Log</div>
          <div style={{ background: "#0d0d1a", border: "1px solid #1f1f2d", borderRadius: 8, padding: "8px 10px", fontSize: "0.7rem", fontFamily: "monospace", color: "#f87171", lineHeight: 1.6 }}>
            TypeError: Cannot read<br />
            properties of undefined<br />
            (reading &apos;map&apos;)<br />
            <span style={{ color: "#3a3a50" }}>at ProductList.tsx:47</span><br />
            <span style={{ color: "#60607a" }}>DATABASE_URL=postgres://</span><br />
            <span style={{ color: "#60607a" }}>admin:s3cr3t@prod-db:5432</span>
          </div>
          <div style={{ marginTop: 8, padding: "4px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5, fontSize: "0.7rem", color: "#f87171" }}>
            <Lock size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> 1 credential sealed
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #7c5cfc30", borderTopColor: "#7c5cfc", animation: "spin-slow 0.9s linear infinite" }} />
            <span style={{ fontSize: "0.7rem", color: "#7c5cfc" }}>3 models thinking...</span>
          </div>
        </div>

        {/* Right: cards */}
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {MOCK_MODELS.map((m, i) => (
              <MockCard key={m.label} model={m} animate={started} delay={i * 300} />
            ))}
          </div>
          {/* Verdict bar */}
          <div style={{ background: "#111118", border: "1px solid rgba(34,211,160,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, opacity: started ? 1 : 0, transition: "opacity 0.5s ease 1.2s" }}>
            <span style={{ color: "#22d3a0", letterSpacing: 2 }}>✓✓✓</span>
            <div>
              <span style={{ fontSize: "0.8rem", color: "#22d3a0", fontWeight: 700 }}>Full consensus · 91% confidence</span>
              <span style={{ fontSize: "0.8rem", color: "#3a3a50" }}> — products prop passed as undefined on initial render</span>
            </div>
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#22d3a0", background: "rgba(34,211,160,0.08)", border: "1px solid rgba(34,211,160,0.2)", borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap" }}>Fix: 2 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceLanding() {
  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "#ededed", fontFamily: "var(--font-inter, system-ui, sans-serif)", overflowX: "hidden" }}>
      {/* Glow top removed for cleaner look */}

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid #222", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>
            <Search size={16} strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.03em", color: "#fff" }}>trace</span>
          <span style={{ fontSize: "0.75rem", color: "#888", background: "#111", border: "1px solid #333", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>beta</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/api/auth/chutes/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#fff", color: "#000", fontWeight: 600, fontSize: "0.9rem", borderRadius: 6, textDecoration: "none", border: "1px solid #fff" }}>
            Sign in →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "80px 48px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#111", border: "1px solid #333", borderRadius: 100, padding: "5px 16px", marginBottom: 28, fontSize: "0.75rem", color: "#aaa" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
          Enterprise-grade TEE · Zero data retention
        </div>

        <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: 22, color: "#fff" }}>
          Debug faster.<br />
          <span style={{ color: "#888" }}>Three minds,</span><br />
          one answer.
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#888", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 16px" }}>
          Paste your production logs — API keys, stack traces, anything. Three independent AI models on <strong style={{ color: "#fff" }}>Chutes TEE hardware</strong> analyze in parallel and reach a consensus in under 2 minutes.
        </p>
        <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 40 }}>
          Your data stays inside a hardware-encrypted enclave. Not even Chutes can read it.
        </p>

        <a href="/api/auth/chutes/login" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 32px", background: "#fff", color: "#000", fontWeight: 600, fontSize: "1rem", borderRadius: 8, textDecoration: "none", border: "1px solid #fff", marginBottom: 18 }}>
          <Search size={18} /> Start debugging for free →
        </a>
        <div style={{ fontSize: "0.85rem", color: "#555" }}>Free with your Chutes account · No data leaves TEE</div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 60, marginTop: 48, paddingTop: 40, borderTop: "1px solid #222" }}>
          {[["3", "independent AI models"], ["< 2min", "to root cause"], ["0", "data leaks"], ["100%", "TEE-secured"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>{v}</div>
              <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Product demo */}
      <section style={{ padding: "0 32px 80px" }}>
        <ProductDemo />
      </section>

      {/* Inputs */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8, color: "#fff" }}>Analyze anything</h2>
          <p style={{ color: "#888", fontSize: "1rem" }}>Three ways to feed Trace. All equally private.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: <ClipboardList size={28} />, title: "Error Logs", sub: "Paste stack traces, crash logs, or any raw output. API keys are sealed before models see them.", color: "#fff", tag: "Most common" },
            { icon: <GitBranch size={28} />, title: "GitHub Repos", sub: "Paste any public repo URL. Trace fetches the code and runs a proactive security and quality audit.", color: "#aaa", tag: "New" },
            { icon: <Folder size={28} />, title: "File Upload", sub: "Drag & drop individual files or an entire folder. Three agents find bugs, security flaws, and anti-patterns.", color: "#aaa", tag: "Code audit" },
          ].map(f => (
            <div key={f.title} style={{ background: "#0a0a0a", border: `1px solid #222`, borderRadius: 12, padding: "22px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, color: f.color }}>
                {f.icon}
                <span style={{ fontSize: "0.75rem", color: "#888", background: `#111`, border: `1px solid #333`, borderRadius: 4, padding: "2px 7px" }}>{f.tag}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "#fff", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: "0.9rem", color: "#666", lineHeight: 1.55 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Models */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8, color: "#fff" }}>Three minds. All inside TEE.</h2>
          <p style={{ color: "#888", fontSize: "1rem" }}>Different architectures = genuinely independent perspectives. Not just running the same model 3×.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { color: "#aaa", label: "Qwen3 32B · TEE", role: "Hypothesis 01", by: "Alibaba", note: "Strong reasoning, chain-of-thought visible", badge: "Thinking" },
            { color: "#aaa", label: "Gemma 4 31B · TEE", role: "Hypothesis 02", by: "Google", note: "Different training approach, independent view", badge: "Turbo" },
            { color: "#fff", label: "DeepSeek V3.2 · TEE", role: "Synthesis", by: "DeepSeek", note: "Chief agent — synthesizes all three into the final fix", badge: "Synthesis" },
          ].map(m => (
            <div key={m.label} style={{ background: "#0a0a0a", border: `1px solid #222`, borderRadius: 12, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.7rem", color: "#888", background: `#111`, border: `1px solid #333`, borderRadius: 4, padding: "2px 7px" }}>{m.badge}</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#fff", fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: 8 }}>by {m.by} · {m.role}</div>
              <div style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.5 }}>{m.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why TEE */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 16, padding: "40px 44px", display: "flex", gap: 32, alignItems: "flex-start" }}>
          <div style={{ flexShrink: 0, color: "#fff", background: "#111", border: "1px solid #333", padding: 12, borderRadius: "50%" }}>
            <Lock size={36} strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, color: "#fff" }}>Why TEE changes everything for debugging</h2>
            <p style={{ color: "#888", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 16 }}>
              Every developer knows the risk: paste a production error into ChatGPT and you might expose <strong style={{ color: "#fff", fontWeight: 600 }}>database credentials, API keys, or PII</strong>. Trace runs inside Chutes <strong style={{ color: "#fff", fontWeight: 600 }}>Trusted Execution Environments</strong> — hardware-encrypted enclaves (Intel SGX / AMD SEV-SNP) where even Chutes itself cannot read your data.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Hardware-encrypted SGX / SEV-SNP", "Credentials auto-detected & sealed", "Zero training on your logs", "Verifiable attestation"].map(t => (
                <span key={t} style={{ fontSize: "0.75rem", color: "#aaa", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "4px 10px" }}>✓ {t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8, color: "#fff" }}>Trace vs the alternatives</h2>
          <p style={{ color: "#888", fontSize: "1rem" }}>Why pasting into ChatGPT is not the same thing.</p>
        </div>
        <div style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid #222" }}>
            {["Feature", "ChatGPT / Claude", "GitHub Copilot", "Trace"].map((h, i) => (
              <div key={h} style={{ padding: "14px 16px", fontSize: "0.85rem", fontWeight: 700, color: i === 3 ? "#fff" : "#888", background: i === 3 ? "#111" : "transparent", borderRight: i < 3 ? "1px solid #222" : "none", textAlign: i > 0 ? "center" : "left" }}>
                {h}
              </div>
            ))}
          </div>
          {[
            ["Models used", "1", "1", "3 independent"],
            ["API key safety", "Exposed", "Microsoft", "TEE sealed"],
            ["Chain of thought", "Hidden", "Hidden", "Live stream"],
            ["Consensus verdict", "-", "-", "Always"],
            ["GitHub code audit", "-", "Partial", "Full"],
            ["Error + files + repos", "Paste only", "Inline only", "All three"],
          ].map(([feat, a, b, c], i) => (
            <div key={feat} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: i < 5 ? "1px solid #1a1a1a" : "none" }}>
              <div style={{ padding: "12px 16px", fontSize: "0.88rem", color: "#aaa", borderRight: "1px solid #1a1a1a" }}>{feat}</div>
              <div style={{ padding: "12px 16px", fontSize: "0.88rem", color: "#666", textAlign: "center", borderRight: "1px solid #1a1a1a" }}>{a}</div>
              <div style={{ padding: "12px 16px", fontSize: "0.88rem", color: "#666", textAlign: "center", borderRight: "1px solid #1a1a1a" }}>{b}</div>
              <div style={{ padding: "12px 16px", fontSize: "0.88rem", color: "#fff", textAlign: "center", fontWeight: 600, background: "#111" }}>{c}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8, color: "#fff" }}>Four stages. Under 2 minutes.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { step: "01", icon: <ClipboardList size={28} />, title: "Input", desc: "Error log, file upload, or GitHub URL. Credentials are sealed before analysis." },
            { step: "02", icon: <Zap size={28} />, title: "Parse", desc: "Qwen3 32B extracts error type, file, line, and flags sensitive tokens in-enclave." },
            { step: "03", icon: <GitMerge size={28} />, title: "3× Parallel", desc: "Qwen3, Gemma 4, and DeepSeek each form an independent hypothesis simultaneously." },
            { step: "04", icon: <CheckCircle size={28} />, title: "Consensus", desc: "DeepSeek V3 synthesizes all three. Outputs root cause, code fix, and prevention tip." },
          ].map(s => (
            <div key={s.step} style={{ background: "#0a0a0a", border: `1px solid #222`, borderRadius: 12, padding: "20px 18px" }}>
              <div style={{ fontSize: "0.7rem", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{s.step}</div>
              <div style={{ marginBottom: 10, color: "#fff" }}>{s.icon}</div>
              <div style={{ fontWeight: 600, color: "#fff", fontSize: "1.05rem", marginBottom: 6 }}>{s.title}</div>
              <div style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "0 48px 100px", textAlign: "center" }}>
        <div style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 16, padding: "48px 40px" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <div style={{ padding: 14, background: "#111", color: "#fff", borderRadius: "50%", border: "1px solid #333" }}>
              <Search size={40} />
            </div>
          </div>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12, color: "#fff" }}>Ready to debug smarter?</h2>
          <p style={{ color: "#888", fontSize: "1rem", lineHeight: 1.65, marginBottom: 28 }}>
            Sign in with your Chutes account. No extra setup. Your first analysis runs in under 2 minutes.
          </p>
          <a href="/api/auth/chutes/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "#fff", color: "#000", fontWeight: 600, fontSize: "1rem", borderRadius: 8, textDecoration: "none", border: "1px solid #fff" }}>
            Sign in with Chutes — It&apos;s Free →
          </a>
          <div style={{ marginTop: 14, fontSize: "0.85rem", color: "#666" }}>Uses your Chutes rate limits · Private architecture</div>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.9)} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
