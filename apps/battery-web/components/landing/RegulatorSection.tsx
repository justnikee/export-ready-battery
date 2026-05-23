"use client";

import { motion } from "framer-motion";
import { Globe, FileCheck, ScanLine, History, Shield } from "lucide-react";

const features = [
 {
 icon: Globe,
 title: "Live Data Access",
 description:
 "Regulators retrieve real-time lifecycle data via authenticated QR or secure API endpoints.",
 },
 {
 icon: FileCheck,
 title: "Pre-validated Records",
 description:
 "Every field is validated before ingestion — regulators see compliant data, not error-prone exports.",
 },
 {
 icon: ScanLine,
 title: "Tamper Awareness",
 description:
 "Each record has a provenance signature. Alterations are logged, visible, and permanent.",
 },
 {
 icon: History,
 title: "Full Audit Trail",
 description:
 "All state changes, user actions, and events are retained for complete regulator transparency.",
 },
];

export function RegulatorSection() {
 return (
 <section className="py-24 bg-zinc-50 border-y border-zinc-200 relative overflow-hidden">
 {/* Background decoration */}
 <div className="absolute inset-0 opacity-30">
 <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#1F7A5F]/5 rounded-full blur-3xl" />
 <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#0B1F3B]/5 rounded-full blur-3xl" />
 </div>

 <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
 <div className="max-w-4xl mx-auto text-center mb-12">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 >
 <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B1F3B]/5 border border-[#0B1F3B]/10 rounded-full mb-6">
 <Shield className="h-4 w-4 text-[#0B1F3B]" />
 <span className="text-xs font-medium text-[#0B1F3B]">
 Regulator Ready
 </span>
 </span>
 <h2 className="text-2xl md:text-3xl font-heading text-[#0B1F3B] mb-3">
 Built for regulator inspection.
 </h2>
 <p className="text-sm text-zinc-600 max-w-[55ch] mx-auto">
 Every passport is designed to be directly inspected by EU and
 India authorities — no formatting, no exports.
 </p>
 </motion.div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 {features.map((feature, i) => {
 const Icon = feature.icon;
 return (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="group bg-white rounded-xl border border-zinc-200 p-6 transition-all duration-300 hover:border-[#1F7A5F]/30 hover:shadow-none hover:shadow-zinc-200/50 hover:-translate-y-1"
 >
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3B]/5 border border-[#0B1F3B]/10 text-[#0B1F3B] mb-4 transition-transform duration-300 group-hover:scale-110">
 <Icon className="h-5 w-5" />
 </div>
 <h3 className="text-sm text-[#0B1F3B] mb-2">
 {feature.title}
 </h3>
 <p className="text-sm text-zinc-600 leading-relaxed">
 {feature.description}
 </p>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>
 );
}
