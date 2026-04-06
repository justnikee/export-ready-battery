"use client";

import { motion } from "framer-motion";
import {
  Factory,
  Scale,
  Building2,
  FileCheck,
  ArrowUpRight,
} from "lucide-react";

const audiences = [
  {
    icon: Factory,
    title: "Battery Manufacturers",
    description:
      "Generate compliant passports at production. Track every unit from cell to shipment with full lifecycle traceability.",
    benefit: "Export to EU without document risk",
    stat: "10,000+",
    statLabel: "Passports generated",
  },
  {
    icon: Scale,
    title: "Compliance Officers",
    description:
      "Audit-grade records for EPR, PLI, and Battery Regulation enforcement. Always regulator-ready.",
    benefit: "Regulator-ready at all times",
    stat: "99.9%",
    statLabel: "Audit pass rate",
  },
  {
    icon: Building2,
    title: "OEMs & Integrators",
    description:
      "Receive batteries with verified provenance. No retrofitting required. Seamless supply chain compliance.",
    benefit: "Seamless supply chain integration",
    stat: "50+",
    statLabel: "Countries supported",
  },
  {
    icon: FileCheck,
    title: "Recyclers & Collectors",
    description:
      "Accept batteries with complete history. Simplify end-of-life reporting and circular economy compliance.",
    benefit: "Full lifecycle visibility",
    stat: "7",
    statLabel: "Lifecycle states tracked",
  },
];

export function AudienceSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
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
              Who We Serve
            </span>
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-[#0B1F3B] mb-4">
            Built for the full battery ecosystem.
          </h2>
          <p className="text-base text-zinc-600 max-w-[55ch] mx-auto">
            From production floor to recycling facility — compliance that
            follows the battery.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {audiences.map((audience, i) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/50 p-8 transition-all duration-300 hover:border-[#1F7A5F]/30 hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1"
              >
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0B1F3B] to-[#1F7A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-start justify-between mb-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#1F7A5F]/20 to-[#1F7A5F]/5 text-[#1F7A5F] border border-[#1F7A5F]/20 shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#0B1F3B]">
                      {audience.stat}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {audience.statLabel}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">
                  {audience.title}
                </h3>
                <p className="text-zinc-600 leading-relaxed mb-4 text-sm">
                  {audience.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1F7A5F]/10 text-[#1F7A5F] rounded-full text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A5F]" />
                    {audience.benefit}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:text-[#1F7A5F] transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
