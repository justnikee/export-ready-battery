"use client";

import { motion } from "framer-motion";

export function SecuritySection() {
 return (
 <section
 className="py-24 border-b"
 style={{
 background: "var(--ld-bg-dark)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div className="mx-auto w-full max-w-[1320px] px-6">
 {/* Header — centered */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center mb-14"
 >
 <span
 className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border mb-6"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 color: "var(--ld-accent)",
 }}
 >
 Security
 </span>
 <h2 className="text-3xl md:text-4xl text-white mb-4">
 Stay audit-ready at all times.
 </h2>
 <p className="text-base max-w-[52ch] mx-auto" style={{ color: "var(--ld-text-muted)" }}>
 Compliance isn&apos;t just about generating the right documents — it&apos;s about proving you can defend every data point under scrutiny.
 </p>
 </motion.div>

 {/* Bento layout — NOT a grid. Uses flex row + flex col */}
 <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 380 }}>

 {/* Left: large primary card */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="flex flex-col rounded-2xl border p-8 lg:w-[45%]"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div
 className="h-12 w-12 rounded-xl flex items-center justify-center border mb-6"
 style={{ background: "rgba(14,163,113,0.12)", borderColor: "rgba(14,163,113,0.25)" }}
 >
 <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--ld-accent)" }}>
 history
 </span>
 </div>
 <h3 className="text-xl text-white mb-3">Immutable Audit Trail</h3>
 <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--ld-text-muted)" }}>
 Every API call, validation result, and document generation event is cryptographically logged and time-stamped for complete traceability. Instantly retrievable during surprise regulatory inspections.
 </p>
 <div
 className="mt-8 pt-5 border-t text-xs font-medium"
 style={{ borderColor: "var(--ld-border)", color: "var(--ld-accent)" }}
 >
 Purpose-built for regulatory complexity where general tools fail.
 </div>
 </motion.div>

 {/* Right: two smaller cards stacked vertically */}
 <div className="flex flex-col gap-5 flex-1">
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.1 }}
 className="flex items-start gap-5 rounded-2xl border p-7 flex-1"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div
 className="h-10 w-10 rounded-lg flex items-center justify-center border shrink-0"
 style={{ background: "rgba(14,163,113,0.12)", borderColor: "rgba(14,163,113,0.25)" }}
 >
 <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--ld-accent)" }}>
 admin_panel_settings
 </span>
 </div>
 <div>
 <h3 className="text-base text-white mb-2">Role-Based Control</h3>
 <p className="text-sm leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
 Granular permission settings ensure only authorized personnel can access sensitive compliance data or approve batch releases.
 </p>
 <p className="mt-4 text-xs font-medium" style={{ color: "var(--ld-accent)" }}>
 Compliance data stays with the right people — no more, no less.
 </p>
 </div>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.2 }}
 className="flex items-start gap-5 rounded-2xl border p-7 flex-1"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div
 className="h-10 w-10 rounded-lg flex items-center justify-center border shrink-0"
 style={{ background: "rgba(14,163,113,0.12)", borderColor: "rgba(14,163,113,0.25)" }}
 >
 <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--ld-accent)" }}>
 lock
 </span>
 </div>
 <div>
 <h3 className="text-base text-white mb-2">Secure Document Vault</h3>
 <p className="text-sm leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
 Store critical regulatory certificates and test reports in an encrypted vault, instantly retrievable during surprise inspections.
 </p>
 <p className="mt-4 text-xs font-medium" style={{ color: "var(--ld-accent)" }}>
 Encrypted, versioned, and retrievable in seconds.
 </p>
 </div>
 </motion.div>
 </div>
 </div>
 </div>
 </section>
 );
}
