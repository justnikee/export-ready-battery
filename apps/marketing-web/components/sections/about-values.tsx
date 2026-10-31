"use client";

import { motion } from "framer-motion";

const VALUES = [
  {
    title: "Manufacturer-first",
    body: "We design for the 50-person factory in Pune or Rajkot, not the 5,000-person OEM. Every feature earns its place by reducing actual work for an actual manufacturer.",
  },
  {
    title: "Verifiability over trust",
    body: "A public QR that opens without an account is the proof that matters. Optional hash timestamps and credentials are extras. We do not sell Bitcoin as the product.",
  },
  {
    title: "India + EU, not just EU",
    body: "India certificate vault next to an EU scan page — because that is the pack-house job. We do not file those Indian portals for you.",
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
    body: "February 2027 is identity and QR for certain large batteries. Later clocks (carbon, recycled %, due diligence) get collected when they actually apply — not sold as day-one blockers.",
  },
];

export default function AboutValues() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1232px] mx-auto px-6">
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
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink">
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
              className="p-6 rounded-3xl bg-paper transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="w-8 h-0.5 bg-crew-coral mb-4 rounded-full" />
              <h3 className="font-serif text-[22px] font-semibold tracking-[-0.02em] text-crew-ink mb-3 leading-snug">
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
