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
      <div className="rounded-xl bg-white border-2 border-black p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10">
          <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-black">Textile Passport</span>
          <span className="inline-flex items-center px-2 py-0.5 bg-black text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest">
            ESPR Ready
          </span>
        </div>
        <div className="grid gap-2.5">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/60">
                {f.label}
              </span>
              <span
                className={`text-[13px] font-medium leading-snug ${
                  f.accent ? "text-emerald-700 font-semibold" : "text-black"
                }`}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TextileHero() {
  return (
    <section className="relative min-h-[500px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-24 sm:pt-28 pb-12 select-none">
      {/* CRT Scanlines Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)",
        }}
      />

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-400/20 via-transparent to-black/10 pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black clip-chamfer mb-5">
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                TEXTILE DPP
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                EU ESPR & Tirupur Export Ready
              </span>
            </div>

            <h1 className="font-heading font-semibold text-[clamp(32px,4.8vw,64px)] leading-[0.96] tracking-[-0.04em] text-black mb-4">
              From fiber to final product. <span className="block">Traced before mandates land.</span>
            </h1>

            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-black/85 font-medium max-w-[500px] text-pretty mb-6">
              The EU&apos;s textile Digital Product Passport (ESPR) is coming. Build your fiber, dye-batch, chemical, and certificate data foundation now — so when it&apos;s mandatory, you&apos;re already compliant.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-6">
              <a
                href="/request-access"
                className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-lg"
              >
                Join Waitlist
              </a>
              <a
                href="/battery"
                className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-black bg-transparent border-2 border-black hover:bg-black hover:text-emerald-400 transition-all clip-chamfer press-scale"
              >
                See Battery Platform
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mt-6 lg:mt-0"
          >
            <TextilePassportCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
