"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { GridBeams } from "./GridBeams";

const passportRows = [
  { id: "#EU-8842", region: "EU (2023/1542)", status: "Verified", ms: "38ms" },
  { id: "#IN-2291", region: "India BPAN", status: "Verified", ms: "41ms" },
  { id: "#UK-1102", region: "UK (UKCA)", status: "Pending", ms: "—" },
];

const barHeights = [55, 40, 70, 45, 75, 60, 80];

// Glass style shared across all cards
const glass = {
  background: "rgba(10,22,18,0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
} as React.CSSProperties;

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--ld-bg-dark)" }}
    >
      {/* === Grid lines — subtle, center-only === */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          // Invisible top 25% → visible center → fade out bottom
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 60%, black 20%, transparent 80%)",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 60%, black 20%, transparent 80%)",
        }}
      />

      {/* Accent glow blob — top right */}
      <div
        aria-hidden="true"
        className="absolute -top-40 right-0 w-[600px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(14,163,113,0.14) 0%, transparent 65%)",
        }}
      />

      {/* Animated beam pulses on the grid */}
      <GridBeams />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--ld-accent)" }} />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT: Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Alert badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-8"
              style={{
                ...glass,
                borderColor: "rgba(14,163,113,0.35)",
                color: "var(--ld-accent)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ld-accent)" }} />
              Urgent: EU Battery Regulation 2023/1542
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Battery compliance infrastructure for{" "}
              <span style={{ color: "var(--ld-accent)" }}>global scale.</span>
            </h1>

            <p className="text-lg leading-relaxed mb-10 max-w-[50ch]" style={{ color: "var(--ld-text-muted)" }}>
              Automate EU &amp; India regulatory validation with a strict, audit-ready platform. Real-time compliance checks, automated documentation, and audit trails for high-volume manufacturers.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: "var(--ld-accent)" }}
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs"
                className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-lg transition-all duration-200"
                style={{ ...glass, color: "var(--ld-text-muted)" }}
              >
                View Compliance Coverage
                <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </Link>
            </div>

            {/* Trust marks */}
            <div className="flex flex-wrap items-center gap-6">
              {["Regulatory SLA", "99.99% Uptime", "dashboard.exportready.io/compliance/overview"].map((t) => (
                <span key={t} className="text-xs font-mono" style={{ color: "rgba(157,184,175,0.5)" }}>{t}</span>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: Dashboard widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Compliance Score */}
              <div className="rounded-xl p-5" style={glass}>
                <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: "var(--ld-text-muted)" }}>
                  Global Compliance Score
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-white">99.8%</span>
                  <span className="text-xs font-mono mb-1" style={{ color: "var(--ld-accent)" }}>▲ 0.4%</span>
                </div>
                <div className="mt-3 h-10 flex items-end gap-[3px]">
                  {barHeights.map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "var(--ld-accent)" : "rgba(14,163,113,0.2)" }} />
                  ))}
                </div>
              </div>

              {/* Active Batches */}
              <div className="rounded-xl p-5" style={glass}>
                <p className="text-[10px] font-medium uppercase tracking-widest text-right mb-3" style={{ color: "var(--ld-text-muted)" }}>
                  Active Batches
                </p>
                <div className="text-right">
                  <span className="text-3xl font-black text-white">14,208</span>
                </div>
                <div className="mt-3 h-10 flex items-end gap-[3px]">
                  {[30, 50, 35, 70, 55, 80, 65].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 5 ? "rgba(14,163,113,0.75)" : "rgba(14,163,113,0.15)" }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Mini passport table */}
            <div className="rounded-xl overflow-hidden" style={glass}>
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ld-accent)" }} />
                  <span className="text-xs font-medium text-white">EU (Passport)</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "var(--ld-text-muted)" }}>Live</span>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["ID", "Region", "Status", "ms"].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "var(--ld-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {passportRows.map(row => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-3 py-2 font-mono text-white">{row.id}</td>
                      <td className="px-3 py-2" style={{ color: "var(--ld-text-muted)" }}>{row.region}</td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={row.status === "Verified"
                            ? { background: "rgba(14,163,113,0.15)", border: "1px solid rgba(14,163,113,0.3)", color: "var(--ld-accent)" }
                            : { background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", color: "#eab308" }
                          }
                        >
                          {row.status === "Verified" && <CheckCircle2 className="h-2.5 w-2.5" />}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: "var(--ld-text-muted)" }}>{row.ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Code snippet preview */}
              <div
                className="px-4 py-3 border-t font-mono text-[10px]"
                style={{
                  background: "rgba(0,0,0,0.25)",
                  borderColor: "rgba(255,255,255,0.06)",
                  color: "var(--ld-text-muted)",
                }}
              >
                <span style={{ color: "rgba(157,184,175,0.5)" }}>{"// Initiate compliance check"}</span><br />
                <span className="text-blue-300">client</span>
                <span className="text-white">{".check({"}</span>
                <span style={{ color: "var(--ld-accent)" }}>&apos;EU_2023_1542&apos;</span>
                <span className="text-white">{"});"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
