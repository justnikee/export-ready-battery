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
            <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
              Anviora Battery
            </div>

            <h1 className="font-serif text-[clamp(36px,5vw,60px)] font-semibold leading-[1.04] tracking-[-0.02em] text-crew-ink">
              The identity layer for every battery you ship.
            </h1>

            <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[500px]">
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
              className="flex flex-wrap items-center gap-4 mt-7"
            >
              <a
                href="/request-access"
                className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
              >
                Request a Demo
                <ArrowRight size={15} className="cta-arrow" />
              </a>
              <a
                href="/#how-it-works"
                className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
              >
                See how it works <ArrowRight size={14} className="cta-arrow" />
              </a>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {[
                "EU 2023/1542 ready",
                "BIS IS 16046",
                "W3C Verifiable Credentials",
                "OpenTimestamps anchored",
              ].map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-[12px] text-crew-muted"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-crew-coral" />
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
