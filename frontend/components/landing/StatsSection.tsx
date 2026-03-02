"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Users, Flame } from "lucide-react";

const problems = [
  {
    Icon: AlertTriangle,
    label: "EU Compliance Deadlines",
    description:
      "Mandatory Digital Battery Passport implementation deadlines are approaching. Non-compliant imports will be blocked at customs.",
    stat: "Feb 2027",
    statLabel: "EU enforcement date",
  },
  {
    Icon: Users,
    label: "India Battery Aadhaar",
    description:
      "New EPR and BIS certification requirements demand granular traceability for every unit sold in the Indian market.",
    stat: "Active",
    statLabel: "enforcement status",
  },
  {
    Icon: Flame,
    label: "Audit Pressure",
    description:
      "Regulatory bodies are increasing audit frequency. Manual record-keeping is no longer sufficient for enterprise scale.",
    stat: "3×",
    statLabel: "audit increase YoY",
  },
];

export function StatsSection() {
  return (
    <section
      className="py-24 border-b overflow-hidden"
      style={{
        background: "var(--ld-bg-surface)",
        borderColor: "var(--ld-border)",
      }}
    >
      <div className="mx-auto w-full max-w-[1320px] px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Battery regulation is accelerating globally.
          </h2>
          <p className="text-base max-w-[56ch]" style={{ color: "var(--ld-text-muted)" }}>
            Failure to comply with emerging standards risks immediate market exclusion and supply chain paralysis.
          </p>
        </motion.div>

        {/* Horizontal scroll strip — no grid */}
        <div
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {problems.map(({ Icon, label, description, stat, statLabel }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="snap-start shrink-0 flex flex-col rounded-2xl border overflow-hidden"
              style={{
                width: "min(360px, 80vw)",
                background: "var(--ld-bg-mid)",
                borderColor: "var(--ld-border)",
              }}
            >
              {/* Top stat banner */}
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "var(--ld-border)" }}
              >
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(14,163,113,0.12)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "var(--ld-accent)" }} />
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-black text-white">{stat}</span>
                  <span className="block text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--ld-text-muted)" }}>{statLabel}</span>
                </div>
              </div>
              {/* Body */}
              <div className="px-6 py-5 flex-1">
                <h3 className="text-sm font-bold text-white mb-2">{label}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll hint on mobile */}
        <p className="mt-3 text-[10px] text-center md:hidden" style={{ color: "var(--ld-text-muted)" }}>
          ← scroll →
        </p>
      </div>
    </section>
  );
}
