"use client";

import { FileWarning, Ship, CalendarClock } from "lucide-react";
import DeadlineCountdown from "@/components/deadline-countdown";

const pains = [
  {
    icon: <FileWarning size={20} />,
    title: "200+ pages of EU regulation",
    body: "A full-time compliance hire — or ₹3L+ in consultants — just to understand what's required of you.",
  },
  {
    icon: <Ship size={20} />,
    title: "Held at the port",
    body: "One missing carbon declaration or Declaration of Conformity can cost ₹50,000+ a day in demurrage.",
  },
  {
    icon: <CalendarClock size={20} />,
    title: "Certificates that expire silently",
    body: "BIS lapses every two years. Miss the renewal and production — or a shipment — stops.",
  },
];

export default function ComplianceCliff() {
  return (
    <section className="">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">THE PROBLEM</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">2</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

        {/* Countdown + headline row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-14 items-start">
          <div>
            <h2 className="font-heading text-text text-[clamp(30px,4.4vw,48px)] font-medium tracking-[-0.035em] leading-[1.08] text-balance">
              The rules changed. The paperwork didn&apos;t keep up.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.65] text-text-muted max-w-[480px] text-pretty">
              EU Battery Regulation 2023/1542 is law. Every battery sold in
              Europe will need a digital passport. Most Indian manufacturers
              haven&apos;t started.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-paper border border-border rounded-none relative">
            <DeadlineCountdown variant="block" />
          </div>
        </div>

        {/* Pain cards — Supermemory sharp-corner style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {pains.map((p) => (
            <div
              key={p.title}
              className="relative p-7 bg-paper border border-border transition-transform duration-300 hover:-translate-y-1 rounded-none overflow-hidden"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-blue-tint text-blue mb-5 mt-2 border border-border/10 shadow-sm">
                {p.icon}
              </div>
              <h3 className="font-heading text-text text-[22px] font-medium tracking-[-0.02em] mb-2 leading-tight">
                {p.title}
              </h3>
              <p className="text-[15px] leading-[1.65] text-text-muted text-pretty">{p.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[17px] font-medium text-text text-pretty">
          Compliance is no longer a cost center — it&apos;s how you win the order.
          Anviora replaces the scramble with a single source of truth.
        </p>
        </div>
      </div>
    </section>
  );
}
