"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const tickerItems = [
  "EU 2023/1542 READY",
  "W3C VERIFIABLE CREDENTIALS",
  "OPENTIMESTAMPS ANCHORED",
  "BIS & CPCB COMPLIANT",
  "ZERO TELEMETRY LEAK",
  "AUTOMATED DGFT TRACE",
  "100% AUDIT PROOF",
];

export default function Hero() {
  return (
    <section className="relative min-h-[50vh] sm:min-h-[540px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-20 sm:pt-24 select-none">
      {/* ── CRT Scanlines Lines Background (Scoped to Hero) ── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)",
        }}
      />

      {/* ── Right-side Geometric SVG Graphic (Full Height Below Header) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, x: 30 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 sm:top-24 bottom-16 right-0 sm:right-6 lg:right-12 xl:right-16 z-0 pointer-events-none select-none flex items-center justify-end opacity-[0.22] text-black animate-watermark-glitch"
      >
        <svg
          viewBox="0 0 256 256"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto max-h-full aspect-square"
        >
          <path
            d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      {/* ── Radial subtle glow gradient ── */}
      <div className="absolute inset-0 bg-radial from-emerald-400/20 via-transparent to-black/10 pointer-events-none z-0" />

      {/* ── Main Hero Content ── */}
      <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 flex-1 flex flex-col justify-center py-8 sm:py-12">
        <div className="max-w-[960px]">
          {/* Announcement pill / Tag (Solid Sharp Styling without Alpha Blur) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 sm:mb-6"
          >
            <Link
              href="/battery"
              className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black hover:bg-black hover:text-white transition-all clip-chamfer group"
            >
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                NEW
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                EU Battery Passport — mandatory 18 Feb 2027
              </span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Main Display Headline (Strict 2-Line Layout) */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading font-semibold text-[clamp(32px,5.2vw,84px)] leading-[0.96] tracking-[-0.04em] text-black max-w-[1140px]"
          >
            <span className="block sm:inline-block">Every Battery Deserves </span>
            <span className="block sm:inline-block">
              a <span className="animate-text-glitch">Digital Identity.</span>
            </span>
          </motion.h1>

          {/* Subtitle (Balanced for India & EU Compliance) */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 sm:mt-6 max-w-[640px] text-[15px] sm:text-[18px] leading-[1.6] text-black/85 font-medium text-pretty"
          >
            Anviora turns your battery specs, supplier records, and test data into verifiable Digital Product Passports — seamlessly meeting both Indian compliance mandates and EU export regulations.
          </motion.p>

          {/* CTA Buttons (Sharp Solid Styling) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 sm:mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-lg"
            >
              Join Waitlist
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-black bg-transparent border-2 border-black hover:bg-black hover:text-emerald-400 transition-all clip-chamfer press-scale"
            >
              Our Approach
            </a>
          </motion.div>
        </div>
      </div>

      {/* ── Smooth Rotating Marquee Ticker (Full Width, Transparent BG, 14px Uppercase Font) ── */}
      <div className="relative z-0 w-full border-t border-black/20 py-3 overflow-hidden">
        <div className="flex w-max animate-marquee gap-8 items-center text-[14px] font-mono font-normal tracking-wider text-black uppercase select-none">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={`${item}-${idx}`} className="flex items-center gap-8 shrink-0">
              <span>{item}</span>
              <span className="text-black/35 font-bold">-</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
