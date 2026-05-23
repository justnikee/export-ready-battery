"use client";

import { motion } from "framer-motion";
import {
 IndiaComplianceIllustration,
 AuditReadyIllustration,
 ZeroInfraIllustration,
} from "./illustrations";

const values = [
 {
 Illustration: IndiaComplianceIllustration,
 title: "India-First Compliance",
 description:
 "Built specifically for India's EPR, BIS, and PLI requirements — not a generic global tool.",
 },
 {
 Illustration: AuditReadyIllustration,
 title: "Audit-Ready Always",
 description:
 "Every action is tracked with a tamper-proof audit trail for regulatory inspections.",
 },
 {
 Illustration: ZeroInfraIllustration,
 title: "Zero Infrastructure",
 description:
 "No setup required. Start generating compliant battery passports in minutes.",
 },
];

export function ValuesSection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-16">
 {/* Section heading */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center mb-10"
 >
 <span
 className="text-xs uppercase tracking-widest mb-4 block"
 style={{ color: "var(--ld-accent)" }}
 >
 For Manufacturers
 </span>
 <h2 className="text-3xl md:text-4xl text-white">
 Why AnvayaLabs
 </h2>
 </motion.div>

 {/* Value cards — tighter gap */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {values.map((v, i) => {
 const Illust = v.Illustration;
 return (
 <motion.div
 key={v.title}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="rounded-2xl border overflow-hidden transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div className="w-full h-[140px] flex items-center justify-center overflow-hidden">
 <Illust className="w-full h-full" />
 </div>

 <div className="p-5">
 <h3 className="text-white mb-2">{v.title}</h3>
 <p
 className="text-sm leading-relaxed"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {v.description}
 </p>
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>
 );
}
