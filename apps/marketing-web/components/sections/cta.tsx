"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="bg-[#FAF9F6] py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="relative rounded-[40px] bg-gradient-to-b from-[#E8F5E9] to-[#C8E6C9] p-12 lg:p-20 overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-[#FF6B9D]/30 blur-xl" />
          <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-[#4F46E5]/20 blur-xl" />
          <div className="absolute top-1/2 right-20 w-12 h-12 rounded-full bg-[#F8B500]/30 blur-lg" />

          <div className="relative z-10 text-center max-w-[600px] mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] leading-[1.1] tracking-[-0.02em] mb-4"
            >
              Turn your export ideas into reality today
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#666666] mb-8"
            >
              Start your 14-day Pro trial today. No credit card required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
              >
                Start building for free
                <ArrowRight size={16} />
              </a>
              <a
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#111111]/20 text-[#111111] text-sm font-medium hover:bg-[#111111]/5 transition-colors"
              >
                Get a demo
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
