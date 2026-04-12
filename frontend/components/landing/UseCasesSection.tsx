"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
 BISIllustration,
 EPRIllustration,
 EUIllustration,
 PassportIllustration,
 CPCBIllustration,
} from "./illustrations";

const useCases = [
 {
 title: "BIS Certification",
 description:
 "Track and manage BIS certification lifecycle with automated compliance checks and documentation.",
 href: "/compliance",
 Illustration: BISIllustration,
 },
 {
 title: "EPR Obligations",
 description:
 "Monitor EPR targets, recycling data, and compliance status in real time.",
 href: "/compliance",
 Illustration: EPRIllustration,
 },
 {
 title: "EU Battery Regulation",
 description:
 "Generate digital battery passports and meet EU regulatory requirements effortlessly.",
 href: "/docs/compliance",
 Illustration: EUIllustration,
 },
 {
 title: "Digital Battery Passports",
 description:
 "Assign a unique identity to every battery with QR-based public verification.",
 href: "/batches",
 Illustration: PassportIllustration,
 },
 {
 title: "PCB Export Filing",
 description:
 "Export-ready documentation and filings generated automatically.",
 href: "/compliance",
 Illustration: CPCBIllustration,
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

 {/* Bento grid: 1 big (left) + 2 small (right top row), 2 small (bottom row) + 1 tall (right) */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {/* First card — big, spans 2 rows on lg */}
 {(() => {
 const FirstIllustration = useCases[0].Illustration;
 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="lg:row-span-2"
 >
 <Link
 href={useCases[0].href}
 className="group flex flex-col h-full rounded-2xl border overflow-hidden transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div className="w-full h-[220px] lg:flex-1 min-h-[220px] flex items-center justify-center overflow-hidden">
 <FirstIllustration className="w-full h-full" />
 </div>
 <div className="p-6 flex flex-col">
 <h3 className="text-white text-lg mb-2">{useCases[0].title}</h3>
 <p className="text-sm leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
 {useCases[0].description}
 </p>
 <span className="inline-flex items-center gap-1 text-sm mt-4 transition-colors group-hover:brightness-125" style={{ color: "var(--ld-accent)" }}>
 Learn more <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
 </span>
 </div>
 </Link>
 </motion.div>
 );
 })()}

 {/* Remaining 4 cards */}
 {useCases.slice(1).map((uc, i) => {
 const Illust = uc.Illustration;
 return (
 <motion.div
 key={uc.title}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: (i + 1) * 0.07 }}
 >
 <Link
 href={uc.href}
 className="group flex flex-col h-full rounded-2xl border overflow-hidden transition-colors duration-200 hover:border-zinc-600"
 style={{
 borderColor: "var(--ld-border)",
 background: "var(--ld-bg-surface)",
 }}
 >
 <div className="w-full h-[140px] flex items-center justify-center overflow-hidden">
 <Illust className="w-full h-full" />
 </div>
 <div className="p-5 flex flex-col flex-1">
 <h3 className="text-white mb-2">{uc.title}</h3>
 <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--ld-text-muted)" }}>
 {uc.description}
 </p>
 <span className="inline-flex items-center gap-1 text-sm mt-3 transition-colors group-hover:brightness-125" style={{ color: "var(--ld-accent)" }}>
 Learn more <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
 </span>
 </div>
 </Link>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>
 );
}
