"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import TextReveal from "@/components/text-reveal";
import GlowDots from "@/components/illustrations/glow-dots";

const sidebarItems = [
  { label: "Overview", active: true },
  { label: "Battery Batches" },
  { label: "Passport Lifecycle" },
  { label: "Compliance & Rules" },
  { label: "Mass Balance" },
  { label: "Supplier Portal" },
  { label: "Settings" },
];

const kpiStats = [
  {
    label: "Total Passports",
    value: "1,420",
    subtext: "+128 this week",
    tone: "emerald",
  },
  {
    label: "Active Batches",
    value: "14",
    subtext: "Production in progress",
    tone: "purple",
  },
  {
    label: "Quota Balance",
    value: "850 / 1,000",
    subtext: "85% slots available",
    tone: "blue",
  },
];

const batchRows = [
  {
    name: "LFP-72V-50AH-2026A",
    units: "500 units",
    market: "EU (2023/1542)",
    status: "ACTIVE",
    tone: "emerald",
  },
  {
    name: "NMC-48V-100AH-EXP",
    units: "250 units",
    market: "EU & INDIA",
    status: "VERIFIED",
    tone: "blue",
  },
  {
    name: "BPAN-CELL-M204",
    units: "1,200 units",
    market: "INDIA (AIS-156)",
    status: "VERIFIED",
    tone: "blue",
  },
  {
    name: "CATL-MORTH-B09",
    units: "100 units",
    market: "EU (2023/1542)",
    status: "PENDING",
    tone: "amber",
  },
];

export default function Hero() {
  return (
    <section className="relative px-4 sm:px-6 pt-[96px] pb-20 overflow-hidden">
      {/* Glowing dot grid background */}
      <GlowDots />

      <div className="relative max-w-[1232px] mx-auto">
        {/* ── Content ── */}
        <div className="flex flex-col items-center text-center pt-12 lg:pt-16">
          {/* Announcement pill */}
          <motion.a
            href="/battery"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-sm text-[13px] font-medium text-text bg-white border border-border hover:border-blue transition-colors mb-8"
          >
            <span className="inline-flex items-center h-[22px] px-2 rounded-sm bg-blue text-white text-[11px] font-semibold tracking-wide font-mono">
              NEW
            </span>
            EU Battery Passport — mandatory 18 Feb 2027
            <ArrowRight size={13} className="cta-arrow text-text-muted" />
          </motion.a>

          {/* Headline */}
          <h1 className="font-heading text-text text-[clamp(38px,6vw,72px)] font-medium tracking-[-0.04em] leading-[1.05] max-w-[860px] text-balance">
            <TextReveal as="span" className="block">
              Every product deserves
            </TextReveal>
            <TextReveal
              as="span"
              className="block text-text-muted"
              delay={0.18}
            >
              a digital identity.
            </TextReveal>
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[560px] mt-6 text-[16px] leading-[1.7] text-text-muted text-pretty"
          >
            Anviora turns your certificates, supplier records, and factory data
            into verifiable digital product passports — compliant at home,
            cleared in Europe.
          </motion.p>

          {/* CTA group — Supermemory split buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 w-full max-w-[420px]"
          >
            <a
              href="/request-access"
              className="btn-primary press-scale flex-1 sm:flex-none"
            >
              <span className="btn-primary-label">Request a Demo</span>
              <span className="btn-primary-arrow">
                <ArrowRight size={15} />
              </span>
            </a>
            <a
              href="#how-it-works"
              className="btn-secondary press-scale flex-1 sm:flex-none"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* ── App window — actual platform dashboard replica ── */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14 lg:mt-16 max-w-[980px] mx-auto"
        >
          {/* Floating chips */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-4 -right-2 sm:right-6 z-10 flex items-center gap-1.5 h-9 px-3.5 bg-white border border-border shadow-[0_8px_24px_-8px_rgba(5,98,239,0.25)] rounded-md"
          >
            <ShieldCheck size={15} className="text-blue" />
            <span className="text-[12px] font-medium text-text">
              EU cleared in 10 sec
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: 1.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute top-16 -left-2 sm:-left-6 z-10 hidden sm:flex items-center gap-1.5 h-9 px-3.5 bg-white border border-border shadow-[0_8px_24px_-8px_rgba(5,98,239,0.25)] rounded-md"
          >
            <Sparkles size={15} className="text-blue" />
            <span className="text-[12px] font-medium text-text">
              100+ fields auto-parsed
            </span>
          </motion.div>

          {/* Window — dark editor */}
          <div
            className="bg-dark rounded-t-[10px] overflow-hidden"
            style={{
              boxShadow:
                "0 32px 64px -24px rgba(11,16,21,0.28), 0 8px 16px -4px rgba(11,16,21,0.1), 0 0 0 1px rgba(11,16,21,0.04)",
            }}
          >
            {/* Titlebar */}
            <div className="flex items-center justify-between h-10 px-4 bg-dark-panel border-b border-dark-border">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[11px] text-[#6b7480]">
                app.anviora.com/dashboard
              </span>
              <span className="inline-flex items-center h-5 px-2 rounded-sm bg-blue/15 text-blue text-[10px] font-mono font-medium tracking-wider uppercase">
                EU & INDIA COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr]">
              {/* Sidebar */}
              <div className="hidden sm:block px-2 py-3 bg-dark-panel border-r border-dark-border">
                <div className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] text-[#6b7480] px-2.5 mb-2">
                  Navigation
                </div>
                <div className="grid gap-0.5">
                  {sidebarItems.map((item) => (
                    <div
                      key={item.label}
                      className={`px-2.5 py-[7px] rounded-sm text-[12px] font-medium transition-colors ${
                        item.active
                          ? "bg-blue/15 text-[#7cb7ff] border-l-2 border-blue"
                          : "text-[#6b7480] hover:text-[#f5f9ff]"
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Dashboard Workspace */}
              <div className="p-5 sm:p-6 bg-dark space-y-5">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-dark-border pb-4">
                  <div>
                    <h3 className="text-[15px] font-medium text-[#f5f9ff]">
                      Welcome back, Acme Battery Co.
                    </h3>
                    <p className="text-[11px] text-[#6b7480] mt-0.5">
                      Monitor regulatory readiness, passport activations, and batch compliance.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded bg-blue text-white text-[11px] font-medium">
                    + Create Batch
                  </div>
                </div>

                {/* Real KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {kpiStats.map((kpi) => (
                    <div
                      key={kpi.label}
                      className="p-3.5 rounded-md border border-dark-border bg-dark-panel"
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6b7480]">
                        {kpi.label}
                      </div>
                      <div className="text-[22px] font-medium font-heading text-[#f5f9ff] mt-1 tracking-tight">
                        {kpi.value}
                      </div>
                      <div className="text-[10.5px] text-[#7cb7ff] font-mono mt-1">
                        {kpi.subtext}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Production Chart & Recent Batches Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#f5f9ff]">
                      Recent Battery Batches
                    </span>
                    <span className="text-[10px] font-mono text-[#6b7480]">
                      Updated 2 mins ago
                    </span>
                  </div>

                  {/* Batch Table */}
                  <div className="border border-dark-border rounded-md overflow-hidden bg-dark-panel">
                    <div className="grid grid-cols-[1.4fr_0.9fr_1.3fr_0.9fr] gap-2 px-3.5 py-2 text-[9.5px] font-mono font-medium text-[#6b7480] uppercase tracking-[0.12em] border-b border-dark-border">
                      <span>Batch Name</span>
                      <span>Units</span>
                      <span>Market Scope</span>
                      <span>Status</span>
                    </div>
                    <div>
                      {batchRows.map((row, i) => (
                        <div
                          key={row.name}
                          className={`grid grid-cols-[1.4fr_0.9fr_1.3fr_0.9fr] gap-2 px-3.5 py-2.5 items-center text-[11.5px] ${
                            i < batchRows.length - 1
                              ? "border-b border-dark-border/60"
                              : ""
                          } tabular-nums`}
                        >
                          <span className="font-medium text-[#f5f9ff] truncate">
                            {row.name}
                          </span>
                          <span className="text-[#6b7480] font-mono text-[11px]">
                            {row.units}
                          </span>
                          <span className="text-[#6b7480] text-[11px]">
                            {row.market}
                          </span>
                          <span
                            className={`inline-flex w-fit items-center h-[18px] px-2 rounded-sm text-[9.5px] font-mono font-semibold ${
                              row.tone === "emerald"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : row.tone === "blue"
                                  ? "bg-blue/20 text-[#7cb7ff]"
                                  : "bg-amber-500/20 text-[#ffd667]"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
