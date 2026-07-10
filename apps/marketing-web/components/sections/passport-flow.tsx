"use client";

/**
 * PassportFlow section
 * ─────────────────────
 * Replaces the generic "How it Works" with the animated
 * PassportJourney visualization and a clear narrative.
 *
 * Used on the homepage between the hero and the problem section.
 */

import { motion } from "framer-motion";
import PassportJourney from "@/components/illustrations/passport-journey";
import TextReveal from "@/components/text-reveal";

export default function PassportFlow() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-[680px] mx-auto mb-16"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            From factory floor to EU shelf
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink text-balance">
            <TextReveal as="span" className="block">
              Four steps. No consultants.
            </TextReveal>
            <TextReveal as="span" className="block text-crew-coral" delay={0.15}>
              No 200-page regulation PDFs.
            </TextReveal>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-4 text-[16px] leading-[1.6] text-crew-muted"
          >
            Upload your certificates. Anviora validates against live EU and India
            regulations, issues a signed verifiable credential, and gives you a QR
            code your buyer scans in 10 seconds to confirm compliance.
          </motion.p>
        </motion.div>

        {/* Animated journey */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-[28px] bg-paper px-6 py-10 sm:px-10 sm:py-12"
        >
          <PassportJourney />
        </motion.div>

        {/* Supporting stats */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "100+", label: "fields auto-extracted from your certificates" },
            { value: "10 sec", label: "for a buyer to scan and verify compliance" },
            { value: "₹0", label: "in consultants needed for initial setup" },
            { value: "1", label: "dataset satisfies India + EU regulators" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="rounded-3xl bg-crew-coral-soft px-6 py-7"
            >
              <div className="font-serif text-[clamp(28px,3.5vw,40px)] font-semibold tracking-[-0.02em] text-crew-coral">
                {stat.value}
              </div>
              <div className="mt-1.5 text-[13px] text-crew-ink/70 leading-snug text-pretty">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
