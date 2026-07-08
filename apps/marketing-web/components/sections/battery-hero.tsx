"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BatteryHero() {
  return (
    <section className="relative pt-[120px] pb-20 lg:pt-[160px] lg:pb-[80px] overflow-hidden bg-crew-paper-soft">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
              Anviora Battery
            </div>
            <h1 className="font-serif text-[clamp(36px,5vw,60px)] font-normal leading-[1.04] tracking-[-0.01em] text-crew-ink">
              The identity layer for every battery you ship.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[500px]">
              EU Battery Regulation 2023/1542. BIS IS 16046. UN38.3. Carbon
              footprint. One platform, one record, from cell to recycler.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-7">
              <a
                href="/request-access"
                className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
              >
                Request a Demo
                <ArrowRight size={15} className="cta-arrow" />
              </a>
              <a
                href="/request-access"
                className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
              >
                See a sample passport <ArrowRight size={14} className="cta-arrow" />
              </a>
            </div>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative hidden lg:flex justify-center"
          >
            <div
              className="w-[160px] h-[320px] p-[10px] rounded-[32px] relative"
              style={{
                background: "#10221b",
                transform: "rotate(-8deg)",
                boxShadow: "rgba(7,46,33,.24) 0 24px 50px",
              }}
            >
              <div className="h-full rounded-[24px] bg-white px-3 py-5">
                <div className="w-10 h-[5px] mx-auto mb-6 rounded-full bg-crew-border" />
                <div className="font-serif text-crew-ink text-[20px] leading-[1.1] font-normal">
                  Scan passport
                </div>
                <div className="mt-4 mx-auto w-[80px] h-[80px] rounded-lg border-2 border-dashed border-crew-border flex items-center justify-center">
                  <div className="w-12 h-12 rounded bg-crew-coral-soft" />
                </div>
                <div className="mt-4 text-[11px] text-crew-muted text-center">
                  LFP-B4471
                </div>
                <div className="mt-2 grid gap-2 px-2">
                  <div className="h-2 rounded-full bg-crew-paper-soft" />
                  <div className="h-2 w-[70%] rounded-full bg-crew-coral-soft" />
                </div>
              </div>
            </div>
            <div
              className="absolute right-4 top-8 w-[220px] p-4 rounded-xl bg-white"
              style={{
                border: "1px solid var(--color-crew-border)",
                boxShadow: "rgba(7,46,33,.16) 0 24px 58px",
                transform: "rotate(3deg)",
              }}
            >
              <div className="text-[11px] text-crew-muted mb-2">Battery passport</div>
              <div className="text-[20px] font-semibold tracking-[-0.02em] text-crew-ink">LFP-B4471</div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-crew-muted">Status</span>
                  <span className="text-crew-green font-semibold">Ready</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-crew-muted">Carbon</span>
                  <span className="text-crew-ink font-semibold">Class B</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
