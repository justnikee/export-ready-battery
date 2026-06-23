"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Cotton. Polyester. Viscose. Traced.",
    description:
      "Track fiber percentages by batch. Organic vs. conventional. Recycled content. GOTS-certified vs. standard. Every lot documented.",
  },
  {
    title: "Every Dye Lot. Every Color. On Record.",
    description:
      "Log dye chemicals, water usage, and effluent treatment. Link dye batches to finished product lots. Complete chemical traceability.",
  },
  {
    title: "OEKO-TEX. GOTS. BCI. All in One Place.",
    description:
      "Upload certificates. Auto-extract expiry dates. Get 30-day renewal alerts. Never scramble for a missing cert during an audit again.",
  },
  {
    title: "Get ahead of the ESPR mandate.",
    description:
      "The EU's Ecodesign for Sustainable Products Regulation (ESPR) is expected to mandate textile DPPs around 2027–2028. Build the data foundation regulators will ask for now — and be ready the day it lands.",
  },
];

export default function TextileFeatures() {
  return (
    <section className="py-[88px] bg-crew-paper-soft">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glow-card bg-white border border-crew-border rounded-2xl p-6 transition-all duration-200 hover:border-[rgba(21,122,91,0.18)] hover:shadow-[rgba(7,46,33,0.06)_0_1px_3px,rgba(21,122,91,0.12)_0_12px_32px]"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--glow-x",
                  `${e.clientX - rect.left}px`
                );
                e.currentTarget.style.setProperty(
                  "--glow-y",
                  `${e.clientY - rect.top}px`
                );
              }}
            >
              <h3 className="font-serif text-[22px] font-normal leading-[1.2] tracking-[-0.01em] text-crew-ink mb-2">
                {f.title}
              </h3>
              <p className="text-[15px] leading-[1.55] text-crew-muted">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
