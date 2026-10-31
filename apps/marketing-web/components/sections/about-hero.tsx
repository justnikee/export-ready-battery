"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutHero() {
  return (
    <section className="relative min-h-[460px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-24 sm:pt-28 pb-12 select-none">
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

      <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 py-8">
        <div className="max-w-[960px]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 sm:mb-6"
          >
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black clip-chamfer">
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                ABOUT ANVIORA
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                Digital Identity Layer for Exporters
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading font-semibold text-[clamp(32px,5vw,72px)] leading-[0.96] tracking-[-0.04em] text-black"
          >
            We&apos;re building the identity layer <span className="block sm:inline">for Indian exports.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 sm:mt-6 max-w-[660px] text-[15px] sm:text-[18px] leading-[1.6] text-black/85 font-medium text-pretty"
          >
            We issue serials, QR, and a public page for Indian pack exporters facing a 2027 EU buyer mandate. We are not a notified body, not CPCB, and not the EU registry.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
