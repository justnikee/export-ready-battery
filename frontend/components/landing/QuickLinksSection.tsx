"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, FileSpreadsheet, Code, ArrowRight } from "lucide-react";

const cards = [
 {
 icon: Shield,
 title: "Battery Passports",
 description:
 "Generate EU-compliant digital battery passports with QR codes",
 href: "/docs/features",
 },
 {
 icon: CheckCircle2,
 title: "Compliance Hub",
 description:
 "Track BIS, EPR & PLI compliance status in real-time",
 href: "/compliance",
 },
 {
 icon: FileSpreadsheet,
 title: "Export Tools",
 description:
 "One-click CPCB Form 3 export and regulatory filing",
 href: "/exports",
 },
 {
 icon: Code,
 title: "Developer API",
 description:
 "RESTful API for seamless integration with your systems",
 href: "/docs/api-reference",
 },
];

export function QuickLinksSection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-20">
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
 {cards.map((card, i) => (
 <motion.div
 key={card.title}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08 }}
 >
 <Link
 href={card.href}
 className="group flex flex-col h-full rounded-2xl border p-6 transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div
 className="flex items-center justify-center h-12 w-12 rounded-full mb-4"
 style={{ background: "rgba(16,185,129,0.1)" }}
 >
 <card.icon
 className="h-5 w-5"
 style={{ color: "var(--ld-accent)" }}
 />
 </div>

 <h3 className="text-white mb-2">{card.title}</h3>
 <p
 className="text-sm leading-relaxed flex-1"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {card.description}
 </p>

 <span
 className="inline-flex items-center gap-1 text-sm font-medium mt-4 transition-colors group-hover:brightness-125"
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
