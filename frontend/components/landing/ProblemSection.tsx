"use client";

import { motion } from "framer-motion";
import { FileWarning, Search, Layers, ShieldOff } from "lucide-react";

const problems = [
  {
    icon: Layers,
    text: "Multiple regulations (EU + India)",
  },
  {
    icon: FileWarning,
    text: "Manual documentation and spreadsheets",
  },
  {
    icon: ShieldOff,
    text: "Audit risks and compliance gaps",
  },
  {
    icon: Search,
    text: "Lack of traceability across lifecycle",
  },
];

export function ProblemSection() {
  return (
    <section style={{ background: "var(--ld-bg-dark)" }}>
      <div className="max-w-[1320px] mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span
              className="text-xs uppercase tracking-widest block font-mono"
              style={{ color: "var(--ld-accent)", letterSpacing: "1.2px" }}
            >
              The Problem
            </span>

            <h2 className="text-3xl md:text-4xl text-white leading-tight">
              Battery compliance is fragmented,{" "}
              <span style={{ color: "var(--ld-accent)" }}>
                manual, and error-prone.
              </span>
            </h2>

            <p
              className="text-base leading-relaxed max-w-[50ch]"
              style={{ color: "var(--ld-text-muted)" }}
            >
              Manufacturers struggle with overlapping regulations, manual
              documentation, and the constant risk of audit failure. A single
              missing field can block exports or invalidate PLI claims.
            </p>
          </motion.div>

          {/* Right — Problem list */}
          <div className="space-y-3">
            {problems.map((problem, i) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 rounded-xl border p-5 transition-colors duration-200 hover:border-zinc-600"
                  style={{
                    borderColor: "var(--ld-border)",
                    background: "var(--ld-bg-surface)",
                  }}
                >
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-full shrink-0"
                    style={{ background: "rgba(239,68,68,0.1)" }}
                  >
                    <Icon className="h-5 w-5 text-red-400" />
                  </div>
                  <p className="text-sm text-white">{problem.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
