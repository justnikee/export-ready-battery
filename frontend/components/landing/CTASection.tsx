"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section
      className="border-t"
      style={{
        background: "var(--ld-bg-dark)",
        borderColor: "var(--ld-border)",
      }}
    >
      <div className="max-w-3xl mx-auto text-center px-6 py-32">
        {/* Small illustration placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="w-full h-[160px] rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50">
            <span className="text-zinc-500 text-sm">CTA Illustration</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Start your compliance journey
          </h2>

          <p
            className="text-lg max-w-[52ch] mx-auto mb-10"
            style={{ color: "var(--ld-text-muted)" }}
          >
            Join manufacturers across India who trust ExportReady for their
            battery compliance needs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--ld-accent)" }}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact?demo=true"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-medium border transition-all duration-200 hover:bg-white/5"
              style={{
                borderColor: "var(--ld-border)",
                color: "var(--ld-text-muted)",
              }}
            >
              Book a Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
