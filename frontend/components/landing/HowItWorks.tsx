"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, QrCode, CheckCircle2 } from "lucide-react";

const steps = [
 {
 number: "01",
 icon: Upload,
 title: "Create Batch",
 description:
 "Upload your production data via CSV or connect through the API. Fields are mapped automatically.",
 },
 {
 number: "02",
 icon: Cpu,
 title: "Generate Passports",
 description:
 "Our compliance engine validates data, generates unique digital battery passports with QR codes.",
 },
 {
 number: "03",
 icon: QrCode,
 title: "Track Lifecycle",
 description:
 "Monitor every battery unit from manufacturing to recycling with tamper-proof audit trails.",
 },
 {
 number: "04",
 icon: CheckCircle2,
 title: "Export & Stay Compliant",
 description:
 "Download QR labels, export regulatory documents, and stay audit-ready at all times.",
 },
];

export function HowItWorks() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-24">
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
 How it Works
 </span>
 <h2 className="text-3xl md:text-4xl text-white mb-4">
 From Batch to Compliance in Minutes
 </h2>
 <p
 className="text-base max-w-[48ch] mx-auto"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Four simple steps to fully compliant battery passports.
 </p>
 </motion.div>

 {/* Steps */}
 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
 {steps.map((step, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className="rounded-2xl border p-6 transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 {/* Number + Icon */}
 <div className="flex items-center justify-between mb-5">
 <div
 className="flex items-center justify-center h-12 w-12 rounded-full"
 style={{ background: "rgba(62,207,142,0.1)" }}
 >
 <step.icon
 className="h-5 w-5"
 style={{ color: "var(--ld-accent)" }}
 />
 </div>
 <span
 className="text-2xl"
 style={{ color: "var(--ld-border)" }}
 >
 {step.number}
 </span>
 </div>

 <h3 className="text-white mb-2">{step.title}</h3>
 <p
 className="text-sm leading-relaxed"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {step.description}
 </p>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
