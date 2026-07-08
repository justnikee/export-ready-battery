"use client";

import { motion } from "framer-motion";

export default function PricingHero() {
  return (
    <section className="pt-[120px] pb-10 lg:pt-[160px] lg:pb-14 bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-light leading-[1.05] text-[#0d253d]">
            Plans for Every Scale.
          </h1>
          <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.55] text-[#64748d]">
            No hidden fees. No setup costs. No lock-in — buy only what you use.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
