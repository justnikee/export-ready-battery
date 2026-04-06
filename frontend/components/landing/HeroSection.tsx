"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section style={{ background: "var(--ld-bg-dark)" }}>
      {/* Full-width illustration banner */}
      <div className="w-full h-[280px] md:h-[400px] lg:h-[480px] flex items-center justify-center bg-zinc-900/50">
        <span className="text-zinc-500 text-sm">Hero Illustration</span>
      </div>

      {/* Thin emerald accent line */}
      <div className="h-px w-full" style={{ background: "var(--ld-accent)" }} />

      {/* Centered content */}
      <div className="max-w-3xl mx-auto text-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Pill badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium mb-8"
            style={{
              background: "var(--ld-bg-surface)",
              borderColor: "var(--ld-border)",
              color: "var(--ld-accent)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--ld-accent)" }}
            />
            Battery Compliance Platform
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            Welcome to{" "}
            <span style={{ color: "var(--ld-accent)" }}>ExportReady</span>
          </h1>

          <p
            className="text-lg leading-relaxed mb-10 max-w-[52ch] mx-auto"
            style={{ color: "var(--ld-text-muted)" }}
          >
            The leading platform for digital battery passports. Automate EU &amp;
            India compliance, generate audit-ready documentation, and track
            regulatory status in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--ld-accent)" }}
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:bg-white/5"
              style={{
                borderColor: "var(--ld-border)",
                color: "var(--ld-text-muted)",
              }}
            >
              Learn More
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
