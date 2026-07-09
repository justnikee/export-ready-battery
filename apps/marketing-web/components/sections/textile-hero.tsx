"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function TextileHero() {
  return (
    <section className="relative pt-[120px] pb-20 lg:pt-[160px] lg:pb-[80px] overflow-hidden bg-crew-paper-soft">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase">
                Anviora Textile
              </span>
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-crew-amber-soft text-crew-amber text-[10.5px] font-semibold uppercase tracking-wide">
                Early access
              </span>
            </div>
            <h1 className="font-serif text-[clamp(36px,5vw,60px)] font-normal leading-[1.04] tracking-[-0.01em] text-crew-ink">
              From fiber to final product. Traced before the mandate lands.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[500px]">
              The EU&apos;s textile Digital Product Passport (ESPR) is coming. Build your
              fiber, dye-batch, chemical, and certificate data foundation now — so when
              it&apos;s mandatory, you&apos;re already done.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-7">
              <a
                href="/request-access"
                className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
              >
                Join the waitlist
                <ArrowRight size={15} className="cta-arrow" />
              </a>
              <a
                href="/request-access"
                className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
              >
                See a sample textile passport <ArrowRight size={14} className="cta-arrow" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:flex justify-center"
          >
            <div
              className="relative w-[280px] h-[280px] rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #0e5a40 0%, #16785a 45%, #4f9e80 100%)",
              }}
            >
              <div className="absolute inset-5 rounded-lg bg-[rgba(255,255,255,0.94)] p-4">
                <div className="text-[11px] text-crew-muted mb-2">Textile passport</div>
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-crew-ink">TEXT-T889</div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-crew-muted">Fiber</span>
                    <span className="text-crew-ink font-semibold">80% Cotton</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-crew-muted">GOTS</span>
                    <span className="text-crew-green font-semibold">Certified</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-crew-muted">REACH</span>
                    <span className="text-crew-ink font-semibold">Compliant</span>
                  </div>
                </div>
                <div className="mt-4 h-16 rounded bg-crew-paper-soft flex items-center justify-center">
                  <div className="w-12 h-12 rounded bg-crew-coral-soft" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
