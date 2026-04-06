"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "10,000+", label: "Passports Generated" },
  { value: "99.8%", label: "Compliance Score" },
  { value: "3", label: "Markets Supported", sub: "India · EU · Global" },
  { value: "<40ms", label: "API Response Time" },
];

export function StatsSection() {
  return (
    <section
      className="relative border-t overflow-hidden"
      style={{
        background: "var(--ld-bg-dark)",
        borderColor: "var(--ld-border)",
      }}
    >
      {/* Background illustration placeholder */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-900/30">
        <span className="text-zinc-800 text-sm">
          Stats Background Illustration
        </span>
      </div>

      <div className="relative z-10 max-w-[1320px] mx-auto px-6 py-24">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-4 block"
            style={{ color: "var(--ld-accent)" }}
          >
            Platform
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Built for scale
          </h2>
          <p
            className="text-base max-w-[48ch] mx-auto"
            style={{ color: "var(--ld-text-muted)" }}
          >
            Trusted infrastructure powering battery compliance at production
            scale.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`text-center px-4 ${
                i > 0
                  ? "md:border-l"
                  : ""
              }`}
              style={{ borderColor: "var(--ld-border)" }}
            >
              <span className="block text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </span>
              <span
                className="block text-sm"
                style={{ color: "var(--ld-text-muted)" }}
              >
                {stat.label}
              </span>
              {stat.sub && (
                <span
                  className="block text-xs mt-1"
                  style={{ color: "var(--ld-text-muted)" }}
                >
                  {stat.sub}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
