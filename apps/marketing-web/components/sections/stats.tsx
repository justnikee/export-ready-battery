"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "150+", label: "Indian exporters onboarded" },
  { value: "₹20L", label: "average consultant cost saved yearly" },
  { value: "12", label: "European markets served" },
  { value: "99.9%", label: "certificate tracking uptime" },
];

export default function Stats() {
  return (
    <section className="bg-white py-16 border-y border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl lg:text-4xl font-semibold text-[#0F172A] tracking-[-0.02em] mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-[#64748B]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
