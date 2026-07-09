"use client";

import { motion } from "framer-motion";
import TextReveal from "@/components/text-reveal";

export default function AboutHero() {
  return (
    <section className="relative pt-[140px] pb-20 lg:pt-[180px] lg:pb-28 overflow-hidden bg-crew-paper-soft">
      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(21,122,91,0.18) 0%, transparent 68%)",
        }}
      />

      <div className="relative max-w-[1000px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-crew-border bg-crew-paper mb-7"
        >
          <span className="w-2 h-2 rounded-full bg-crew-coral" />
          <span className="text-[12px] font-semibold text-crew-muted uppercase tracking-[0.08em]">
            About Anviora
          </span>
        </motion.div>

        <h1 className="font-serif text-[clamp(40px,7vw,84px)] font-normal leading-[1.01] tracking-[-0.015em] text-crew-ink">
          <TextReveal as="span" className="block">
            We&apos;re building the identity layer
          </TextReveal>
          <TextReveal as="span" className="block italic text-crew-coral" delay={0.18}>
            for Indian exports.
          </TextReveal>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-7 text-[18px] sm:text-[20px] leading-[1.6] text-[#131313] max-w-[640px] mx-auto"
        >
          Every battery that crosses a border carries a compliance story.
          That story — chemicals, carbon, certifications, supply chain provenance —
          used to live in spreadsheets and email threads.
          We&apos;re turning it into a verifiable digital identity.
        </motion.p>
      </div>
    </section>
  );
}
