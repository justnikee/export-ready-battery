"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Calendar } from "lucide-react";

export function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-32"
      style={{ background: "var(--ld-bg-dark)" }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "var(--ld-border)" }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: "rgba(14,163,113,0.07)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(14,163,113,0.04)" }}
      />

      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Pulsing badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-10 text-xs font-medium"
            style={{
              background: "var(--ld-bg-surface)",
              borderColor: "var(--ld-border)",
              color: "var(--ld-text-muted)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "var(--ld-accent)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "var(--ld-accent)" }}
              />
            </span>
            Ready to automate compliance?
          </span>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.05]">
            Make compliance your{" "}
            <span style={{ color: "var(--ld-accent)" }}>
              competitive advantage.
            </span>
          </h2>

          <p
            className="text-lg max-w-[52ch] mx-auto mb-12"
            style={{ color: "var(--ld-text-muted)" }}
          >
            Join battery manufacturers simplifying EU and India compliance. Get started with a demo tailored to your production line.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--ld-accent)" }}
            >
              <Calendar className="h-4 w-4" />
              Book a Demo
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-sm font-medium border transition-all duration-200 hover:bg-white/5"
              style={{
                borderColor: "var(--ld-border)",
                color: "var(--ld-text-muted)",
              }}
            >
              Explore Documentation
            </Link>
          </div>

          {/* Secondary links */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 mb-16"
          >
            <a
              href="mailto:hello@exportlens.com"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
              style={{ color: "var(--ld-text-muted)" }}
            >
              <Mail className="h-4 w-4" />
              hello@exportlens.com
            </a>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xs"
            style={{ color: "rgba(157,184,175,0.5)" }}
          >
            No credit card required · Setup in under 5 minutes · Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
