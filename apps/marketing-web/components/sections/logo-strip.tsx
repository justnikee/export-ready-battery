"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const standards = [
  "EU Battery Regulation 2023/1542",
  "Battery Passport (BPAN)",
  "BIS IS 16046",
  "CPCB EPR",
  "India BWM Rules 2022",
  "DGFT TRACE",
  "UN38.3 / IEC 62133",
  "REACH",
  "EU ESPR (textile — upcoming)",
];

function StandardChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-crew-paper-soft border border-crew-border">
      <ShieldCheck size={14} className="text-crew-coral shrink-0" />
      <span className="text-[13px] font-medium text-crew-ink whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function LogoStrip() {
  return (
    <section className="py-10 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[13px] text-crew-muted mb-6"
        >
          One platform for every regulation that gets you to market
        </motion.p>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-crew-paper to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-crew-paper to-transparent z-10" />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-4 animate-marquee-slow w-max"
          >
            {[...standards, ...standards, ...standards, ...standards].map((s, i) => (
              <StandardChip key={`${s}-${i}`} label={s} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
