"use client";

import { motion } from "framer-motion";
import { Layers, Droplets, BadgeCheck, CalendarClock } from "lucide-react";

const features = [
  {
    icon: <Layers size={20} />,
    tint: "bg-crew-coral-soft",
    chip: "bg-white text-crew-coral",
    title: "Cotton. Polyester. Viscose. Traced.",
    description:
      "Track fiber percentages by batch. Organic vs. conventional. Recycled content. GOTS-certified vs. standard. Every lot documented.",
  },
  {
    icon: <Droplets size={20} />,
    tint: "bg-[#eef3fd]",
    chip: "bg-white text-[#1d4ed8]",
    title: "Every dye lot. Every color. On record.",
    description:
      "Log dye chemicals, water usage, and effluent treatment. Link dye batches to finished product lots. Complete chemical traceability.",
  },
  {
    icon: <BadgeCheck size={20} />,
    tint: "bg-[#fdf3e3]",
    chip: "bg-white text-[#b45309]",
    title: "OEKO-TEX. GOTS. BCI. All in one place.",
    description:
      "Upload certificates. Auto-extract expiry dates. Get 30-day renewal alerts. Never scramble for a missing cert during an audit again.",
  },
  {
    icon: <CalendarClock size={20} />,
    tint: "bg-paper",
    chip: "bg-crew-coral-soft text-crew-coral",
    title: "Get ahead of the ESPR mandate.",
    description:
      "The EU's Ecodesign for Sustainable Products Regulation (ESPR) is expected to mandate textile DPPs around 2027–2028. Build the data foundation regulators will ask for now — and be ready the day it lands.",
  },
];

export default function TextileFeatures() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1232px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`rounded-[28px] p-8 transition-transform duration-300 hover:-translate-y-1 ${f.tint}`}
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-6 ${f.chip}`}>
                {f.icon}
              </div>
              <h3 className="font-serif text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-crew-ink mb-2 text-balance">
                {f.title}
              </h3>
              <p className="text-[15px] leading-[1.55] text-crew-ink/70 text-pretty">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
