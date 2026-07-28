"use client";

import { motion } from "framer-motion";

export default function PricingHero() {
  return (
    <section className="pt-[120px] pb-10 lg:pt-[150px] lg:pb-14 antialiased">
      <div className="max-w-[1232px] mx-auto px-6 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase rounded-none border border-emerald-500/20 mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-600" />
            Transparent Credit Pricing
          </div>
          <h1 className="font-heading text-text text-[clamp(36px,5.2vw,60px)] font-bold tracking-[-0.035em] leading-[1.05] max-w-[800px] text-balance mb-4">
            Plans for Every Scale.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-[1.65] text-text-muted max-w-[580px] text-pretty font-normal">
            No hidden fees. No setup costs. No lock-in — buy only what you use.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
