"use client";

import { motion } from "framer-motion";

const VALUES = [
  {
    title: "Manufacturer-first",
    body: "We design for the 50-person factory in Pune or Rajkot, not the 5,000-person OEM. Every feature earns its place by reducing actual work for an actual manufacturer.",
  },
  {
    title: "Verifiability over trust",
    body: "A claim without proof is noise. Every passport we issue is cryptographically signed, blockchain-timestamped, and independently verifiable by anyone with a phone.",
  },
  {
    title: "India + EU, not just EU",
    body: "We're the only platform that starts with Indian compliance and adds EU on top — because that's the real journey. Not the other way around.",
  },
  {
    title: "No black boxes",
    body: "Our compliance validators are deterministic and auditable. We show you exactly which regulation rule failed and why — so you can fix it, not just trust us.",
  },
  {
    title: "Simplicity under complexity",
    body: "EU Battery Regulation is 200 pages. We surface only the 5 things a manufacturer needs to know today. The rest is our problem.",
  },
  {
    title: "Long-term thinking",
    body: "Textile DPP, Carbon Border Adjustment, CSRD supply-chain disclosures — these are coming. We're building the infrastructure that makes each new regulation a feature, not a crisis.",
  },
];

export default function AboutValues() {
  return (
    <section className="py-24 lg:py-32 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            How we think
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-normal tracking-[-0.01em] leading-[1.08] text-crew-ink">
            Principles, not promises.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-6 rounded-2xl border border-crew-border bg-crew-paper-soft"
            >
              <div className="w-8 h-0.5 bg-crew-coral mb-4 rounded-full" />
              <h3 className="font-serif text-[22px] font-normal tracking-[-0.01em] text-crew-ink mb-3 leading-snug">
                {v.title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-[#131313]">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
