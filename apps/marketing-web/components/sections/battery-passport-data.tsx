"use client";

import { motion } from "framer-motion";
import { QrCode, Lock, Shield, Signal } from "lucide-react";

const tiers = [
  {
    title: "Public (QR Scan)",
    icon: QrCode,
    items: [
      "Manufacturer ID, battery chemistry",
      "Carbon footprint total",
      "Recycled content %",
      "Rated capacity, voltage ranges",
      "Warranty period",
      "EU Declaration of Conformity",
    ],
    highlight: true,
  },
  {
    title: "Legitimate Interest",
    icon: Lock,
    items: [
      "Cathode/anode/electrolyte composition",
      "Part numbers for replacement",
      "Dismantling diagrams",
      "Tools required, safety measures",
    ],
  },
  {
    title: "Authorities",
    icon: Shield,
    items: [
      "Complete test reports",
      "Notified body assessments",
      "Market surveillance data",
    ],
  },
  {
    title: "Individual Battery",
    icon: Signal,
    items: [
      "Real-time performance",
      "State of health (SoH)",
      "Lifecycle event log",
    ],
  },
];

export default function BatteryPassportData() {
  return (
    <section className="py-[88px] bg-crew-paper-soft">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink text-center mb-10"
        >
          What goes into a Battery Passport?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`glow-card bg-white border rounded-2xl p-6 transition-all duration-200 hover:shadow-[rgba(7,46,33,0.06)_0_1px_3px,rgba(21,122,91,0.12)_0_12px_32px] ${
                tier.highlight
                  ? "border-[rgba(21,122,91,0.3)] shadow-[rgba(21,122,91,0.08)_0_4px_20px]"
                  : "border-crew-border"
              }`}
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-crew-coral-soft">
                  <tier.icon size={16} className="text-crew-coral" />
                </div>
                <h3 className="text-[15px] font-semibold text-crew-ink">
                  {tier.title}
                </h3>
              </div>
              <ul className="space-y-2">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className="text-[13px] text-crew-muted flex items-start gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-crew-coral mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
