"use client";

import { motion } from "framer-motion";
import { Shield, FileCheck, Cloud } from "lucide-react";

const values = [
 {
 icon: Shield,
 title: "India-First Compliance",
 description:
 "Built specifically for India's EPR, BIS, and PLI requirements — not a generic global tool.",
 },
 {
 icon: FileCheck,
 title: "Audit-Ready Always",
 description:
 "Every action is tracked with a tamper-proof audit trail for regulatory inspections.",
 },
 {
 icon: Cloud,
 title: "Zero Infrastructure",
 description:
 "No setup required. Start generating compliant battery passports in minutes.",
 },
];

export function ValuesSection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-24">
 {/* Section heading */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center mb-16"
 >
 <span
 className="text-xs uppercase tracking-widest mb-4 block"
 style={{ color: "var(--ld-accent)" }}
 >
 For Manufacturers
 </span>
 <h2 className="text-3xl md:text-4xl text-white">
 Why ExportReady
 </h2>
 </motion.div>

 {/* Value cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {values.map((v, i) => (
 <motion.div
 key={v.title}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="rounded-2xl border p-6 transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div
 className="flex items-center justify-center h-12 w-12 rounded-full mb-4"
 style={{ background: "rgba(16,185,129,0.1)" }}
 >
 <v.icon
 className="h-5 w-5"
 style={{ color: "var(--ld-accent)" }}
 />
 </div>

 <h3 className="text-white mb-2">{v.title}</h3>
 <p
 className="text-sm leading-relaxed"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {v.description}
 </p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
