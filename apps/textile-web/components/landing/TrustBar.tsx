"use client";

import { motion } from "framer-motion";

const partnerLogos = [
 "Nexus Power",
 "EcoCell",
 "GreenTech",
 "BatteryCorp",
 "PowerFlow",
 "CellTech",
];

export function TrustBar() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-12">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.5, delay: 0.3 }}
 className="text-center"
 >
 <p
 className="text-xs uppercase tracking-widest mb-6"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Trusted by leading battery manufacturers
 </p>
 <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
 {partnerLogos.map((logo, i) => (
 <span
 key={i}
 className="text-sm tracking-tight transition-colors hover:text-zinc-400"
 style={{ color: "var(--ld-border)" }}
 >
 {logo}
 </span>
 ))}
 </div>
 </motion.div>
 </div>
 </section>
 );
}
