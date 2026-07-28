"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BatteryCTA() {
  return (
    <section className="py-16 lg:py-24 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        <div
          className="relative overflow-hidden rounded-none p-10 lg:p-16 text-white text-center flex flex-col items-center justify-center"
          style={{
            background:
              "linear-gradient(160deg, #10b981 0%, #047857 48%, #044e3a 100%)",
          }}
        >
          {/* Halftone overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 1px)",
              backgroundSize: "4px 4px",
              mixBlendMode: "overlay",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 flex flex-col items-center max-w-[660px]"
          >
            <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.035em] leading-[1.08] text-white mb-4 text-balance">
              Ship your first compliant battery this month.
            </h2>
            <p className="text-[16px] leading-[1.65] text-white/85 mb-8 text-pretty font-normal">
              No setup fee. No lock-in. Buy only the passport credits you need.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/request-access"
                className="group inline-flex items-stretch h-[50px] overflow-hidden text-slate-950 bg-white font-bold text-[14.5px] rounded-none hover:bg-slate-100 transition-colors press-scale"
              >
                <span className="inline-flex items-center justify-center px-6 border-r border-slate-200">
                  Request a Demo
                </span>
                <span className="inline-flex items-center justify-center w-[50px] flex-shrink-0 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight size={16} />
                </span>
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center h-[50px] px-6 rounded-none font-semibold text-[14.5px] text-white border border-white/40 hover:bg-white/10 transition-colors"
              >
                See Pricing
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
