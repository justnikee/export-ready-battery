"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
    <section className="bg-crew-paper px-3 sm:px-5 lg:px-6 pt-[116px] pb-14">
      {/* Rounded emerald panel */}
      <div className="relative overflow-hidden rounded-[28px] max-w-[1340px] mx-auto">
        {/* Base green gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #0e5a40 0%, #16785a 42%, #4f9e80 78%, #9bc3b0 100%)",
          }}
        />

        {/* Vibrant radial accent (upper right) */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(62% 70% at 72% 36%, rgba(32,158,114,0.85) 0%, rgba(32,158,114,0) 58%)",
          }}
        />

        {/* Soft light glow behind headline */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[520px] opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 65%)",
          }}
        />

        {/* Noise / grain texture */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.22] mix-blend-overlay pointer-events-none"
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
        <div className="relative px-6 pt-20 lg:pt-24">
          {/* Centered copy */}
          <div className="flex flex-col items-center text-center">
            <motion.a
              href="/battery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full text-[13px] font-medium text-white/90 bg-white/15 border border-white/25 hover:bg-white/20 transition-colors mb-8"
            >
              <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-white text-[#0f5a43] text-[11px] font-semibold tracking-wide">
                NEW
              </span>
              EU Battery Passport — mandatory 18 Feb 2027
              <ArrowRight size={13} className="cta-arrow text-white/80" />
            </motion.a>

            <h1 className="font-serif text-white text-[clamp(44px,7vw,82px)] font-normal leading-[1.02] tracking-[-0.01em] max-w-[860px]">
              <TextReveal as="span" className="block">
                Every product deserves
              </TextReveal>
              <TextReveal as="span" className="block italic text-white/95" delay={0.18}>
                a digital identity.
              </TextReveal>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[600px] mt-6 text-[17px] leading-[1.6] text-white/85 font-normal"
            >
              Anviora turns your certificates, supplier records, and factory data into
              verifiable digital product passports — so Indian battery and textile
              manufacturers stay compliant at home and clear customs in Europe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href="/request-access"
                className="group inline-flex items-center justify-center gap-1.5 h-[48px] pl-7 pr-6 rounded-full text-[15px] font-semibold text-[#0f5a43] bg-white hover:bg-[#f1faf5] transition-colors shadow-[0_10px_30px_rgba(7,46,33,0.28)]"
              >
                Request a Demo
                <ArrowRight size={16} className="cta-arrow" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-[48px] px-5 rounded-full text-[15px] font-semibold text-white border border-white/35 hover:bg-white/10 transition-colors"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* Laptop mockup — bleeds off the bottom edge of the panel */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-14 lg:mt-16 -mb-16 max-w-[980px] mx-auto"
          >
            {/* Screen + bezel */}
            <div
              className="rounded-t-[16px] bg-[#10221b] p-[10px] pb-0"
              style={{
                boxShadow:
                  "0 60px 120px -24px rgba(7,46,33,0.4), 0 36px 72px -36px rgba(7,46,33,0.32)",
              }}
            >
              <div className="rounded-t-[8px] bg-white overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 h-10 px-4 border-b border-crew-border bg-crew-paper-soft">
                  <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
                  <span className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
                  <span className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
                  <div className="flex-1 flex justify-center">
                    <span className="inline-flex items-center h-6 px-8 rounded-md bg-white text-[11px] text-crew-muted font-medium border border-crew-border">
                      app.anviora.com
                    </span>
                  </div>
                  <span className="w-[46px]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
                  {/* Sidebar */}
                  <div className="hidden sm:block border-r border-crew-border px-3 py-4 bg-crew-paper-soft">
                    <div className="flex items-center gap-1.5 px-2 mb-5">
                      <span
                        className="w-3.5 h-3.5 rounded-[4px] bg-crew-coral"
                        style={{ transform: "skewX(-10deg)" }}
                      />
                      <span className="text-[12px] font-semibold text-crew-ink">Anviora</span>
                    </div>
                    <div className="grid gap-0.5">
                      {sidebarItems.map((item) => (
                        <div
                          key={item.label}
                          className={`px-2.5 py-[8px] rounded-md text-[12px] font-medium ${
                            item.active
                              ? "bg-crew-coral-soft text-crew-coral"
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
                      <span className="inline-flex items-center h-7 px-3 rounded-md border border-crew-border text-[11px] text-crew-muted font-medium">
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
                      <span className="inline-flex items-center h-[22px] px-2 mb-1 rounded bg-crew-green-soft text-crew-green text-[11px] font-semibold">
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
                    <div className="border border-crew-border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr] gap-3 px-4 py-2.5 bg-crew-paper-soft text-[10.5px] font-semibold text-crew-muted uppercase tracking-wider">
                        <span>Product</span>
                        <span>Regulation</span>
                        <span>Status</span>
                      </div>
                      {tableRows.map((row, i) => (
                        <div
                          key={row.sku}
                          className={`grid grid-cols-[1.1fr_1.2fr_0.8fr] gap-3 px-4 py-[11px] items-center text-[12.5px] ${
                            i < tableRows.length - 1 ? "border-b border-crew-border" : ""
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
