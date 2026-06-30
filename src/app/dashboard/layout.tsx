"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  LayoutDashboard,
  Calendar,
  Timer,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Cpu,
} from "lucide-react";

interface Session {
  isSignedIn: boolean;
  user?: { username: string; email?: string; balance?: number };
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Plan My Day", path: "/dashboard/plan" },
  { icon: FileText, label: "Context Primer", path: "/dashboard/context" },
  { icon: Timer, label: "Focus Timer", path: "/dashboard/focus" },
  { icon: Shield, label: "Focus Guard", path: "/dashboard/guard" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/chutes/session");
      const data = await res.json();
      if (!data.isSignedIn) {
        router.replace("/");
      } else {
        setSession(data);
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (!session?.isSignedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="animate-spin-slow"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid #2a2a3a",
              borderTopColor: "#7c5cfc",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#60607a", fontSize: "0.9rem" }}>
            Loading FlowMind...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0a0a0f",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: "#111118",
          borderRight: "1px solid #1f1f2d",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid #1f1f2d",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "linear-gradient(135deg, #7c5cfc, #22d3a0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain size={18} color="#fff" />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#f0f0ff",
                letterSpacing: "-0.02em",
              }}
            >
              FlowMind
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          <div style={{ marginBottom: "4px" }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    fontFamily: "inherit",
                    marginBottom: "2px",
                    background: isActive
                      ? "rgba(124,92,252,0.12)"
                      : "transparent",
                    color: isActive ? "#9d7fff" : "#60607a",
                    transition: "background 0.15s, color 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#1c1c28";
                      e.currentTarget.style.color = "#a0a0c0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#60607a";
                    }
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                  {isActive && (
                    <ChevronRight
                      size={12}
                      style={{ marginLeft: "auto", opacity: 0.5 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Chutes badge + user */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #1f1f2d",
          }}
        >
          {/* Chutes badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(124,92,252,0.08)",
              border: "1px solid rgba(124,92,252,0.2)",
              borderRadius: "8px",
              padding: "8px 10px",
              marginBottom: "10px",
            }}
          >
            <Cpu size={13} color="#7c5cfc" />
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "#7c5cfc",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Chutes On-Chain
              </div>
              <div style={{ fontSize: "0.7rem", color: "#60607a" }}>
                4 agents active
              </div>
            </div>
          </div>

          {/* User */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c5cfc, #22d3a0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {session.user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#a0a0c0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100px",
                }}
              >
                {session.user?.username}
              </span>
            </div>
            <button
              onClick={() => (window.location.href = "/api/auth/chutes/logout")}
              title="Sign out"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#60607a",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#ef4444")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#60607a")
              }
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          marginLeft: 240,
          flex: 1,
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ minHeight: "100vh" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
