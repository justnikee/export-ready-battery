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
    <section className="py-[88px] bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d] text-center mb-10"
        >
          What Goes Into a Battery Passport?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`glow-card bg-white border rounded-xl p-6 transition-all duration-200 hover:shadow-[rgba(0,55,112,0.08)_0_1px_3px,rgba(83,58,253,0.12)_0_12px_32px] ${
                tier.highlight
                  ? "border-[rgba(83,58,253,0.3)] shadow-[rgba(83,58,253,0.08)_0_4px_20px]"
                  : "border-[#e3e8ee]"
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
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(83,58,253,0.1)" }}
                >
                  <tier.icon size={16} className="text-[#533afd]" />
                </div>
                <h3 className="text-[15px] font-medium text-[#0d253d]">
                  {tier.title}
                </h3>
              </div>
              <ul className="space-y-2">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className="text-[13px] text-[#64748d] flex items-start gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#533afd] mt-1.5 shrink-0" />
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
