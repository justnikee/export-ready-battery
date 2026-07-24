"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* ── Background image ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-ai2.png"
          alt="Sustainable green cityscape with EV charging infrastructure and wind turbines"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          quality={90}
        />
        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(11,16,21,0.58) 0%, rgba(11,16,21,0.35) 40%, rgba(11,16,21,0.18) 65%, rgba(11,16,21,0.10) 100%)",
          }}
        />
      </div>

      {/* ── Centered text content ── */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 text-center flex flex-col items-center pt-[120px] pb-24 sm:pb-32">
        {/* Announcement pill */}
        <motion.a
          href="/battery"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="group inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full text-[13px] font-medium text-white/90 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 hover:border-white/25 transition-colors mb-10"
        >
          <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-blue text-white text-[11px] font-semibold tracking-wide font-mono">
            NEW
          </span>
          EU Battery Passport — mandatory 18 Feb 2027
          <ArrowRight size={13} className="cta-arrow text-white/60" />
        </motion.a>

        {/* Headline — Barlow Condensed (Neue Rational Condensed alternative) */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-white text-[clamp(48px,8vw,96px)] font-bold uppercase leading-[0.92] tracking-[-0.03em] max-w-[950px] text-balance"
          style={{
            fontFamily: "var(--font-display-condensed)",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
          }}
        >
          Every product
          <br />
          deserves a digital identity
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[580px] mt-7 text-[16px] sm:text-[17px] leading-[1.7] text-white/90 text-pretty"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
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
            className="group inline-flex items-stretch h-[52px] overflow-hidden text-white bg-blue border border-blue font-medium text-[15px] tracking-[-0.005em] rounded-sm hover:bg-blue-hover hover:border-blue-hover transition-colors press-scale flex-1 sm:flex-none"
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
            className="inline-flex items-center justify-center h-[52px] px-6 text-[15px] font-medium text-white/90 bg-white/10 border border-white/15 backdrop-blur-sm rounded-sm hover:bg-white/15 hover:border-white/30 transition-colors press-scale flex-1 sm:flex-none"
          >
            See how it works
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-mono uppercase tracking-[0.14em] text-white/40"
        >
          <span>EU 2023/1542 Ready</span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span>BIS Certified</span>
          <span className="hidden sm:inline text-white/20">·</span>
          <span>AIS-156 Compliant</span>
        </motion.div>
      </div>
    </section>
  );
}
