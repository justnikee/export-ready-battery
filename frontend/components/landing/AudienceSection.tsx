"use client";

import { motion } from "framer-motion";
import {
 ManufacturerIllustration,
 ExporterIllustration,
 OEMIllustration,
 RecyclerIllustration,
} from "./illustrations";

const audiences = [
 {
 Illustration: ManufacturerIllustration,
 title: "Battery Manufacturers",
 description:
 "Generate compliant passports at production scale. Track every unit from cell to shipment.",
 },
 {
 Illustration: ExporterIllustration,
 title: "Exporters to EU",
 description:
 "Meet EU Battery Regulation requirements with auto-generated digital passports and documentation.",
 },
 {
 Illustration: OEMIllustration,
 title: "EV OEMs",
 description:
 "Receive batteries with verified provenance. Seamless supply chain compliance integration.",
 },
 {
 Illustration: RecyclerIllustration,
 title: "Recycling Companies",
 description:
 "Accept batteries with complete lifecycle history. Simplify end-of-life reporting.",
 },
];

export function AudienceSection() {
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
 Who is this for?
 </span>
 <h2 className="text-3xl md:text-4xl text-white mb-4">
 Built for the Battery Ecosystem
 </h2>
 <p
 className="text-base max-w-[52ch] mx-auto"
 style={{ color: "var(--ld-text-muted)" }}
 >
 From production floor to recycling facility — compliance that
 follows the battery.
 </p>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {audiences.map((audience, i) => {
 const Illust = audience.Illustration;
 return (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
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
 <h3 className="text-white mb-2">{audience.title}</h3>
 <p
 className="text-sm leading-relaxed"
 style={{ color: "var(--ld-text-muted)" }}
 >
 {audience.description}
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
