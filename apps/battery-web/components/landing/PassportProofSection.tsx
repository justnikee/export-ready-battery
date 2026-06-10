"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Globe,
  History,
  ShieldCheck,
  QrCode,
  Download,
} from "lucide-react";

const passportFields = [
  { label: "Battery ID", value: "INB-2024-XHFC9", icon: ShieldCheck },
  { label: "Manufacturer", value: "Nexus Power Solutions", icon: null },
  { label: "Cell Chemistry", value: "NMC811 / LFP Hybrid", icon: null },
  { label: "State", value: "IN_USE", icon: null },
  { label: "Capacity", value: "75.8 kWh (±2%)", icon: null },
  { label: "Export Regions", value: "EU, India", icon: Globe },
];

const eventLogs = [
  { event: "MANUFACTURED", actor: "system", timestamp: "2024-08-14T09:00:00Z" },
  {
    event: "SHIPPED",
    actor: "ops@nexus.com",
    timestamp: "2024-09-02T11:22:41Z",
  },
  { event: "IN_USE", actor: "field-api", timestamp: "2024-09-05T15:08:12Z" },
];

export function PassportProofSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#1F7A5F]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-heading text-[#0B1F3B] mb-3">
              Every passport is proof.
            </h2>
            <p className="text-sm text-zinc-600 max-w-[55ch] mx-auto">
              A real Anviora battery passport, structured for audit review.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden shadow-none shadow-zinc-200/50"
          >
            {/* Header */}
            <div className="bg-[#0B1F3B] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[#1F7A5F] animate-pulse" />
                <span className="font-mono text-[13px] text-white font-medium">
                  Battery Passport — INB-2024-XHFC9
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-white/10 px-2 py-1 rounded">
                EU + India Compliant
              </span>
            </div>

            {/* Core fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-zinc-200">
              {passportFields.map((field, i) => {
                const Icon = field.icon;
                return (
                  <div
                    key={i}
                    className="bg-white p-4 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                      {field.label}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {Icon && <Icon className="h-3.5 w-3.5 text-[#1F7A5F]" />}
                      <p className="font-mono text-sm text-zinc-800">
                        {field.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Event log */}
            <div className="border-t border-zinc-200 p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-[#0B1F3B]" />
                <span className="text-xs text-zinc-700 uppercase tracking-wide">
                  Lifecycle Events
                </span>
              </div>
              <div className="space-y-2.5">
                {eventLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 font-mono text-xs text-zinc-600"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1F7A5F]" />
                    <span className="text-[#0B1F3B] font-medium">
                      {log.event}
                    </span>
                    <span className="text-zinc-400">by {log.actor}</span>
                    <span className="ml-auto text-zinc-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 hover:border-[#1F7A5F]/30 hover:shadow-none transition-all duration-300">
              <QrCode className="h-4 w-4" />
              Scan QR Demo
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 hover:border-[#1F7A5F]/30 hover:shadow-none transition-all duration-300">
              <Download className="h-4 w-4" />
              Download Sample PDF
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1F7A5F]" />
              Immutable
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0B1F3B]" />
              Signed
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-400" />
              Regulator-ready
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
