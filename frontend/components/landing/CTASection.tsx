"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function CTASection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-3xl mx-auto text-center px-6 py-32">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
 {/* Urgency badge */}
 <span
 className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs mb-8"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 color: "var(--ld-text-muted)",
 }}
 >
 EU Battery Passport compliance is mandatory by 2027. Start early.
 </span>

 <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-6 leading-[1.00]">
 Start Exporting Without
 <br />
 <span style={{ color: "var(--ld-accent)" }}>
 Compliance Headaches
 </span>
 </h2>

 <p
 className="text-base sm:text-lg max-w-[52ch] mx-auto mb-10"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Join manufacturers already using ExportReady to simplify battery
 compliance.
 </p>

 <div className="flex flex-wrap items-center justify-center gap-3">
 <Link
 href="/contact"
 className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm text-white transition-all duration-200 hover:opacity-90"
 style={{ background: "var(--ld-accent)" }}
 >
 Start Free Trial
 </Link>
 <Link
 href="/contact?demo=true"
 className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm border transition-all duration-200 hover:bg-white/5"
 style={{
 borderColor: "var(--ld-border)",
 color: "#fafafa",
 }}
 >
 Book Demo
 </Link>
 </div>

 {/* Pricing teaser */}
 <p className="mt-8 text-sm" style={{ color: "var(--ld-text-muted)" }}>
 Starts at{" "}
 <span className="text-white">₹4,999/month</span>
 {" "}· Free trial available
 </p>
 </motion.div>
 </div>
 </section>
 );
}
