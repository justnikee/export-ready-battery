"use client";

import { ArrowRight, BatteryCharging, Shirt, CheckCircle2, Sparkles } from "lucide-react";

export default function ProductsSplit() {
  return (
    <section className="bg-white antialiased">
      <div className="max-w-[1232px] mx-auto">
        {/* Section header */}
        <div className="sticky top-20 z-20 bg-bg/95 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <span className="section-index">PRODUCTS</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-emerald-600 font-semibold">6</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

        <h2 className="font-heading text-text text-[clamp(32px,4.5vw,52px)] font-semibold tracking-[-0.035em] leading-[1.08] max-w-[640px] mb-12 text-balance">
          Two products. One identity layer.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [perspective:1200px]">
          {/* Card 1: Anviora Battery (3D Perspective Tilt) */}
          <a
            href="/battery"
            className="relative group flex flex-col p-8 lg:p-10 transition-all duration-500 ease-out hover:-translate-y-2 hover:[transform:rotateY(-3deg)_rotateX(2deg)_translateZ(10px)] hover:shadow-2xl hover:shadow-emerald-950/20 [transform-style:preserve-3d] rounded-none overflow-hidden bg-blue text-white justify-between min-h-[440px]"
          >
            <div>
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BatteryCharging size={26} className="text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[12deg]" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white/90">
                    ● LIVE
                  </span>
                </div>
              </div>
              <h3 className="relative z-10 font-heading text-[30px] font-semibold tracking-[-0.035em] mb-3 leading-tight text-white">
                Anviora Battery
              </h3>
              <p className="relative z-10 text-[15px] leading-[1.65] mb-6 text-white/85 text-pretty">
                EU Battery Passports plus India BIS and CPCB EPR compliance for cell makers, pack assemblers, and exporters.
              </p>

              {/* Product Visual Preview Panel — 3D Parallax Float */}
              <div className="bg-white/10 border border-white/20 p-4 font-mono text-xs text-white space-y-2 mb-8 rounded-none transition-all duration-500 ease-out group-hover:[transform:translateZ(20px)_rotateY(2deg)] group-hover:bg-white/15 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/70">EU 2023/1542</span>
                  <span className="font-semibold text-white flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-300" /> PASSPORT ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/70">INDIA REGISTRATIONS</span>
                  <span className="font-semibold text-white">BIS IS 16046 + CPCB EPR</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-white/70">IDENTITY TYPE</span>
                  <span className="font-semibold text-white">W3C VERIFIABLE CREDENTIAL</span>
                </div>
              </div>
            </div>

            <span className="relative z-10 inline-flex items-center gap-2 text-[14.5px] font-semibold text-white group-hover:underline">
              Explore Anviora Battery <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-2.5" />
            </span>
          </a>

          {/* Card 2: Anviora Textile (3D Perspective Tilt) */}
          <a
            href="/textile"
            className="relative group flex flex-col p-8 lg:p-10 transition-all duration-500 ease-out hover:-translate-y-2 hover:[transform:rotateY(3deg)_rotateX(2deg)_translateZ(10px)] hover:shadow-2xl hover:shadow-amber-950/15 [transform-style:preserve-3d] rounded-none overflow-hidden bg-[#fffbeb] text-slate-900 justify-between min-h-[440px]"
          >
            <div>
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shirt size={26} className="text-amber-900 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-12deg]" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-800">
                    ● EARLY ACCESS
                  </span>
                </div>
              </div>
              <h3 className="relative z-10 font-heading text-[30px] font-semibold tracking-[-0.035em] mb-3 leading-tight text-slate-950">
                Anviora Textile
              </h3>
              <p className="relative z-10 text-[15px] leading-[1.65] mb-6 text-slate-800 text-pretty">
                Get ahead of the EU&apos;s upcoming textile DPP (ESPR). Build your fiber, chemical, and certificate data foundation before the mandate lands.
              </p>

              {/* Product Visual Preview Panel — 3D Parallax Float */}
              <div className="bg-amber-100/60 border border-amber-300/60 p-4 font-mono text-xs text-slate-900 space-y-2 mb-8 rounded-none transition-all duration-500 ease-out group-hover:[transform:translateZ(20px)_rotateY(-2deg)] group-hover:bg-amber-100/90 shadow-lg">
                <div className="flex items-center justify-between border-b border-amber-900/10 pb-2">
                  <span className="text-slate-600">ESPR 2026 MANDATE</span>
                  <span className="font-semibold text-amber-950 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-600" /> DPP READY
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-amber-900/10 pb-2">
                  <span className="text-slate-600">MATERIAL TRACE</span>
                  <span className="font-semibold text-slate-900">85% RECYCLED POLY + OEKO-TEX</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600">DUE DILIGENCE</span>
                  <span className="font-semibold text-slate-900">SUPPLY CHAIN RISK AUDIT</span>
                </div>
              </div>
            </div>

            <span className="relative z-10 inline-flex items-center gap-2 text-[14.5px] font-semibold text-amber-900 group-hover:underline">
              Join the Textile waitlist <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-2.5" />
            </span>
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
