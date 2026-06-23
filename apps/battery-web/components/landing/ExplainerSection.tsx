"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function ExplainerSection() {
 return (
 <section style={{ background: "var(--ld-bg-dark)" }}>
 <div className="max-w-[1320px] mx-auto px-6 py-24">
 <div className="max-w-3xl mx-auto text-center">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 >
 <span
 className="text-xs uppercase tracking-widest mb-4 block font-mono"
 style={{ color: "var(--ld-accent)", letterSpacing: "1.2px" }}
 >
 What is Anviora?
 </span>

 <h2 className="text-3xl md:text-4xl text-white mb-6 leading-tight">
 The Digital Battery Passport Platform
 </h2>

 <p
 className="text-base leading-relaxed mb-4"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Anviora helps battery manufacturers comply with global
 regulations like EU Battery Regulation (2023/1542) and India&apos;s
 Battery Aadhaar system.
 </p>
 <p
 className="text-base leading-relaxed mb-8"
 style={{ color: "var(--ld-text-muted)" }}
 >
 Create, manage, and track every battery unit from manufacturing to
 recycling — with tamper-proof audit trails and real-time compliance
 validation.
 </p>

 <Link
 href="/docs"
 className="group inline-flex items-center gap-2 text-sm transition-colors hover:brightness-125"
 style={{ color: "var(--ld-accent)" }}
 >
 Learn about Anviora
 <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
 </Link>
 </motion.div>
 </div>
 </div>
 </section>
 );
}
