"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const sidebarItems = [
  { label: "Home" },
  { label: "Passports", active: true },
  { label: "Suppliers" },
  { label: "Evidence" },
  { label: "Buyers" },
  { label: "Reports" },
];

const tableRows = [
  { sku: "LFP-B4471", reg: "EU 2023/1542", status: "Ready", tone: "green" },
  { sku: "PACK-M204", reg: "Carbon footprint", status: "In review", tone: "amber" },
  { sku: "NMC-C1180", reg: "Due diligence", status: "Ready", tone: "green" },
  { sku: "TEXT-T889", reg: "EUDR", status: "Ready", tone: "green" },
];

export default function Hero() {
  return (
    <section className="px-3 sm:px-5 lg:px-6 pt-[108px] pb-14">
      {/* Rounded emerald panel */}
      <div className="relative overflow-hidden rounded-[32px] max-w-[1340px] mx-auto">
        {/* Base green gradient — deep, saturated, no washed-out tail */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, #0a4531 0%, #0f5a43 45%, #157a5b 80%, #1d9670 100%)",
          }}
        />

        {/* Vibrant radial accent (upper right) */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 65% at 75% 28%, rgba(38,175,128,0.55) 0%, rgba(38,175,128,0) 60%)",
          }}
        />

        {/* Soft light glow behind headline */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 65%)",
          }}
        />

        {/* Fine grain, dialed back */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.14] mix-blend-overlay pointer-events-none"
        >
          <filter id="hero-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>

        {/* ── Content ── */}
        <div className="relative px-6 pt-16 lg:pt-20">
          {/* Centered copy */}
          <div className="flex flex-col items-center text-center">
            <motion.a
              href="/battery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full text-[13px] font-medium text-white/90 bg-white/10 hover:bg-white/15 transition-colors mb-8"
            >
              <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-white text-[#0f5a43] text-[11px] font-semibold tracking-wide">
                NEW
              </span>
              EU Battery Passport — mandatory 18 Feb 2027
              <ArrowRight size={13} className="cta-arrow text-white/80" />
            </motion.a>

            <h1 className="font-serif text-white text-[clamp(42px,6.6vw,78px)] font-semibold leading-[1.02] tracking-[-0.03em] max-w-[880px] text-balance">
              <TextReveal as="span" className="block">
                Every product deserves
              </TextReveal>
              <TextReveal as="span" className="block text-white/80" delay={0.18}>
                a digital identity.
              </TextReveal>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[580px] mt-6 text-[16.5px] leading-[1.6] text-white/80 text-pretty"
            >
              Anviora turns your certificates, supplier records, and factory data into
              verifiable digital product passports — compliant at home, cleared in Europe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <a
                href="/request-access"
                className="group inline-flex items-center justify-center gap-1.5 h-[48px] pl-7 pr-6 rounded-full text-[15px] font-semibold text-[#0f5a43] bg-white hover:bg-[#f1faf5] transition-colors"
              >
                Request a Demo
                <ArrowRight size={16} className="cta-arrow" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-[48px] px-6 rounded-full text-[15px] font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* App window — clean, flat, bleeds off the panel's bottom edge */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-14 lg:mt-16 -mb-20 max-w-[960px] mx-auto"
          >
            {/* Floating chips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -top-4 -right-2 sm:right-6 z-10 flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white shadow-[0_8px_24px_rgba(7,46,33,0.25)]"
            >
              <ShieldCheck size={15} className="text-crew-green" />
              <span className="text-[12px] font-semibold text-crew-ink">EU cleared in 10 sec</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-16 -left-2 sm:-left-6 z-10 hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white shadow-[0_8px_24px_rgba(7,46,33,0.25)]"
            >
              <Sparkles size={15} className="text-crew-coral" />
              <span className="text-[12px] font-semibold text-crew-ink">100+ fields auto-parsed</span>
            </motion.div>

            {/* Window */}
            <div
              className="rounded-t-3xl bg-white overflow-hidden ring-1 ring-white/25"
              style={{
                boxShadow:
                  "0 60px 120px -24px rgba(4,30,21,0.5), 0 24px 48px -24px rgba(4,30,21,0.4)",
              }}
            >
              {/* Slim top bar */}
              <div className="flex items-center justify-between h-11 px-5 bg-paper">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-[4px] bg-crew-coral"
                    style={{ transform: "skewX(-10deg)" }}
                  />
                  <span className="text-[12px] font-semibold text-crew-ink">Anviora</span>
                </div>
                <span className="text-[11px] font-medium text-crew-muted">
                  app.anviora.com
                </span>
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-crew-green-soft text-crew-green text-[10.5px] font-semibold">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
                {/* Sidebar */}
                <div className="hidden sm:block px-3 py-4 bg-paper">
                  <div className="grid gap-0.5">
                    {sidebarItems.map((item) => (
                      <div
                        key={item.label}
                        className={`px-2.5 py-[8px] rounded-lg text-[12px] font-medium ${
                          item.active
                            ? "bg-white text-crew-coral"
                            : "text-crew-muted"
                        }`}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main panel */}
                <div className="px-6 py-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[14px] font-semibold text-crew-ink">
                      Passport readiness
                    </span>
                    <span className="inline-flex items-center h-7 px-3 rounded-full bg-paper text-[11px] text-crew-muted font-medium">
                      Last 90 days
                    </span>
                  </div>

                  <div className="flex items-end gap-3 mb-2">
                    <span
                      className="text-[40px] font-bold tracking-[-0.03em] text-crew-ink leading-none"
                      style={{ fontFeatureSettings: '"tnum"' }}
                    >
                      84%
                    </span>
                    <span className="inline-flex items-center h-[22px] px-2 mb-1 rounded-md bg-crew-green-soft text-crew-green text-[11px] font-semibold">
                      +12%
                    </span>
                  </div>

                  {/* Sparkline */}
                  <svg viewBox="0 0 520 80" className="w-full h-[80px] mb-5" aria-hidden="true">
                    <defs>
                      <linearGradient id="hero-spark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#157a5b" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#157a5b" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 64 C 48 60, 72 52, 108 54 S 180 40, 216 42 S 288 26, 324 30 S 396 14, 432 16 S 504 6, 520 4 L 520 80 L 0 80 Z"
                      fill="url(#hero-spark)"
                    />
                    <path
                      d="M0 64 C 48 60, 72 52, 108 54 S 180 40, 216 42 S 288 26, 324 30 S 396 14, 432 16 S 504 6, 520 4"
                      fill="none"
                      stroke="#157a5b"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Table */}
                  <div className="rounded-xl bg-paper overflow-hidden p-1">
                    <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr] gap-3 px-4 py-2.5 text-[10.5px] font-semibold text-crew-muted uppercase tracking-wider">
                      <span>Product</span>
                      <span>Regulation</span>
                      <span>Status</span>
                    </div>
                    <div className="rounded-lg bg-white">
                      {tableRows.map((row, i) => (
                        <div
                          key={row.sku}
                          className={`grid grid-cols-[1.1fr_1.2fr_0.8fr] gap-3 px-4 py-[11px] items-center text-[12.5px] ${
                            i < tableRows.length - 1 ? "border-b border-crew-ink/6" : ""
                          }`}
                          style={{ fontFeatureSettings: '"tnum"' }}
                        >
                          <span className="font-semibold text-crew-ink">{row.sku}</span>
                          <span className="text-crew-muted">{row.reg}</span>
                          <span
                            className={`inline-flex w-fit items-center h-[20px] px-2 rounded-full text-[10.5px] font-semibold ${
                              row.tone === "green"
                                ? "bg-crew-green-soft text-crew-green"
                                : "bg-crew-amber-soft text-crew-amber"
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
      </div>
    </section>
  );
}
