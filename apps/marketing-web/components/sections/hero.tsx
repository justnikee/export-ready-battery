"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-bg">
      {/* ── Background image ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gem-hero.png"
          alt="Verifiable Digital Product Passport and Battery Life Cycle Platform"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={95}
        />
        {/* Subtle gradient vignette to blend background image seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-bg/80 pointer-events-none" />
      </div>

      {/* ── Centered text content ── */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 text-center flex flex-col items-center pt-[120px] pb-24 sm:pb-32">
        {/* Announcement pill */}
        <motion.a
          href="/battery"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="group inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-none text-[13px] font-medium text-slate-800 bg-white/80 border border-slate-300/80 backdrop-blur-md hover:bg-white hover:border-slate-400 transition-all mb-10"
        >
          <span className="inline-flex items-center h-[22px] px-2 rounded-none bg-amber-500 text-slate-950 text-[11px] font-bold tracking-wide font-mono">
            NEW
          </span>
          EU Battery Passport — mandatory 18 Feb 2027
          <ArrowRight size={13} className="cta-arrow text-slate-500" />
        </motion.a>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-text text-[clamp(38px,6.2vw,74px)] font-bold leading-[0.98] tracking-[-0.03em] max-w-[900px] text-balance font-heading"
        >
          Every Product Deserves
          <br />
          a Digital Identity
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[580px] mt-7 text-[16px] sm:text-[17px] leading-[1.7] text-text-muted text-pretty font-normal"
        >
          Anviora turns your certificates, supplier records, and factory data
          into verifiable digital product passports — compliant at home,
          cleared in Europe.
        </motion.p>

        {/* CTA group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 w-full max-w-[440px]"
        >
          <a
            href="/request-access"
            className="group inline-flex items-stretch h-[52px] overflow-hidden text-white bg-blue border border-blue font-medium text-[15px] tracking-[-0.005em] rounded-none hover:bg-blue-hover hover:border-blue-hover transition-colors press-scale flex-1 sm:flex-none"
          >
            <span className="inline-flex items-center justify-center flex-1 px-6 border-r border-white/18">
              Request a Demo
            </span>
            <span className="inline-flex items-center justify-center w-[52px] flex-shrink-0 transition-transform group-hover:translate-x-0.5">
              <ArrowRight size={16} />
            </span>
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center h-[52px] px-6 text-[15px] font-medium text-slate-900 bg-white/90 border border-slate-300 backdrop-blur-sm rounded-none hover:bg-white hover:border-slate-400 hover:text-black transition-colors press-scale flex-1 sm:flex-none"
          >
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}
