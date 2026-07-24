"use client";

import { Check } from "lucide-react";

const india = [
  "BIS IS 16046 certification",
  "CPCB EPR registration",
  "BWM Rules 2022 compliance",
  "DGFT TRACE incentive claims",
  "QR-code traceability",
];

const eu = [
  "EU Battery Regulation 2023/1542",
  "CE marking & Declaration of Conformity",
  "Carbon footprint (Annex II)",
  "Supply-chain due diligence (Art. 48)",
  "Battery Passport / BPAN (Art. 77)",
];

function Column({
  title,
  tag,
  items,
  tone,
}: {
  title: string;
  tag: string;
  items: string[];
  tone: "india" | "eu";
}) {
  const isEu = tone === "eu";
  return (
    <div className={`relative flex-1 p-8 lg:p-10 border border-border rounded-none overflow-hidden ${isEu ? "bg-[#f4f8ff]" : "bg-paper"}`}>
      {/* Grid dots background overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50" 
        style={{
          backgroundImage: "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
          backgroundSize: "16px 16px"
        }}
      />

      <div className="relative z-10 flex items-center justify-between mb-6">
        <h3 className="font-heading text-text text-[24px] font-medium tracking-[-0.02em] leading-tight">
          {title}
        </h3>
        <span
          className={`inline-flex items-center h-6 px-2.5 rounded-sm text-[10.5px] font-mono font-medium uppercase tracking-[0.14em] ${
            isEu ? "bg-blue text-white" : "bg-text text-white"
          }`}
        >
          {tag}
        </span>
      </div>
      <ul className="relative z-10 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.65] text-text-muted">
            <span
              className={`inline-flex items-center justify-center w-[22px] h-[22px] mt-0.5 rounded-sm shrink-0 ${
                isEu ? "bg-white text-blue border border-border" : "bg-bg-alt text-text border border-border"
              }`}
            >
              <Check size={12} strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DualMarket() {
  return (
    <section className="">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">DUAL COMPLIANCE</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">5</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

        <div className="max-w-[680px] mb-12">
          <h2 className="font-heading text-text text-[clamp(30px,4.4vw,48px)] font-medium tracking-[-0.035em] leading-[1.08] mb-5 text-balance">
            Compliant in India. Cleared for Europe. Same data.
          </h2>
          <p className="text-[15px] leading-[1.65] text-text-muted text-pretty">
            Carbon footprint, recycled content, supplier identities, mass
            balance — enter it once. Anviora keeps you compliant with India&apos;s
            BWM Rules, BIS and CPCB EPR, and the EU Battery Regulation at the
            same time, and even files your DGFT TRACE claims.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <Column title="India" tag="Live" items={india} tone="india" />
          <Column title="European Union" tag="Live" items={eu} tone="eu" />
        </div>

        <p className="mt-8 text-[15px] font-medium text-text text-pretty">
          The only India-born platform that does both — with native Tally integration, no SAP required.
        </p>
        </div>
      </div>
    </section>
  );
}
