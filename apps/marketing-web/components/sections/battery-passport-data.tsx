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
    <section className="py-20 lg:py-28">
      <div className="max-w-[1232px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink text-center mb-12 text-balance"
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
              className={`rounded-[28px] p-7 lg:p-8 transition-transform duration-300 hover:-translate-y-1 ${
                tier.highlight ? "bg-crew-coral-soft" : "bg-paper"
              }`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tier.highlight ? "bg-white" : "bg-crew-coral-soft"
                  }`}
                >
                  <tier.icon size={17} className="text-crew-coral" />
                </div>
                <h3 className="text-[16px] font-semibold text-crew-ink">
                  {tier.title}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className="text-[13.5px] text-crew-ink/70 flex items-start gap-2.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-crew-coral mt-2 shrink-0" />
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
