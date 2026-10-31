"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import GlowDots from "@/components/illustrations/glow-dots";

export default function EUBuyerHero() {
  return (
    <section className="relative pt-[120px] pb-16 lg:pt-[160px] lg:pb-[64px] overflow-hidden">
      {/* Glowing dot grid background */}
      <GlowDots />
      <div className="max-w-[1232px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            <ShieldCheck size={14} />
            For EU Buyers & Importers
          </div>
          <h1 className="font-serif text-[clamp(32px,4.5vw,52px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink">
            Require Digital Battery Passports from your Indian suppliers.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[600px] mx-auto">
            From 18 February 2027, LMT, industrial batteries above 2 kWh, and EV
            batteries placed on the EU market need a passport. We onboard the Indian
            pack supplier and issue a public scan page. We do not have production
            customers to name yet — ask for a live sample instead.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-7">
            <a
              href="#mandate-form"
              className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
            >
              Mandate Your Suppliers
              <ArrowRight size={15} className="cta-arrow" />
            </a>
            <a
              href="#verify"
              className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
            >
              Verify a passport <ArrowRight size={14} className="cta-arrow" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
