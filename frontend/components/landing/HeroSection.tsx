"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-4xl mx-auto text-center px-6 pt-32 pb-24 md:pt-40 md:pb-32">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 >
 {/* Pill badge — urgency */}
 <Link
 href="/docs/compliance"
 className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs mb-10 transition-colors hover:border-zinc-500"
 style={{
 background: "var(--ld-bg-surface)",
 borderColor: "var(--ld-border)",
 color: "var(--ld-text-muted)",
 }}
 >
 EU Battery Passport compliance is mandatory by 2027
 <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
 </Link>

 {/* Headline */}
 <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] text-white leading-[1.00] tracking-tight mb-6">
 Export Battery Compliance
 <br />
 <span style={{ color: "var(--ld-accent)" }}>
 Without the Chaos
 </span>
 </h1>

 {/* Subheadline */}
 <p
 className="text-base sm:text-lg leading-relaxed mb-10 max-w-[58ch] mx-auto"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Automate EU Battery Passport &amp; India Battery Aadhaar compliance.
 Generate digital passports, track lifecycle, and stay audit-ready
 — all in one platform.
 </p>

 {/* CTA Buttons — pill style */}
 <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
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

 {/* Trust line */}
 <p
 className="text-sm"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Trusted by battery manufacturers, exporters, and compliance teams
 </p>
 </motion.div>
 </div>
 </section>
 );
}
