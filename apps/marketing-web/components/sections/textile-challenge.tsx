"use client";

import { motion } from "framer-motion";

export default function TextileChallenge() {
  return (
    <section className="py-[88px] bg-crew-paper">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-normal leading-[1.08] tracking-[-0.01em] text-crew-ink">
              40 SKUs. 12 certificates. One audit.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-[#131313]">
              Textile exporters manage BIS certificates, EU REACH compliance,
              OEKO-TEX documentation, and sustainability reports across dozens of
              SKUs. Every audit is a scramble through spreadsheets and email threads.
            </p>
            <p className="mt-4 text-[16px] leading-[1.6] text-crew-ink font-medium">
              Anviora Textile turns that chaos into a single source of truth.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-crew-paper-soft rounded-2xl p-4 border border-crew-border">
              <div className="text-[11px] text-crew-muted mb-2">Before</div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-crew-border" />
                <div className="h-2 w-[80%] rounded-full bg-crew-border" />
                <div className="h-2 w-[60%] rounded-full bg-crew-border" />
                <div className="h-2 w-[90%] rounded-full bg-crew-border" />
              </div>
              <div className="mt-3 text-[11px] text-[#dc2626]">Scattered data</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[rgba(21,122,91,0.2)] shadow-[rgba(21,122,91,0.08)_0_4px_20px]">
              <div className="text-[11px] text-crew-muted mb-2">After</div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-crew-coral-soft" />
                <div className="h-2 w-[80%] rounded-full bg-crew-coral-soft" />
                <div className="h-2 w-[60%] rounded-full bg-crew-coral-soft" />
                <div className="h-2 w-[90%] rounded-full bg-crew-coral-soft" />
              </div>
              <div className="mt-3 text-[11px] text-crew-coral font-semibold">Unified</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
