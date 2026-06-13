"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const stats = [
  { value: "150+", label: "Indian exporters onboarded" },
  { value: "2,400+", label: "batches compliantly shipped" },
  { value: "12", label: "European markets served" },
  { value: "85%", label: "faster documentation" },
];

export default function Backbone() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-crew-paper-soft">
      <div className="relative z-[2] max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[640px] mb-14"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Proven results
          </div>
          <h2 className="text-[clamp(30px,4vw,42px)] font-semibold tracking-[-0.03em] leading-[1.1] text-crew-ink mb-5">
            <TextReveal as="span" className="block">
              The future of export compliance is here, right now.
            </TextReveal>
          </h2>
          <p className="text-[17px] leading-[1.6] text-crew-muted">
            Indian manufacturers are already using ExportReady to cut documentation
            time, avoid blocked shipments, and win European buyers.
          </p>
          <a
            href="/battery"
            className="group inline-flex items-center gap-1 mt-6 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
          >
            Explore the platform <ArrowRight size={15} className="cta-arrow" />
          </a>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative p-6 rounded-2xl bg-crew-paper border border-crew-border"
            >
              <strong
                className="block text-crew-ink text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] leading-none mb-3"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {s.value}
              </strong>
              <span className="block text-[14px] leading-[1.45] text-crew-muted">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
