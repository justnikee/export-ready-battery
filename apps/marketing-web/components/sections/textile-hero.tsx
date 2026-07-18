"use client";

import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";

/* Static textile passport card — mirrors the battery page's passport visual */
function TextilePassportCard() {
  const fields = [
    { label: "Product", value: "Organic cotton tee — TEXT-T889" },
    { label: "Fiber", value: "80% Cotton · 20% Recycled PET" },
    { label: "GOTS", value: "Certified · Valid to Aug 2027", accent: true },
    { label: "OEKO-TEX", value: "Standard 100 · Class I", accent: true },
    { label: "REACH", value: "Compliant · SVHC screened", accent: true },
    { label: "Dye lot", value: "DL-2261 · Low-impact reactive" },
    { label: "Origin", value: "Tirupur, IN → Rotterdam, EU" },
  ];
  return (
    <div className="relative w-full max-w-[380px]">
      <div className="rounded-3xl bg-paper overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#fdf3e3]">
          <span className="text-[12px] font-semibold text-crew-ink">Textile Passport</span>
          <span className="inline-flex items-center h-5 px-2 rounded-full bg-white text-[10px] font-semibold text-[#b45309] uppercase tracking-wide">
            Early access
          </span>
        </div>
        <div className="px-5 py-4 grid gap-2.5">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-crew-muted">
                {f.label}
              </span>
              <span
                className={`text-[13px] font-medium leading-snug ${
                  f.accent ? "text-crew-coral" : "text-crew-ink"
                }`}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute -top-3 -right-3 flex items-center gap-1.5 h-8 px-3 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
      >
        <Leaf size={14} className="text-crew-coral" />
        <span className="text-[11px] font-semibold text-crew-ink">Fiber-to-product traced</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="absolute -bottom-3 -left-3 flex items-center gap-1.5 h-8 px-3 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
      >
        <ShieldCheck size={14} className="text-[#1d4ed8]" />
        <span className="text-[11px] font-semibold text-crew-ink">ESPR-ready structure</span>
      </motion.div>
    </div>
  );
}

export default function TextileHero() {
  return (
    <section className="relative pt-[120px] pb-20 lg:pt-[160px] lg:pb-[80px] overflow-hidden">
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
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-crew-amber-soft text-[#b45309] text-[10.5px] font-semibold uppercase tracking-wide">
                Early access
              </span>
            </div>
            <h1 className="font-serif text-[clamp(36px,5vw,60px)] font-semibold leading-[1.04] tracking-[-0.02em] text-crew-ink text-balance">
              From fiber to final product. Traced before the mandate lands.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[500px] text-pretty">
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
                href="/battery"
                className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
              >
                See the battery platform live <ArrowRight size={14} className="cta-arrow" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mt-6 lg:mt-0"
          >
            <TextilePassportCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
