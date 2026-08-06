"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import DeadlineCountdown from "@/components/deadline-countdown";
import BatteryPassportCard from "@/components/illustrations/battery-passport-card";

export default function BatteryHero() {
  return (
    <section className="relative min-h-[500px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-24 sm:pt-28 pb-12 select-none">
      {/* CRT Scanlines Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)",
        }}
      />

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-400/20 via-transparent to-black/10 pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black clip-chamfer mb-5">
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                BATTERY DPP
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                EU 2023/1542 & BIS IS 16046
              </span>
            </div>

            <h1 className="font-heading font-semibold text-[clamp(32px,4.8vw,64px)] leading-[0.96] tracking-[-0.04em] text-black mb-4">
              The identity layer <span className="block">for every battery you ship.</span>
            </h1>

            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-black/85 font-medium max-w-[500px] text-pretty">
              EU Battery Regulation 2023/1542. BIS IS 16046. UN38.3. Carbon footprint. One platform, one verifiable record — from cell to recycler.
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
                className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-lg"
              >
                Request a Demo
              </a>
              <a
                href="/#how-it-works"
                className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-black bg-transparent border-2 border-black hover:bg-black hover:text-emerald-400 transition-all clip-chamfer press-scale"
              >
                Our Approach
              </a>
            </motion.div>
          </motion.div>

          {/* Right: animated passport card */}
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
