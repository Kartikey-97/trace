"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, GitBranch, Folder, Search, Zap, CheckCircle, Shield, FileText, Settings, X, FolderOpen, Play, Lock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParseResult {
  mode: "error" | "code_review";
  // error fields
  errorType?: string; message?: string; file?: string | null; line?: string | null;
  severity?: "critical" | "high" | "medium" | "low"; keyFrames?: string[];
  // code_review fields
  codeType?: string; fileCount?: number; keyComponents?: string[]; issueAreas?: string[];
  // shared
  language: string; sensitiveTokensFound: boolean; sensitiveTokenCount: number; summary: string;
}
interface Hypothesis {
  hypothesis: string; confidence: number; rootCause: string;
  evidence: string[]; suspectLocation: string; quickVerification: string;
}
interface HypothesisResult { hypothesis: Hypothesis; model: ModelInfo }
interface ModelInfo { id: string; label: string; color: string; modelIndex?: number }
interface Synthesis {
  verdict: string; rootCause: string; agreementLevel: "full" | "partial" | "split";
  agreementNote: string; confidenceScore: number;
  fix: { description: string; code: string; language: string };
  preventionTip: string; minutesToFix: number;
}
interface HistoryEntry {
  id: string; timestamp: number; source: InputTab; label: string;
  rootCause: string; confidenceScore: number; teeNode: string;
}

type Stage = "idle" | "parsing" | "analyzing" | "synthesizing" | "done" | "error";
type InputTab = "error" | "github" | "files";

// ─── Constants ────────────────────────────────────────────────────────────────
const MODELS: ModelInfo[] = [
  { id: "Qwen/Qwen3-32B-TEE",           label: "Qwen3 32B · TEE",   color: "#7c5cfc" },
  { id: "google/gemma-4-31B-turbo-TEE",  label: "Gemma 4 31B · TEE", color: "#22d3a0" },
  { id: "deepseek-ai/DeepSeek-V3.2-TEE", label: "DeepSeek V3 · TEE", color: "#f59e0b" },
];
const SEV = {
  critical: { c: "#ef4444", bg: "rgba(239,68,68,0.12)", l: "CRITICAL" },
  high:     { c: "#f97316", bg: "rgba(249,115,22,0.12)", l: "HIGH" },
  medium:   { c: "#f59e0b", bg: "rgba(245,158,11,0.12)", l: "MEDIUM" },
  low:      { c: "#22d3a0", bg: "rgba(34,211,160,0.12)", l: "LOW" },
};
const AGR = {
  full:    { c: "#22d3a0", l: "Full consensus",    i: "✓✓✓" },
  partial: { c: "#f59e0b", l: "Partial agreement", i: "✓✓○" },
  split:   { c: "#f97316", l: "Split verdict",     i: "✓○○" },
};
const ERROR_EXAMPLES = [
  { label: "TypeError",    value: `TypeError: Cannot read properties of undefined (reading 'map')\n    at ProductList (/app/components/ProductList.tsx:47:23)\n    at renderWithHooks (react-dom.js:14985)\nDATABASE_URL=postgres://admin:s3cr3tpassword@prod-db.internal:5432/myapp` },
  { label: "Async error",  value: `UnhandledPromiseRejectionWarning: Error: Connection ECONNREFUSED 127.0.0.1:6379\n    at TCPConnectWrap.afterConnect (net.js:1141)\nREDIS_URL=redis://:myredispassword@cache.internal:6379\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` },
  { label: "Python crash", value: `Traceback (most recent call last):\n  File "/app/api/users.py", line 134, in get_user_profile\n    return db.query(User).filter(User.id == user_id).first().to_dict()\nAttributeError: 'NoneType' object has no attribute 'to_dict'` },
];
const HISTORY_KEY = "trace_history";

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(entry: HistoryEntry) {
  const h = loadHistory().filter(e => e.id !== entry.id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...h].slice(0, 10)));
}

function parseJson(text: string): Hypothesis | null {
  try {
    const m = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/({[\s\S]*})/);
    return JSON.parse(m ? m[1] : text);
  } catch { return null; }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DebugPage() {
  const [activeTab, setActiveTab] = useState<InputTab>("error");
  // Error tab
  const [rawLog, setRawLog] = useState("");
  const [recentChange, setRecentChange] = useState("");
  // GitHub tab
  const [githubUrl, setGithubUrl] = useState("");
  const [repoMeta, setRepoMeta] = useState<{ owner: string; repo: string; description: string; language: string; stars?: number } | null>(null);
  const [repoFiles, setRepoFiles] = useState<{ path: string; size: number }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  // Files tab
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // Analysis state
  const [stage, setStage] = useState<Stage>("idle");
  const [teeNode, setTeeNode] = useState("");
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [streamingTexts, setStreamingTexts] = useState<string[]>(["  ", "  ", "  "]);
  const [thinkingTexts, setThinkingTexts] = useState<string[]>(["  ", "  ", "  "]);
  const [hypotheses, setHypotheses] = useState<(HypothesisResult | null)[]>([null, null, null]);
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const reset = () => {
    setStage("idle"); setParsedResult(null);
    setStreamingTexts(["", "", ""]); setThinkingTexts(["", "", ""]);
    setHypotheses([null, null, null]);
    setSynthesis(null); setErrorMsg(""); setTeeNode("");
  };

  // ── GitHub ─────────────────────────────────────────────────────────────────
  const fetchRepo = async () => {
    if (!githubUrl.trim()) return;
    setGithubLoading(true); setGithubError(""); setRepoFiles([]); setRepoMeta(null); setSelectedFiles(new Set());
    try {
      const res = await fetch(`/api/debug/github?url=${encodeURIComponent(githubUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch repo");
      setRepoMeta(data.repoMeta);
      setRepoFiles(data.files || []);
      const autoSelect = (data.files || []).slice(0, 8).map((f: { path: string }) => f.path);
      setSelectedFiles(new Set(autoSelect));
    } catch (e) { setGithubError(String(e)); }
    finally { setGithubLoading(false); }
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (fileList: FileList) => {
    const results: { name: string; content: string }[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > 200_000) continue;
      try { results.push({ name: file.name, content: await file.text() }); } catch { /* skip */ }
    }
    setUploadedFiles(prev => [...prev, ...results]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // ── Stream a single hypothesis ─────────────────────────────────────────────
  const streamHypothesis = useCallback(async (
    modelIndex: number, content: string, parsedData: ParseResult | null, mode: string
  ): Promise<HypothesisResult> => {
    const res = await fetch("/api/debug/stream", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawLog: content, parsedError: parsedData, modelIndex, recentChange, mode }),
    });
    if (!res.ok || !res.body) {
      const errData = await res.json().catch(() => ({ message: "Stream request failed" }));
      throw new Error(errData.message || "Stream failed");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    return new Promise((resolve, reject) => {
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              try {
                const ev = JSON.parse(raw);
                if (ev.type === "thinking") {
                  setThinkingTexts(prev => { const n = [...prev]; n[modelIndex] = (n[modelIndex] || "") + ev.content; return n; });
                } else if (ev.type === "token") {
                  setStreamingTexts(prev => { const n = [...prev]; n[modelIndex] = (n[modelIndex] || "") + ev.content; return n; });
                } else if (ev.type === "done") {
                  const hypothesis = parseJson(ev.fullText);
                  const result: HypothesisResult = {
                    hypothesis: hypothesis || { hypothesis: ev.fullText.slice(0, 300), confidence: 70, rootCause: "See analysis", evidence: [], suspectLocation: "unknown", quickVerification: "Review manually" },
                    model: { ...MODELS[modelIndex], modelIndex },
                  };
                  setHypotheses(prev => { const n = [...prev]; n[modelIndex] = result; return n; });
                  resolve(result);
                  return;
                } else if (ev.type === "error") {
                  reject(new Error(ev.message));
                  return;
                }
              } catch { /* skip bad lines */ }
            }
          }
        } catch (err) { reject(err); }
      };
      pump();
    });
  }, [recentChange]);

  // ── Main analyze pipeline ──────────────────────────────────────────────────
  const analyze = async () => {
    reset();
    setStage("parsing");
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);

    try {
      let contentToAnalyze = "";
      let mode: "error" | "code_review" = "error";

      if (activeTab === "error") {
        contentToAnalyze = rawLog; mode = "error";
      } else if (activeTab === "files") {
        contentToAnalyze = uploadedFiles.map(f => `// ─── File: ${f.name} ───\n${f.content}`).join("\n\n");
        mode = "code_review";
      } else if (activeTab === "github") {
        const files = Array.from(selectedFiles).join(",");
        const res = await fetch(`/api/debug/github?url=${encodeURIComponent(githubUrl)}&files=${encodeURIComponent(files)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "GitHub fetch failed");
        contentToAnalyze = data.content; mode = "code_review";
      }

      if (!contentToAnalyze?.trim()) throw new Error("Nothing to analyze");

      // Stage 1: Parse
      const parseRes = await fetch("/api/debug/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawLog: contentToAnalyze, recentChange: activeTab === "error" ? recentChange : "", mode }),
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.details || parseData.error || "Parse failed");
      setParsedResult(parseData.parse);
      setTeeNode(parseData.teeNode);
      setStage("analyzing");

      // Stage 2: Three models streaming in parallel
      const allHypotheses = await Promise.all(
        [0, 1, 2].map(i => streamHypothesis(i, contentToAnalyze, parseData.parse, mode))
      );
      setStage("synthesizing");

      // Stage 3: Synthesize
      const synthRes = await fetch("/api/debug/synthesize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawLog: contentToAnalyze, hypotheses: allHypotheses, parsedError: parseData.parse }),
      });
      const synthData = await synthRes.json();
      if (!synthRes.ok) throw new Error(synthData.details || synthData.error || "Synthesis failed");
      setSynthesis(synthData.synthesis);
      setStage("done");

      // Save to history
      const label = activeTab === "error"
        ? contentToAnalyze.split("\n")[0].slice(0, 60)
        : activeTab === "github" ? githubUrl.split("/").slice(-2).join("/") : uploadedFiles.map(f => f.name).join(", ").slice(0, 60);
      const entry: HistoryEntry = {
        id: Date.now().toString(), timestamp: Date.now(), source: activeTab, label,
        rootCause: synthData.synthesis?.rootCause || "Unknown", confidenceScore: synthData.synthesis?.confidenceScore || 0, teeNode: parseData.teeNode,
      };
      saveHistory(entry);
      setHistory(loadHistory());

    } catch (err) {
      const errStr = String(err);
      if (errStr.includes("429") || errStr.includes("maximum capacity") || errStr.includes("rate limit") || errStr.includes("capacity")) {
        setErrorMsg("High Demand: Trace is currently analyzing a massive volume of code. Please retry in a few moments.");
      } else {
        setErrorMsg(errStr);
      }
      setStage("error");
    }
  };

  const isReady = () => {
    if (activeTab === "error") return rawLog.trim().length > 0;
    if (activeTab === "files") return uploadedFiles.length > 0;
    if (activeTab === "github") return selectedFiles.size > 0;
    return false;
  };

  const isBusy = stage === "parsing" || stage === "analyzing" || stage === "synthesizing";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", minHeight: "calc(100vh - 57px)" }}>

      {/* ── Left Panel ───────────────────────────────────────────────────────── */}
      <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)", padding: "20px", overflowY: "auto", maxHeight: "calc(100vh - 57px)", position: "sticky", top: 57 }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 18, background: "#111118", borderRadius: 10, padding: 4 }}>
          {([["error", <ClipboardList size={14} key="error" />, "Error Log"], ["github", <GitBranch size={14} key="github" />, "GitHub"], ["files", <Folder size={14} key="files" />, "Upload"]] as [InputTab, React.ReactNode, string][]).map(([tab, icon, label]) => (
            <button key={tab} onClick={() => { setActiveTab(tab); reset(); }}
              style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, background: activeTab === tab ? "#1f1f30" : "transparent", color: activeTab === tab ? "#f0f0ff" : "#60607a", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Error Log Tab */}
        {activeTab === "error" && (
          <>
            <textarea value={rawLog} onChange={e => setRawLog(e.target.value)}
              placeholder={"Paste any stack trace or error log...\n\nAPI keys, passwords, connection strings\nare all safe — sealed inside Chutes TEE."}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze(); }}
              style={{ width: "100%", minHeight: 200, background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 10, padding: "12px 14px", color: "#e0e0f0", fontSize: "0.78rem", fontFamily: "ui-monospace, monospace", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            <input value={recentChange} onChange={e => setRecentChange(e.target.value)}
              placeholder="What changed recently? (optional)"
              style={{ width: "100%", marginTop: 8, background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 8, padding: "8px 12px", color: "#a0a0c0", fontSize: "0.78rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            <p style={{ fontSize: "0.68rem", color: "#3a3a50", marginTop: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Examples</p>
            {ERROR_EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => { setRawLog(ex.value); reset(); }}
                style={{ display: "block", width: "100%", background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 7, padding: "6px 12px", color: "#60607a", fontSize: "0.74rem", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginBottom: 5 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1f1f2d"}>
                <span style={{ color: "#ef4444", fontFamily: "monospace" }}>{ex.label}</span> · with sensitive tokens
              </button>
            ))}
          </>
        )}

        {/* GitHub Tab */}
        {activeTab === "github" && (
          <>
            <p style={{ fontSize: "0.78rem", color: "#60607a", marginBottom: 10, lineHeight: 1.5 }}>Fetch a public GitHub repo. Trace audits it for security issues and bugs.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                onKeyDown={e => { if (e.key === "Enter") fetchRepo(); }}
                style={{ flex: 1, background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 8, padding: "9px 12px", color: "#e0e0f0", fontSize: "0.78rem", outline: "none", fontFamily: "ui-monospace, monospace" }} />
              <button onClick={fetchRepo} disabled={!githubUrl.trim() || githubLoading}
                style={{ padding: "9px 14px", background: "#1f1f2d", border: "1px solid #2a2a3a", borderRadius: 8, color: "#f0f0ff", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                {githubLoading ? "..." : "Fetch →"}
              </button>
            </div>
            {githubError && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, fontSize: "0.74rem", color: "#f87171", marginBottom: 10 }}>{githubError}</div>}
            {repoMeta && (
              <div style={{ background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: "#f0f0ff", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}><GitBranch size={14} /> {repoMeta.owner}/{repoMeta.repo}</div>
                {repoMeta.description && <div style={{ fontSize: "0.72rem", color: "#60607a", marginTop: 4 }}>{repoMeta.description}</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {repoMeta.language && <span style={{ fontSize: "0.65rem", color: "#7c5cfc", background: "rgba(124,92,252,0.1)", borderRadius: 4, padding: "2px 7px" }}>{repoMeta.language}</span>}
                  {repoMeta.stars !== undefined && <span style={{ fontSize: "0.65rem", color: "#60607a" }}>⭐ {repoMeta.stars}</span>}
                </div>
              </div>
            )}
            {repoFiles.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.7rem", color: "#60607a" }}>{selectedFiles.size} of {Math.min(repoFiles.length, 12)} files selected</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setSelectedFiles(new Set(repoFiles.slice(0, 12).map(f => f.path)))} style={{ fontSize: "0.68rem", color: "#7c5cfc", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>All</button>
                    <button onClick={() => setSelectedFiles(new Set())} style={{ fontSize: "0.68rem", color: "#3a3a50", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
                  </div>
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto", background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 8 }}>
                  {repoFiles.map(f => (
                    <label key={f.path} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", cursor: "pointer", borderBottom: "1px solid #141420" }}>
                      <input type="checkbox" checked={selectedFiles.has(f.path)}
                        onChange={e => setSelectedFiles(prev => { const n = new Set(prev); e.target.checked ? n.add(f.path) : n.delete(f.path); return n; })}
                        disabled={!selectedFiles.has(f.path) && selectedFiles.size >= 12}
                        style={{ accentColor: "#7c5cfc", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.85rem", color: "#a0a0c0", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.path}</span>
                      <span style={{ fontSize: "0.75rem", color: "#3a3a50", flexShrink: 0 }}>{Math.round(f.size / 1024)}k</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <>
            <p style={{ fontSize: "0.78rem", color: "#60607a", marginBottom: 10, lineHeight: 1.5 }}>Upload files or a whole folder. Three agents audit for bugs, security flaws, and anti-patterns.</p>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)} onDrop={onDrop}
              style={{ border: `2px dashed ${isDragging ? "#7c5cfc" : "#1f1f2d"}`, borderRadius: 12, padding: "22px 16px", textAlign: "center", background: isDragging ? "rgba(124,92,252,0.04)" : "#0a0a14", transition: "all 0.15s", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: "#60607a" }}>
                <FolderOpen size={36} strokeWidth={1.5} />
              </div>
              <p style={{ color: "#60607a", fontSize: "0.78rem", marginBottom: 10 }}>Drop files or folders here</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#1f1f2d", border: "1px solid #2a2a3a", borderRadius: 7, color: "#a0a0c0", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  <FileText size={14} /> Files
                </button>
                <button onClick={() => folderInputRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#1f1f2d", border: "1px solid #2a2a3a", borderRadius: 7, color: "#a0a0c0", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  <Folder size={14} /> Folder
                </button>
              </div>
              <p style={{ color: "#3a3a50", fontSize: "0.8rem", marginTop: 8 }}>.ts .js .py .go .rs .java · max 200KB each</p>
              <input ref={fileInputRef} type="file" multiple accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.cpp,.c,.cs,.rb,.php,.swift,.kt,.vue,.svelte,.json,.yaml,.yml,.toml" style={{ display: "none" }} onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
              <input ref={folderInputRef} type="file" {...{ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>} multiple style={{ display: "none" }} onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 8, overflow: "hidden" }}>
                {uploadedFiles.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderBottom: i < uploadedFiles.length - 1 ? "1px solid #141420" : "none" }}>
                    <span style={{ fontSize: "0.85rem", color: "#a0a0c0", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "#3a3a50", flexShrink: 0 }}>{Math.round(f.content.length / 1024)}k</span>
                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#3a3a50", cursor: "pointer", fontSize: "1rem", padding: "0 2px", flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Analyze button */}
        <button onClick={analyze} disabled={!isReady() || isBusy}
          style={{ width: "100%", marginTop: 14, padding: "12px", borderRadius: 10, border: "none", cursor: isReady() && !isBusy ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: 700, fontSize: "1.05rem", background: isReady() && !isBusy ? "linear-gradient(135deg, #ef4444, #dc2626)" : "#1f1f2d", color: isReady() && !isBusy ? "#fff" : "#3a3a50", boxShadow: isReady() && !isBusy ? "0 4px 20px rgba(239,68,68,0.25)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
          {isBusy ? <><Spinner /> {stage === "parsing" ? "Parsing..." : stage === "analyzing" ? "3 models thinking..." : "Synthesizing..."}</> : <><Zap size={16} /> {activeTab === "error" ? "Analyze Error" : activeTab === "github" ? "Audit Repo" : "Audit Files"}</>}
        </button>
        {stage === "done" && <button onClick={reset} style={{ marginTop: 8, width: "100%", padding: "9px", background: "transparent", border: "1px solid #1f1f2d", borderRadius: 8, color: "#60607a", fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit" }}>↺ New analysis</button>}

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setShowHistory(h => !h)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#3a3a50", fontSize: "0.7rem", fontFamily: "inherit", padding: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showHistory ? "rotate(90deg)" : "none" }}>▶</span> Recent ({history.length})
            </button>
            {showHistory && (
              <div style={{ marginTop: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{ padding: "8px 10px", background: "#0a0a14", border: "1px solid #1a1a24", borderRadius: 7, marginBottom: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: "0.65rem", color: "#3a3a50", display: "flex", alignItems: "center", gap: 4 }}>
                        {h.source === "error" ? <ClipboardList size={12} /> : h.source === "github" ? <GitBranch size={12} /> : <Folder size={12} />}
                        {new Date(h.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "#22d3a0" }}>{h.confidenceScore}%</span>
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "#a0a0c0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label}</div>
                    <div style={{ fontSize: "0.68rem", color: "#60607a", marginTop: 2 }}>{h.rootCause}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Results ────────────────────────────────────────────────────── */}
      <div ref={resultsRef} style={{ padding: "28px 32px", overflowY: "auto", maxHeight: "calc(100vh - 57px)" }}>
        <AnimatePresence mode="wait">
          {stage === "idle" ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ marginBottom: 16, color: "#1f1f2d" }}>
                <Search size={56} strokeWidth={1} />
              </div>
              <p style={{ color: "#3a3a50", fontSize: "0.95rem" }}>Results appear here</p>
              <p style={{ color: "#2a2a3a", fontSize: "0.8rem", marginTop: 6 }}>
                {activeTab === "error" && "Paste an error → three models analyze in parallel on Chutes TEE"}
                {activeTab === "github" && "Fetch a public repo → three models audit for issues"}
                {activeTab === "files" && "Upload files or a folder → three models audit for bugs & security"}
              </p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* TEE Banner */}
              {teeNode && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.14)", borderRadius: 10, marginBottom: 20, fontSize: "0.74rem" }}>
                  <span style={{ display: "flex", alignItems: "center" }}><Lock size={12} /></span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: "#f87171", fontWeight: 600 }}>Chutes TEE</span>
                    <span style={{ color: "#2a2a3a" }}> · Node </span>
                    <span style={{ color: "#60607a", fontFamily: "monospace" }}>{teeNode}</span>
                    <span style={{ color: "#2a2a3a" }}> · Encrypted enclave · Hardware-attested</span>
                  </div>
                  {parsedResult?.sensitiveTokensFound && (
                    <span style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 5, padding: "2px 8px", color: "#f87171", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {parsedResult.sensitiveTokenCount} token{parsedResult.sensitiveTokenCount !== 1 ? "s" : ""} sealed <Lock size={12} style={{ display: "inline-block", verticalAlign: "middle" }} />
                    </span>
                  )}
                </motion.div>
              )}

              {/* Stage 01: Parse */}
              <StageLabel step="01" label={parsedResult?.mode === "code_review" ? "Code analysis" : "Error parse"} done={!!parsedResult} loading={stage === "parsing"} />
              {parsedResult ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "#111118", border: "1px solid #1f1f2d", borderRadius: 12, padding: "14px 18px", marginBottom: 22 }}>
                  {parsedResult.mode === "error" ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: "#f0f0ff" }}>{parsedResult.errorType}</span>
                        {parsedResult.severity && SEV[parsedResult.severity] && <span style={{ fontSize: "0.8rem", fontWeight: 700, color: SEV[parsedResult.severity].c, background: SEV[parsedResult.severity].bg, borderRadius: 4, padding: "2px 7px" }}>{SEV[parsedResult.severity].l}</span>}
                        {parsedResult.language !== "unknown" && <span style={{ fontSize: "0.8rem", color: "#60607a", background: "#1f1f2d", borderRadius: 4, padding: "2px 7px" }}>{parsedResult.language}</span>}
                      </div>
                      <p style={{ color: "#a0a0c0", fontSize: "1rem", lineHeight: 1.55, marginBottom: parsedResult.file ? 8 : 0 }}>{parsedResult.summary}</p>
                      {parsedResult.file && <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#60607a", display: "flex", alignItems: "center", gap: 6 }}><FileText size={12} /> {parsedResult.file}{parsedResult.line ? `:${parsedResult.line}` : ""}</div>}
                      {parsedResult.keyFrames && parsedResult.keyFrames.length > 0 && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#0a0a14", borderRadius: 7 }}>
                          {parsedResult.keyFrames.map((f, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#60607a", marginBottom: 3 }}>→ {f}</div>)}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#f0f0ff" }}>{parsedResult.codeType}</span>
                        <span style={{ fontSize: "0.8rem", color: "#7c5cfc", background: "rgba(124,92,252,0.1)", borderRadius: 4, padding: "2px 7px" }}>{parsedResult.language}</span>
                        {parsedResult.fileCount && <span style={{ fontSize: "0.8rem", color: "#60607a", background: "#1f1f2d", borderRadius: 4, padding: "2px 7px" }}>{parsedResult.fileCount} file{parsedResult.fileCount !== 1 ? "s" : ""}</span>}
                      </div>
                      <p style={{ color: "#a0a0c0", fontSize: "1rem", lineHeight: 1.55, marginBottom: 10 }}>{parsedResult.summary}</p>
                      {parsedResult.issueAreas && parsedResult.issueAreas.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "#3a3a50", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Audit focus areas</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {parsedResult.issueAreas.map((area, i) => (
                              <span key={i} style={{ fontSize: "0.85rem", color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 5, padding: "2px 8px" }}>{area}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : stage === "parsing" && <LoadingCard label="Parsing content on Chutes TEE..." />}

              {/* Stage 02: Three hypotheses */}
              {(stage === "analyzing" || stage === "synthesizing" || stage === "done") && (
                <div style={{ marginBottom: 22 }}>
                  <StageLabel step="02" label="Three independent analyses" done={hypotheses.every(Boolean)} loading={stage === "analyzing"} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[0, 1, 2].map(i => {
                      const h = hypotheses[i];
                      const sText = streamingTexts[i];
                      const thinkingText = thinkingTexts[i];
                      const color = MODELS[i].color;
                      const label = MODELS[i].label;

                      return (
                        <div key={i} style={{ background: "#111118", border: `1px solid ${color}22`, borderRadius: 12, overflow: "hidden" }}>
                          {/* Card header */}
                          <div style={{ padding: "9px 14px", borderBottom: `1px solid ${color}22`, background: `${color}0a`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                              <span style={{ fontSize: "0.85rem", color, fontWeight: 700 }}>{label}</span>
                            </div>
                            {h ? <ConfBar value={h.hypothesis.confidence} color={color} /> :
                              sText ? <span style={{ fontSize: "0.8rem", color: `${color}80` }}>answering...</span> :
                              thinkingText ? <span style={{ fontSize: "0.8rem", color: `${color}50`, fontStyle: "italic" }}>thinking...</span> : null}
                          </div>

                          {/* Card body */}
                          {h ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f0f0ff", marginBottom: 7, lineHeight: 1.35 }}>{h.hypothesis.rootCause}</div>
                              <p style={{ fontSize: "0.9rem", color: "#a0a0c0", lineHeight: 1.55, marginBottom: 8 }}>{h.hypothesis.hypothesis}</p>
                              {h.hypothesis.evidence?.slice(0, 2).map((ev, j) => (
                                <div key={j} style={{ display: "flex", gap: 5, marginBottom: 3 }}>
                                  <span style={{ color, fontSize: "0.85rem", flexShrink: 0 }}>•</span>
                                  <span style={{ fontSize: "0.85rem", color: "#60607a", lineHeight: 1.4 }}>{ev}</span>
                                </div>
                              ))}
                              {h.hypothesis.quickVerification && (
                                <div style={{ marginTop: 9, padding: "8px 12px", background: `${color}08`, borderRadius: 6, fontSize: "0.85rem", color: "#60607a", borderLeft: `2px solid ${color}35` }}>
                                  <span style={{ color, fontWeight: 600 }}>Check: </span>{h.hypothesis.quickVerification}
                                </div>
                              )}
                            </motion.div>
                          ) : (sText || thinkingText) ? (
                            <div style={{ padding: "12px 14px", minHeight: 100 }}>
                              {/* Thinking phase — chain of thought */}
                              {thinkingText && !sText && (
                                <div style={{ marginBottom: 6, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 5 }}>
                                  <div style={{ fontSize: "0.75rem", color: `${color}50`, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>🤔 thinking</div>
                                  <pre style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", color: `${color}40`, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: 80, overflow: "hidden" }}>
                                    {thinkingText.slice(-300)}<span style={{ animation: "blink 1s step-end infinite" }}>▍</span>
                                  </pre>
                                </div>
                              )}
                              {/* Answer phase — the actual JSON response */}
                              {sText && (
                                <pre style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", color: `${color}90`, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                                  {sText}<span style={{ animation: "blink 1s step-end infinite", opacity: 1 }}>▍</span>
                                </pre>
                              )}
                            </div>
                          ) : (
                            <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 100 }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${color}25`, borderTopColor: color, animation: "spin-slow 0.9s linear infinite", marginBottom: 8 }} />
                              <span style={{ fontSize: "0.85rem", color: "#2a2a3a" }}>Waiting...</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stage 03: Synthesis */}
              {(stage === "synthesizing" || stage === "done") && (
                <div>
                  <StageLabel step="03" label="Consensus verdict" done={!!synthesis} loading={stage === "synthesizing"} />
                  {synthesis ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                        {(() => { const ag = AGR[synthesis.agreementLevel]; return (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${ag.c}10`, border: `1px solid ${ag.c}30`, borderRadius: 7, padding: "5px 12px" }}>
                            <span style={{ color: ag.c, letterSpacing: 2, fontSize: "1rem" }}>{ag.i}</span>
                            <span style={{ fontSize: "0.9rem", color: ag.c, fontWeight: 600 }}>{ag.l}</span>
                            <span style={{ fontSize: "0.85rem", color: "#60607a" }}>· {synthesis.confidenceScore}%</span>
                          </div>
                        );})()}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.02)", borderRadius: 7, padding: "5px 12px", border: "1px solid #1f1f2d" }}>
                          <span style={{ fontSize: "0.85rem", color: "#3a3a50" }}>Fix in ~</span>
                          <span style={{ fontSize: "0.85rem", color: "#22d3a0", fontWeight: 700 }}>{synthesis.minutesToFix}min</span>
                        </div>
                      </div>
                      <div style={{ background: "#111118", border: "1px solid #1f1f2d", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                        <div style={{ fontSize: "0.75rem", color: "#3a3a50", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Root Cause</div>
                        <div style={{ fontWeight: 800, color: "#f0f0ff", fontSize: "1.15rem", marginBottom: 10, letterSpacing: "-0.02em" }}>{synthesis.rootCause}</div>
                        <p style={{ color: "#a0a0c0", fontSize: "1rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{synthesis.verdict}</p>
                        <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#3a3a50", fontStyle: "italic" }}>{synthesis.agreementNote}</div>
                      </div>
                      {synthesis.fix?.code && (
                        <div style={{ background: "#0a0a14", border: "1px solid #1f1f2d", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid #1f1f2d" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: "0.88rem", color: "#22d3a0", fontWeight: 700 }}>✓ The Fix</span>
                              <span style={{ fontSize: "0.85rem", color: "#3a3a50" }}>{synthesis.fix.description}</span>
                            </div>
                            <button onClick={async () => { await navigator.clipboard.writeText(synthesis.fix.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                              style={{ background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.2)", borderRadius: 6, padding: "4px 10px", color: "#22d3a0", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                              {copied ? "✓ Copied!" : "Copy"}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: "14px 16px", fontFamily: "ui-monospace, monospace", fontSize: "0.88rem", color: "#aaffd0", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {synthesis.fix.code}
                          </pre>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "rgba(124,92,252,0.05)", border: "1px solid rgba(124,92,252,0.14)", borderRadius: 10 }}>
                        <span style={{ flexShrink: 0, color: "#9d7fff" }}><Shield size={16} /></span>
                        <div>
                          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#9d7fff", display: "block", marginBottom: 4 }}>Prevention</span>
                          <span style={{ fontSize: "0.95rem", color: "#a0a0c0" }}>{synthesis.preventionTip}</span>
                        </div>
                      </div>
                      {/* Export Report */}
                      <button onClick={() => {
                        const report = [
                          `# Trace Analysis Report`,
                          `> Generated by Trace · Chutes TEE · ${new Date().toLocaleString()}`,
                          ``,
                          `## Root Cause`,
                          `**${synthesis.rootCause}**`,
                          ``,
                          synthesis.verdict,
                          ``,
                          `**Agreement:** ${synthesis.agreementLevel} · **Confidence:** ${synthesis.confidenceScore}%`,
                          `**Estimated fix time:** ${synthesis.minutesToFix} minutes`,
                          ``,
                          `## Three Independent Hypotheses`,
                          ...hypotheses.filter(Boolean).map((h, i) => [
                            `### Model ${i+1}: ${h!.model.label}`,
                            `**${h!.hypothesis.rootCause}** (${h!.hypothesis.confidence}% confidence)`,
                            h!.hypothesis.hypothesis,
                            ``,
                          ].join("\n")),
                          `## The Fix`,
                          `${synthesis.fix.description}`,
                          "```" + synthesis.fix.language,
                          synthesis.fix.code,
                          "```",
                          ``,
                          `## Prevention`,
                          synthesis.preventionTip,
                          ``,
                          `---`,
                          `*Trace · ${MODELS.map(m => m.label).join(" + ")} · TEE node ${teeNode}*`,
                        ].join("\n");
                        navigator.clipboard.writeText(report);
                        setCopied(true); setTimeout(() => setCopied(false), 3000);
                      }}
                        style={{ marginTop: 12, width: "100%", padding: "9px", background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 8, color: copied ? "#22d3a0" : "#9d7fff", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s" }}>
                        {copied ? "✓ Report copied to clipboard" : "📋 Copy full report as Markdown"}
                      </button>
                      <div style={{ marginTop: 8, fontSize: "0.67rem", color: "#1f1f2d" }}>
                        Trace · {MODELS.map(m => m.label).join(" + ")} · Chutes TEE node {teeNode}
                      </div>
                    </motion.div>
                  ) : <LoadingCard label="Chief agent synthesizing consensus verdict..." />}
                </div>
              )}

              {stage === "error" && (
                <div style={{ padding: "24px", background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 40 }}>
                  <div style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", borderRadius: "50%", padding: 12, marginBottom: 16 }}>
                    <Zap size={28} />
                  </div>
                  <div style={{ color: "#f0f0ff", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Analysis Interrupted</div>
                  <div style={{ color: "#a0a0c0", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 20, maxWidth: 400 }}>{errorMsg}</div>
                  <button onClick={analyze} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(239,68,68,0.25)" }}>
                    <Play size={14} fill="currentColor" /> Retry Analysis
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin-slow { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

function StageLabel({ step, label, done, loading }: { step: string; label: string; done: boolean; loading: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "rgba(34,211,160,0.14)" : "#0f0f18", border: `1px solid ${done ? "rgba(34,211,160,0.4)" : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: done ? "#22d3a0" : "#60607a", fontWeight: 700, flexShrink: 0 }}>
        {done ? "✓" : step}
      </div>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: done ? "#60607a" : "#f0f0ff" }}>{label}</span>
      {loading && <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #2a2a3a", borderTopColor: "#ef4444", animation: "spin-slow 0.8s linear infinite" }} />}
    </div>
  );
}
function LoadingCard({ label }: { label: string }) {
  return (
    <div style={{ background: "#111118", border: "1px solid #1f1f2d", borderRadius: 12, padding: "18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #1f1f2d", borderTopColor: "#ef4444", animation: "spin-slow 0.8s linear infinite", flexShrink: 0 }} />
      <span style={{ fontSize: "0.8rem", color: "#60607a" }}>{label}</span>
    </div>
  );
}
function ConfBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 36, height: 3, background: "#1f1f2d", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: "0.68rem", color, fontWeight: 700 }}>{value}%</span>
    </div>
  );
}
function Spinner() {
  return <div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", animation: "spin-slow 0.7s linear infinite" }} />;
}
