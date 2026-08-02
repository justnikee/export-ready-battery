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
    <section className="bg-bg antialiased">
      <div className="max-w-[1232px] mx-auto border-x border-b border-border">
        <div className="pt-16 pb-16 lg:pt-20 lg:pb-20">
          
          {/* Section Header */}
          <div className="px-6 text-center max-w-[1100px] mx-auto mb-12 lg:mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Rocket size={13} className="text-emerald-600" />
              GET STARTED
            </div>

            <h2 className="font-heading text-text text-[clamp(32px,4.5vw,54px)] font-semibold tracking-[-0.035em] leading-[1.08] max-w-[860px] mx-auto">
              Wherever you are in your export
              <br />
              journey, there&apos;s a path in.
            </h2>
          </div>

          {/* 3 Step Cards — Contiguous Gapless 3-Column Grid */}
          <div className="border-t border-b border-border bg-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {nextSteps.map((step) => (
              <a
                key={step.title}
                href={step.href}
                className="group p-6 sm:p-8 flex flex-col justify-between bg-white hover:bg-[#f2faf5] transition-colors duration-200 cursor-pointer"
              >
                <div>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-none bg-[#f2faf5] text-emerald-700 border border-emerald-500/20 mb-6 group-hover:bg-emerald-100 transition-colors">
                    {step.icon}
                  </div>
                  <h3 className="font-heading text-text text-[18px] font-semibold mb-2.5 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[14.5px] leading-[1.6] text-text-muted mb-6 text-pretty">
                    {step.description}
                  </p>
                </div>
                
                <span className="inline-flex items-center gap-1.5 text-[13px] font-mono font-semibold uppercase text-emerald-700 group-hover:text-emerald-950 transition-colors">
                  {step.cta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            ))}
          </div>

          {/* Bottom Stat Bar — Clean Deadline Counter */}
          <div className="px-6 sm:px-8 lg:px-10 pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="font-mono text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
                EU Battery Passport Deadline
              </div>
              <div className="font-heading text-text text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.035em] leading-none mt-2 tabular-nums">
                18 February 2027
              </div>
            </div>

            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-11 px-6 text-[12px] font-mono font-bold tracking-widest uppercase text-white bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-sm cursor-pointer"
            >
              Start Building
              <ArrowRight size={14} className="ml-2" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
