"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BatteryCTA() {
  return (
    <section className="px-3 sm:px-5 lg:px-6 pb-20 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[32px] max-w-[1340px] mx-auto bg-gradient-to-br from-[#0e5a40] via-[#127055] to-[#1d9670] px-6 py-16 sm:px-12 lg:py-20 text-center"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.14) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-white text-balance">
            Ship your first compliant battery this month.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-white/75">
            No setup fee. No lock-in. Buy only the passport credits you need.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <a
              href="/request-access"
              className="group inline-flex items-center justify-center gap-1.5 h-[46px] px-7 rounded-full text-[15px] font-semibold text-crew-ink bg-white hover:bg-white/90 transition-colors"
            >
              Request a Demo
              <ArrowRight size={15} className="cta-arrow" />
            </a>
            <a
              href="/pricing"
              className="group inline-flex items-center gap-1 text-[15px] font-semibold text-white hover:text-white/80 transition-colors"
            >
              See pricing <ArrowRight size={14} className="cta-arrow" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
