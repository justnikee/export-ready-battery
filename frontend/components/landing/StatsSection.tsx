"use client";

import { motion } from "framer-motion";

const stats = [
 { value: "10,000+", label: "Passports Generated" },
 { value: "99.8%", label: "Compliance Accuracy" },
 { value: "EU + India", label: "Multi-Region Support" },
 { value: "<40ms", label: "API Response Time" },
];

export function StatsSection() {
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
 className="text-xs uppercase tracking-widest mb-4 block font-mono"
 style={{ color: "var(--ld-accent)", letterSpacing: "1.2px" }}
 >
 Platform
 </span>
 <h2 className="text-3xl md:text-4xl text-white mb-4">
 Built for Production-Scale Manufacturing
 </h2>
 <p
 className="text-base max-w-[52ch] mx-auto"
 style={{ color: "var(--ld-text-muted)" }}
 >
 From small manufacturers to enterprise battery exporters —
 ExportReady scales with your operations.
 </p>
 </motion.div>

 {/* Stats row */}
 <div
 className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border divide-x"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 {stats.map((stat, i) => (
 <motion.div
 key={stat.label}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="text-center py-10 px-4"
 style={{
 borderColor: "var(--ld-border)",
 }}
 >
 <span className="block text-3xl md:text-4xl text-white mb-2">
 {stat.value}
 </span>
 <span
 className="block text-sm"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {stat.label}
 </span>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
