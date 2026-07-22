"use client";

import { ArrowRight, Rocket, Users, Building2 } from "lucide-react";

const nextSteps = [
  {
    icon: <Rocket size={18} />,
    title: "Starting out",
    description:
      "Map one product line and generate your first buyer-ready passport in days. Free for small exporters.",
    href: "/request-access",
    cta: "Request access",
  },
  {
    icon: <Users size={18} />,
    title: "Scaling up",
    description:
      "Close supplier gaps, track expiry dates, and share permissioned evidence packs with European buyers.",
    href: "/request-access",
    cta: "Talk to sales",
  },
  {
    icon: <Building2 size={18} />,
    title: "At scale",
    description:
      "Multi-product, multi-supplier compliance operations with API access, custom integrations, and SLA support.",
    href: "/request-access",
    cta: "Contact enterprise",
  },
];

export default function NewsCTA() {
  return (
    <section className="">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">GET STARTED</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">8</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">
          <div
            className="relative overflow-hidden rounded-none"
            style={{
              background:
                "linear-gradient(160deg, #00C2D8 0%, #0562ef 48%, #0015FF 100%)",
            }}
          >
            {/* Halftone overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 1px)",
                backgroundSize: "4px 4px",
                mixBlendMode: "overlay",
              }}
            />

            {/* Soft radial glow */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(60% 80% at 75% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)",
              }}
            />

            <div className="relative px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
              <div className="relative max-w-[640px] mb-12">
                <h2 className="font-heading text-white text-[clamp(30px,4.4vw,48px)] font-medium tracking-[-0.04em] leading-[1.02] text-balance">
                  Wherever you are in your export journey, there&apos;s a path in.
                </h2>
              </div>

              <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
                {nextSteps.map((step) => (
                  <a
                    key={step.title}
                    href={step.href}
                    className="relative group block p-7 bg-white/10 backdrop-blur-sm transition-colors duration-200 hover:bg-white/15 border border-white/20 rounded-none overflow-hidden"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white/15 text-white mb-5 relative z-10">
                      {step.icon}
                    </div>
                    <h3 className="font-heading text-white text-[17px] font-medium mb-2 relative z-10 leading-tight">{step.title}</h3>
                    <p className="text-[14px] leading-[1.55] text-white/70 mb-5 text-pretty relative z-10">
                      {step.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[14px] font-medium text-white relative z-10">
                      {step.cta} <ArrowRight size={14} className="cta-arrow animate-none group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </a>
                ))}
              </div>

              {/* Bottom stat bar — Supermemory token-counter style */}
              <div className="relative mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-white/20">
                <div>
                  <div className="font-mono text-[11px] font-medium tracking-[0.14em] text-white/60 uppercase">
                    EU Battery Passport deadline
                  </div>
                  <div className="font-heading text-white text-[clamp(32px,5vw,56px)] font-medium tracking-[-0.04em] leading-none mt-2 tabular-nums">
                    18 Feb 2027
                  </div>
                </div>
                <a
                  href="/request-access"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-white bg-white/10 border border-white/55 px-5 py-3 transition-colors hover:bg-white hover:text-blue press-scale rounded-none"
                  style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                >
                  Start Building
                  <ArrowRight size={14} className="cta-arrow" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
