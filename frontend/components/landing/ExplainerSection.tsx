"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function ExplainerSection() {
  return (
    <section
      className="border-t"
      style={{
        background: "var(--ld-bg-dark)",
        borderColor: "var(--ld-border)",
      }}
    >
      <div className="max-w-[1320px] mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest mb-4 block"
              style={{ color: "var(--ld-accent)" }}
            >
              What is ExportReady?
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              The Digital Battery Passport Platform
            </h2>

            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: "var(--ld-text-muted)" }}
            >
              ExportReady is a compliance automation platform purpose-built for
              Indian battery manufacturers. It handles both EU Battery Regulation
              2023/1542 and India&apos;s BIS, EPR, and PLI requirements from a
              single dashboard.
            </p>
            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: "var(--ld-text-muted)" }}
            >
              Track certification status in real time, generate digital battery
              passports with QR codes, and produce audit-ready filings — all
              without switching between disconnected tools.
            </p>

            <Link
              href="/docs"
              className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:brightness-125"
              style={{ color: "var(--ld-accent)" }}
            >
              Learn about ExportReady
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Right — Illustration placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-full h-[350px] rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50">
              <span className="text-zinc-500 text-sm">
                Explainer Illustration
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
