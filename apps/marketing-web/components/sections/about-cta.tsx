"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function AboutCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1232px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-serif text-[clamp(32px,5vw,58px)] font-semibold tracking-[-0.015em] leading-[1.06] text-crew-ink mb-6">
            If you&apos;re exporting batteries to Europe, we should talk.
          </h2>
          <p className="text-[17px] leading-[1.6] text-[#131313] mb-10 max-w-[520px] mx-auto">
            The deadline is real for LMT, industrial packs above 2 kWh, and EV.
            We help you issue the first scannable lot — we do not certify the battery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/request-access"
              className="group inline-flex items-center justify-center gap-1.5 h-[48px] pl-7 pr-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
            >
              Request a Demo
              <ArrowRight size={16} className="cta-arrow" />
            </a>
            <a
              href="/battery"
              className="inline-flex items-center justify-center h-[48px] px-6 rounded-full text-[15px] font-semibold text-crew-coral border border-crew-coral/30 hover:bg-crew-coral-soft transition-colors"
            >
              Explore the Battery Platform
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
