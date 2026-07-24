"use client";

import { ArrowRight, BatteryCharging, Shirt } from "lucide-react";

const products = [
  {
    icon: <BatteryCharging size={22} />,
    name: "Anviora Battery",
    tag: "Live",
    tagTone: "live",
    body: "EU Battery Passports plus India BIS and CPCB EPR compliance for cell makers, pack assemblers, and exporters.",
    cta: "Explore Anviora Battery",
    href: "/battery",
  },
  {
    icon: <Shirt size={22} />,
    name: "Anviora Textile",
    tag: "Early access",
    tagTone: "soon",
    body: "Get ahead of the EU's upcoming textile DPP (ESPR). Build your fiber, chemical, and certificate data foundation before the mandate lands.",
    cta: "Join the Textile waitlist",
    href: "/textile",
  },
];

export default function ProductsSplit() {
  return (
    <section className="">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">PRODUCTS</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">6</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

        <h2 className="font-heading text-text text-[clamp(30px,4.4vw,48px)] font-medium tracking-[-0.035em] leading-[1.08] max-w-[640px] mb-12 text-balance">
          Two products. One identity layer.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {products.map((p) => {
            const dark = p.tagTone === "live";
            return (
              <a
                key={p.name}
                href={p.href}
                className={`relative group flex flex-col p-8 lg:p-10 press-scale transition-all duration-200 hover:-translate-y-1 rounded-none overflow-hidden ${
                  dark
                    ? "bg-blue text-white"
                    : "bg-paper border border-border"
                }`}
              >
                {/* Scoped Grid dot overlay */}
                <div 
                  className={`absolute inset-0 pointer-events-none opacity-40`} 
                  style={{
                    backgroundImage: dark 
                      ? "radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)"
                      : "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
                    backgroundSize: "16px 16px"
                  }}
                />

                <div className="relative z-10 flex items-center justify-between mb-8">
                  <span
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-md ${
                      dark ? "bg-white/15 text-white" : "bg-blue-tint text-blue border border-border shadow-sm"
                    }`}
                  >
                    {p.icon}
                  </span>
                  <span
                    className={`inline-flex items-center h-6 px-2.5 rounded-sm text-[10.5px] font-mono font-medium uppercase tracking-[0.14em] ${
                      dark ? "bg-white/15 text-white" : "bg-amber-soft text-amber-text border border-[#f59e0b1a]"
                    }`}
                  >
                    {p.tag}
                  </span>
                </div>
                <h3
                  className={`relative z-10 font-heading text-[28px] font-medium tracking-[-0.035em] mb-3 leading-tight ${
                    dark ? "text-white" : "text-text"
                  }`}
                >
                  {p.name}
                </h3>
                <p
                  className={`relative z-10 text-[15px] leading-[1.65] mb-8 text-pretty ${
                    dark ? "text-white/75" : "text-text-muted"
                  }`}
                >
                  {p.body}
                </p>
                <span
                  className={`relative z-10 inline-flex items-center gap-1 mt-auto text-[14px] font-medium transition-colors ${
                    dark
                      ? "text-white"
                      : "text-blue group-hover:text-blue-hover"
                  }`}
                >
                  {p.cta} <ArrowRight size={14} className="cta-arrow animate-none group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
