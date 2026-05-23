"use client";

import { motion } from "framer-motion";
import { Shield, Award, CheckCircle, Zap } from "lucide-react";

const signals = [
 {
 icon: Shield,
 label: "EU Regulation 2023/1542 compliant",
 },
 {
 icon: Award,
 label: "Aligned with CPCB guidelines",
 },
 {
 icon: CheckCircle,
 label: "Built for India Battery Aadhaar",
 },
 {
 icon: Zap,
 label: "Starts at ₹4,999/month",
 },
];

export function TrustSignalsSection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-16">
 <div
 className="rounded-2xl border p-8 md:p-10"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {signals.map((signal, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 className="flex items-center gap-3"
 >
 <div
 className="flex items-center justify-center h-10 w-10 rounded-full shrink-0"
 style={{ background: "rgba(62,207,142,0.1)" }}
 >
 <signal.icon
 className="h-4 w-4"
 style={{ color: "var(--ld-accent)" }}
 />
 </div>
 <span className="text-sm text-white">{signal.label}</span>
 </motion.div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}
