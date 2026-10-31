"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "18 Feb 2027", label: "EU passport duty (LMT / industrial >2 kWh / EV)" },
  { value: "Art. 13", label: "QR on all batteries from the same date" },
  { value: "Vault", label: "India certificates stored, not filed" },
  { value: "No login", label: "Buyer scans the public page" },
];

export function StatsSection() {
  return (
    <section className="bg-section-subtle py-24">
      <div className="max-w-[1320px] mx-auto px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-widest mb-4 block font-mono text-green-600">
            Platform
          </span>
          <h2 className="text-section-headline text-gray-900 mb-4">
            Built for Production-Scale Manufacturing
          </h2>
          <p className="text-base max-w-[52ch] mx-auto text-gray-600">
            From mid-size producers to enterprise battery exporters —
            Anviora handles multi-thousand-unit batches with zero compliance drift.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-gray-200 bg-white divide-x divide-gray-200">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center py-10 px-4"
            >
              <span className="block text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </span>
              <span className="block text-sm text-gray-600">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Made with Bob
