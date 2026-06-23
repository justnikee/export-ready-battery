"use client";

import { motion } from "framer-motion";

export default function ValueProp() {
  return (
    <section className="py-20 lg:py-24 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-serif text-balance text-[clamp(28px,3.8vw,42px)] font-normal tracking-[-0.01em] leading-[1.2] text-crew-ink max-w-[720px] mx-auto"
        >
          Compliance is no longer a cost center. It&apos;s how you win the order.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-[16px] leading-[1.6] text-[#131313]"
        >
          Anviora gives a 50-person factory the same regulatory firepower as a Fortune 500 —
          without consultants, spreadsheets, or €100k platforms.
        </motion.p>
      </div>
    </section>
  );
}
