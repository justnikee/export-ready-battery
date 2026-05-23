"use client";

import { motion } from "framer-motion";
import { Layers, Shield, Globe2, Scale, ArrowRight } from "lucide-react";

const principles = [
  {
    icon: Layers,
    title: "Lifecycle-first",
    description:
      "Every battery follows a strict state machine — not editable status tags.",
    color: "from-[#0B1F3B] to-[#1a3a5c]",
    accentColor: "text-[#0B1F3B]",
    bgColor: "bg-[#0B1F3B]/5",
  },
  {
    icon: Shield,
    title: "Audit-grade by default",
    description:
      "All changes are logged, attributed, and preserved as evidence.",
    color: "from-[#1F7A5F] to-[#2a9d75]",
    accentColor: "text-[#1F7A5F]",
    bgColor: "bg-[#1F7A5F]/10",
  },
  {
    icon: Globe2,
    title: "India + EU native",
    description:
      "Built for BPAN, EPR, BIS, and EU Battery Regulation — not retrofitted.",
    color: "from-[#0B1F3B] to-[#1a3a5c]",
    accentColor: "text-[#0B1F3B]",
    bgColor: "bg-[#0B1F3B]/5",
  },
  {
    icon: Scale,
    title: "Enforcement over flexibility",
    description: "If a regulator screenshots it, it holds up.",
    color: "from-[#1F7A5F] to-[#2a9d75]",
    accentColor: "text-[#1F7A5F]",
    bgColor: "bg-[#1F7A5F]/10",
  },
];

export function PrinciplesSection() {
  return (
    <section className="py-24 bg-zinc-50 border-y border-zinc-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1F7A5F]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0B1F3B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F7A5F]/10 border border-[#1F7A5F]/20 rounded-full mb-6">
            <span className="text-xs font-medium text-[#1F7A5F]">
              Our Approach
            </span>
          </span>
          <h2 className="text-3xl md:text-4xl font-heading text-[#0B1F3B] mb-4">
            Designed around regulation, not convenience.
          </h2>
          <p className="text-base text-zinc-600 max-w-[55ch] mx-auto">
            Core principles that make AnvayaLabs audit-ready from day one.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((principle, i) => {
            const Icon = principle.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 transition-all duration-300 hover:border-[#1F7A5F]/30 hover:shadow-none hover:shadow-zinc-200/50 hover:-translate-y-1"
              >
                {/* Gradient Top Border */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${principle.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="flex items-start gap-5">
                  <div
                    className={`inline-flex items-center justify-center h-14 w-14 rounded-xl ${principle.bgColor} ${principle.accentColor} shrink-0 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.15em] text-zinc-400 mb-2">
                      {principle.title}
                    </p>
                    <p className="text-base text-zinc-700 leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className={`h-5 w-5 ${principle.accentColor}`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
