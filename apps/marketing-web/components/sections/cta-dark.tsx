"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CTADark() {
  return (
    <section className="relative overflow-hidden bg-[#0F172A] py-24 md:py-32">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight max-w-3xl mx-auto">
            Ready to modernize your{" "}
            <span className="text-[#818CF8]">compliance</span>
            ?
          </h2>
          <p className="mt-5 text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Join hundreds of Indian manufacturers shipping to Europe with confidence.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0F172A] text-sm font-semibold hover:bg-[#F8FAFC] transition-colors"
            >
              Start with a demo
              <ArrowRight size={16} />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Talk to sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
