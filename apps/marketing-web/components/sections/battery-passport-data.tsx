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
    <section className="py-20 lg:py-28 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-text text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.035em] text-center mb-12 text-balance"
        >
          What goes into a Battery Passport?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-none p-7 lg:p-8 transition-all duration-300 hover:-translate-y-1 ${
                tier.highlight
                  ? "bg-blue text-white shadow-xl"
                  : "bg-white border border-border text-slate-900 hover:border-border-strong"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-10 h-10 rounded-none flex items-center justify-center ${
                    tier.highlight ? "bg-white/15 text-emerald-300" : "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"
                  }`}
                >
                  <tier.icon size={18} />
                </div>
                <h3 className={`font-heading text-[18px] font-bold ${tier.highlight ? "text-white" : "text-slate-950"}`}>
                  {tier.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className={`text-[14px] flex items-start gap-2.5 ${
                      tier.highlight ? "text-white/90" : "text-text-muted"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-none mt-2 shrink-0 ${tier.highlight ? "bg-emerald-300" : "bg-emerald-600"}`} />
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
