"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import TextReveal from "@/components/text-reveal";
import GlowDots from "@/components/illustrations/glow-dots";

const sidebarItems = [
  { label: "Home" },
  { label: "Passports", active: true },
  { label: "Suppliers" },
  { label: "Evidence" },
  { label: "Buyers" },
  { label: "Reports" },
];

const tableRows = [
  { sku: "LFP-B4471", reg: "EU 2023/1542", status: "Ready", tone: "blue" },
  {
    sku: "PACK-M204",
    reg: "Carbon footprint",
    status: "In review",
    tone: "amber",
  },
  { sku: "NMC-C1180", reg: "Due diligence", status: "Ready", tone: "blue" },
  { sku: "TEXT-T889", reg: "EUDR", status: "Ready", tone: "blue" },
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

        {/* ── App window — dark code-editor style ── */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14 lg:mt-16 max-w-[960px] mx-auto"
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
                app.anviora.com
              </span>
              <span className="inline-flex items-center h-5 px-2 rounded-sm bg-blue/15 text-blue text-[10px] font-mono font-medium tracking-wider uppercase">
                Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr]">
              {/* Sidebar */}
              <div className="hidden sm:block px-2 py-3 bg-dark-panel border-r border-dark-border">
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

              {/* Main panel */}
              <div className="px-6 py-5 bg-dark">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-medium text-[#f5f9ff]">
                    Passport readiness
                  </span>
                  <span className="inline-flex items-center h-6 px-2.5 rounded-sm bg-white/5 text-[11px] text-[#6b7480] font-mono">
                    Last 90 days
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-2">
                  <span className="font-heading text-[36px] font-medium tracking-[-0.04em] text-[#f5f9ff] leading-none tabular-nums">
                    84%
                  </span>
                  <span className="inline-flex items-center h-[20px] px-2 mb-1 rounded-sm bg-blue/20 text-[#7cb7ff] text-[10.5px] font-mono font-semibold">
                    +12%
                  </span>
                </div>

                {/* Sparkline */}
                <svg
                  viewBox="0 0 520 80"
                  className="w-full h-[72px] mb-5"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="hero-spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0562ef" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0562ef" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 64 C 48 60, 72 52, 108 54 S 180 40, 216 42 S 288 26, 324 30 S 396 14, 432 16 S 504 6, 520 4 L 520 80 L 0 80 Z"
                    fill="url(#hero-spark)"
                  />
                  <path
                    d="M0 64 C 48 60, 72 52, 108 54 S 180 40, 216 42 S 288 26, 324 30 S 396 14, 432 16 S 504 6, 520 4"
                    fill="none"
                    stroke="#0562ef"
                    strokeWidth="2"
                  />
                </svg>

                {/* Table */}
                <div className="border border-dark-border rounded-md overflow-hidden">
                  <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr] gap-3 px-4 py-2 text-[10px] font-mono font-medium text-[#6b7480] uppercase tracking-[0.14em] border-b border-dark-border">
                    <span>Product</span>
                    <span>Regulation</span>
                    <span>Status</span>
                  </div>
                  <div>
                    {tableRows.map((row, i) => (
                      <div
                        key={row.sku}
                        className={`grid grid-cols-[1.1fr_1.2fr_0.8fr] gap-3 px-4 py-[10px] items-center text-[12px] ${
                          i < tableRows.length - 1
                            ? "border-b border-dark-border"
                            : ""
                        } tabular-nums`}
                      >
                        <span className="font-medium text-[#f5f9ff]">
                          {row.sku}
                        </span>
                        <span className="text-[#6b7480]">{row.reg}</span>
                        <span
                          className={`inline-flex w-fit items-center h-[18px] px-1.5 rounded-sm text-[10px] font-mono font-semibold ${
                            row.tone === "blue"
                              ? "bg-blue/20 text-[#7cb7ff]"
                              : "bg-amber/20 text-[#ffd667]"
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
        </motion.div>
      </div>
    </section>
  );
}
