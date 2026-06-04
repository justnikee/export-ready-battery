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
    title: "Ready for the 2028 Mandate.",
    description:
      "The EU Ecodesign for Sustainable Products Regulation (ESPR) will mandate textile DPPs in late 2028. Get ahead now. Build your data foundation before the deadline.",
  },
];

export default function TextileFeatures() {
  return (
    <section className="py-[88px] bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glow-card bg-white border border-[#e3e8ee] rounded-xl p-6 transition-all duration-200 hover:border-[rgba(83,58,253,0.18)] hover:shadow-[rgba(0,55,112,0.08)_0_1px_3px,rgba(83,58,253,0.12)_0_12px_32px]"
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
              <h3 className="text-[17px] font-medium leading-[1.25] text-[#0d253d] mb-2">
                {f.title}
              </h3>
              <p className="text-[13px] leading-[1.48] text-[#64748d]">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
