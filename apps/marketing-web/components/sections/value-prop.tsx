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
          className="text-[clamp(24px,3.4vw,36px)] font-semibold tracking-[-0.025em] leading-[1.25] text-crew-ink max-w-[760px] mx-auto"
        >
          ExportReady simplifies the compliance workflow without sacrificing the rigour
          European buyers and regulators demand.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-[15px] text-crew-muted"
        >
          Loved by export managers. Trusted by compliance teams. Built for Indian manufacturers.
        </motion.p>
      </div>
    </section>
  );
}
