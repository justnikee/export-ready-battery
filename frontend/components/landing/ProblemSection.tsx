"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ShieldAlert,
  FileWarning,
  Gavel,
  AlertTriangle,
} from "lucide-react";

const problems = [
  {
    icon: FileWarning,
    title: "Dynamic Data Required",
    text: "EU Battery Passports require dynamic lifecycle data, not static PDFs",
    impact: "High Risk",
  },
  {
    icon: ShieldAlert,
    title: "Retroactive Audits",
    text: "India EPR audits are retroactive and evidence-driven",
    impact: "Critical",
  },
  {
    icon: Gavel,
    title: "Immutable Records",
    text: "Deleting or editing records is non-compliant by design",
    impact: "High Risk",
  },
];

export function ProblemSection() {
  return (
    <section className="relative bg-white py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,rgba(11,31,59,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,31,59,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-full">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">
                Critical Risk
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-[#0B1F3B] leading-tight">
              Battery compliance isn't paperwork.
              <span className="block text-rose-600 mt-2">
                It's legal liability.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-[50ch]">
              A single missing field, invalid lifecycle event, or unverifiable
              QR scan can block exports, fail EU audits, or invalidate PLI
              claims — even years later.
            </p>

            {/* Risk Meter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="pt-4"
            >
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <span className="font-medium">Compliance Risk Level:</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-8 rounded-full bg-rose-500" />
                  <div className="h-2 w-8 rounded-full bg-rose-500" />
                  <div className="h-2 w-8 rounded-full bg-rose-500" />
                  <div className="h-2 w-8 rounded-full bg-rose-200" />
                  <div className="h-2 w-8 rounded-full bg-rose-200" />
                </div>
                <span className="font-semibold text-rose-600">High</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Problem Cards */}
          <div className="space-y-4">
            {problems.map((problem, i) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-xl border border-zinc-200 p-5 transition-all duration-300 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/50 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-500 shrink-0 transition-colors group-hover:bg-rose-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[#0B1F3B]">
                          {problem.title}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            problem.impact === "Critical"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {problem.impact}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        {problem.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
