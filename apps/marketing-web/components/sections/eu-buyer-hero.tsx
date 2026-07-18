"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function EUBuyerHero() {
  return (
    <section className="relative pt-[120px] pb-16 lg:pt-[160px] lg:pb-[64px] overflow-hidden">
      <div className="max-w-[800px] mx-auto px-6 text-center">
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
            EU Battery Regulation 2023/1542 makes a Digital Battery Passport mandatory
            from February 2027. Anviora is already used by Indian battery manufacturers
            to issue and maintain them — verify any passport below, or tell us which
            suppliers you want to mandate it for.
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
