"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const reasons = [
 {
 point: "Audit-grade by default",
 description:
 "Not a feature you enable — it's the only mode. Every record is forensic-grade from the first write.",
 us: true,
 them: false,
 },
 {
 point: "India + EU native",
 description:
 "Built for BPAN, EPR, BIS, and EU Battery Regulation simultaneously — no switching between tools.",
 us: true,
 them: false,
 },
 {
 point: "Immutable lifecycle state machine",
 description:
 "Batteries move through states — manufactured → sold → end-of-life. States can't be edited, only advanced.",
 us: true,
 them: false,
 },
 {
 point: "Regulator-ready QR codes",
 description:
 "QR links to a public passport page that regulators, recyclers, and customs can verify without an account.",
 us: true,
 them: "partial",
 },
 {
 point: "Zero-config compliance updates",
 description:
 "When regulations change, ExportLens updates schemas automatically. No migration, no developer work.",
 us: true,
 them: false,
 },
 {
 point: "Retroactive evidence audit mode",
 description:
 "India EPR audits are retroactive. ExportLens preserves and presents historical evidence on demand.",
 us: true,
 them: false,
 },
];

export function WhySection() {
 return (
 <section
 className="py-24 border-b"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div className="mx-auto w-full max-w-[1320px] px-6">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="mb-16 text-center"
 >
 <span
 className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border mb-6"
 style={{
 background: "var(--ld-bg-mid)",
 borderColor: "var(--ld-border)",
 color: "var(--ld-accent)",
 }}
 >
 Why ExportReady?
 </span>
 <h2 className="text-3xl md:text-4xl text-white mb-4">
 Why ExportReady?
 </h2>
 <p
 className="text-base max-w-[52ch] mx-auto"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Most compliance tools are built for reporting. ExportLens is built for enforcement.
 </p>
 </motion.div>

 {/* Header row */}
 <div
 className="hidden md:grid grid-cols-[1fr_120px_120px] gap-4 mb-4 px-6 text-xs font-medium uppercase tracking-[0.12em]"
 style={{ color: "var(--ld-text-muted)" }}
 >
 <span>Capability</span>
 <span className="text-center" style={{ color: "var(--ld-accent)" }}>ExportReady</span>
 <span className="text-center" style={{ color: "var(--ld-text-muted)" }}>Others</span>
 </div>

 <div className="space-y-2">
 {reasons.map((r, i) => (
 <motion.div
 key={r.point}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.05 }}
 className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-4 items-start rounded-xl border px-6 py-5 transition-colors duration-200"
 style={{
 background: "var(--ld-bg-mid)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div>
 <h3 className="text-sm text-white mb-1">{r.point}</h3>
 <p className="text-xs leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
 {r.description}
 </p>
 </div>
 <div className="flex md:justify-center items-center gap-2">
 <span className="md:hidden text-xs" style={{ color: "var(--ld-text-muted)" }}>ExportReady:</span>
 <div
 className="h-6 w-6 rounded-full flex items-center justify-center"
 style={{
 background: r.us ? "rgba(14,163,113,0.2)" : "rgba(239,68,68,0.1)",
 }}
 >
 {r.us ? (
 <Check className="h-3.5 w-3.5" style={{ color: "var(--ld-accent)" }} />
 ) : (
 <X className="h-3.5 w-3.5 text-red-400" />
 )}
 </div>
 </div>
 <div className="flex md:justify-center items-center gap-2">
 <span className="md:hidden text-xs" style={{ color: "var(--ld-text-muted)" }}>Others:</span>
 <div
 className="h-6 w-6 rounded-full flex items-center justify-center"
 style={{ background: "rgba(239,68,68,0.1)" }}
 >
 {r.them === true ? (
 <Check className="h-3.5 w-3.5" style={{ color: "var(--ld-accent)" }} />
 ) : r.them === "partial" ? (
 <span className="text-[10px] text-amber-400 ">~</span>
 ) : (
 <X className="h-3.5 w-3.5 text-red-400" />
 )}
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
