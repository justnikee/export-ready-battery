"use client";

import { motion } from "framer-motion";

export default function PricingHero() {
  return (
    <section className="pt-[120px] pb-10 lg:pt-[160px] lg:pb-14">
      <div className="max-w-[1080px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold tracking-[-0.02em] leading-[1.05] text-crew-ink">
            Plans for Every Scale.
          </h1>
          <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.55] text-crew-muted">
            No hidden fees. No setup costs. No lock-in — buy only what you use.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
