"use client";

import { motion } from "framer-motion";
import TextReveal from "@/components/text-reveal";
import CountUp from "@/components/count-up";

const stats = [
  {
    to: 100,
    suffix: "+",
    label: "Fields auto-extracted from a single certificate",
  },
  {
    to: 2,
    suffix: "",
    label: "Regulators, one dataset — India and the EU",
  },
  {
    to: 75,
    suffix: "%",
    label: "Of platform cost reimbursable via DGFT TRACE",
  },
];

export default function Backbone() {
  return (
    <section className="relative py-16 lg:py-24 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="rounded-[28px] bg-crew-paper-soft border border-crew-border px-7 sm:px-12 lg:px-16 py-12 lg:py-16">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3"
          >
            What you get
          </motion.div>

          {/* Headline */}
          <h2 className="font-serif text-crew-ink text-[clamp(34px,5vw,56px)] font-normal leading-[1.05] tracking-[-0.01em] max-w-[760px]">
            <TextReveal as="span" className="inline">
              The future of export compliance is here,
            </TextReveal>{" "}
            <TextReveal as="span" className="inline italic" delay={0.15}>
              right now.
            </TextReveal>
          </h2>

          {/* Stats */}
          <div className="mt-16 lg:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-y-10">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="sm:border-l border-crew-border sm:pl-7 lg:pl-9"
              >
                <CountUp
                  to={s.to}
                  suffix={s.suffix}
                  className="block text-crew-ink text-[clamp(52px,6vw,80px)] font-medium tracking-[-0.04em] leading-none"
                />
                <span className="block mt-5 max-w-[230px] text-[15px] leading-[1.45] text-crew-muted">
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
