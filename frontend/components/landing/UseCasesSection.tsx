"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
 Shield,
 Recycle,
 Globe,
 QrCode,
 FileText,
} from "lucide-react";

const useCases = [
 {
 icon: Shield,
 title: "BIS Certification",
 description:
 "Track and manage BIS certification lifecycle with automated compliance checks and documentation.",
 href: "/compliance",
 },
 {
 icon: Recycle,
 title: "EPR Obligations",
 description:
 "Monitor EPR targets, recycling data, and compliance status in real time.",
 href: "/compliance",
 },
 {
 icon: Globe,
 title: "EU Battery Regulation",
 description:
 "Generate digital battery passports and meet EU regulatory requirements effortlessly.",
 href: "/docs/compliance",
 },
 {
 icon: QrCode,
 title: "Digital Battery Passports",
 description:
 "Assign a unique identity to every battery with QR-based public verification.",
 href: "/batches",
 },
 {
 icon: FileText,
 title: "PCB Export Filing",
 description:
 "Export-ready documentation and filings generated automatically.",
 href: "/compliance",
 },
];

export function UseCasesSection() {
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
 Use Cases
 </span>
 <h2 className="text-3xl md:text-4xl text-white mb-4">
 Compliance Made Simple
 </h2>
 <p
 className="text-base max-w-[52ch] mx-auto"
 style={{ color: "var(--ld-text-muted)" }}
 >
 From BIS certification to EU digital passports — every compliance
 workflow your manufacturing line needs, in one platform.
 </p>
 </motion.div>

 {/* Cards grid */}
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {useCases.map((uc, i) => (
 <motion.div
 key={uc.title}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.07 }}
 >
 <Link
 href={uc.href}
 className="group flex flex-col h-full rounded-2xl border p-6 transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div
 className="flex items-center justify-center h-12 w-12 rounded-full mb-4"
 style={{ background: "rgba(62,207,142,0.1)" }}
 >
 <uc.icon
 className="h-5 w-5"
 style={{ color: "var(--ld-accent)" }}
 />
 </div>

 <h3 className="text-white mb-2">{uc.title}</h3>
 <p
 className="text-sm leading-relaxed flex-1"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {uc.description}
 </p>

 <span
 className="inline-flex items-center gap-1 text-sm mt-4 transition-colors group-hover:brightness-125"
 style={{ color: "var(--ld-accent)" }}
 >
 Learn more
 <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
 </span>
 </Link>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
