"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import DeadlineCountdown from "@/components/deadline-countdown";
import BatteryPassportCard from "@/components/illustrations/battery-passport-card";
import GlowDots from "@/components/illustrations/glow-dots";

export default function BatteryHero() {
  return (
    <section className="relative pt-[120px] pb-20 lg:pt-[152px] lg:pb-[96px] overflow-hidden">
      {/* Glowing dot grid background */}
      <GlowDots />

      {/* Subtle background grain */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none"
      >
        <filter id="bh-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#bh-grain)" />
      </svg>

      <div className="relative max-w-[1232px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left: copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase rounded-none border border-emerald-500/20 mb-5">
              <span className="w-1.5 h-1.5 bg-emerald-600" />
              Anviora Battery
            </div>

            <h1 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-bold tracking-[-0.035em] leading-[1.05] mb-5">
              The identity layer for every battery you ship.
            </h1>

            <p className="text-[16px] sm:text-[17px] leading-[1.65] text-text-muted max-w-[500px] text-pretty">
              EU Battery Regulation 2023/1542. BIS IS 16046. UN38.3. Carbon
              footprint. One platform, one verifiable record — from cell to recycler.
            </p>

            {/* Inline countdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6"
            >
              <DeadlineCountdown variant="inline" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-4 mt-8"
            >
              <a
                href="/request-access"
                className="group inline-flex items-center justify-center gap-2 h-[48px] px-7 rounded-none text-[14.5px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
              >
                Request a Demo
                <ArrowRight size={15} className="cta-arrow" />
              </a>
              <a
                href="/#how-it-works"
                className="group inline-flex items-center justify-center gap-1.5 h-[48px] px-6 rounded-none text-[14.5px] font-semibold text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                See how it works <ArrowRight size={14} className="cta-arrow text-slate-500" />
              </a>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 border-t border-border/60"
            >
              {[
                "EU 2023/1542 ready",
                "BIS IS 16046",
                "W3C Credentials",
                "OpenTimestamps",
              ].map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-2 font-mono text-xs text-text-dim uppercase tracking-wider"
                >
                  <span className="w-1.5 h-1.5 bg-emerald-600" />
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: animated passport card (below copy on mobile) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 lg:mt-0"
          >
            <BatteryPassportCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
