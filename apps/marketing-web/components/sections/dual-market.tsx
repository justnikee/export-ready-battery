"use client";

import { Check, ShieldCheck, Zap } from "lucide-react";

function IndiaFlagSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.68)} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 border border-black/10">
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="10.66" width="24" height="5.33" fill="#128807" />
      <circle cx="12" cy="8" r="2" stroke="#000080" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

function EUFlagSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.68)} viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 border border-black/10">
      <rect width="24" height="16" fill="#003399" />
      <circle cx="12" cy="8" r="4.8" stroke="#FFCC00" strokeWidth="0.9" strokeDasharray="1.2 1.4" fill="none" />
    </svg>
  );
}

const indiaItems = [
  { code: "BIS IS 16046", title: "Cell & Pack Safety Certification", badge: "MANDATORY" },
  { code: "CPCB EPR", title: "Extended Producer Responsibility Filing", badge: "REGISTRATION" },
  { code: "BWM RULES 2022", title: "Battery Waste Management Compliance", badge: "COMPLIANT" },
  { code: "DGFT TRACE", title: "Export Incentive & Duty Drawback Claims", badge: "AUTOMATED" },
  { code: "QR TRACEABILITY", title: "Batch Serialized Traceability QR", badge: "SERIALIZED" },
];

const euItems = [
  { code: "EU 2023/1542", title: "Verifiable Battery Digital Passport", badge: "ART. 77" },
  { code: "CE MARKING", title: "EU Declaration of Conformity (DoC)", badge: "VERIFIED" },
  { code: "CARBON FOOTPRINT", title: "Lifecycle Carbon Class & Audit (A–G)", badge: "ANNEX II" },
  { code: "DUE DILIGENCE", title: "Supply Chain Risk & CMRT Audit", badge: "ART. 48" },
  { code: "BPAN IDENTITY", title: "W3C Signed Verifiable Credential QR", badge: "PUBLIC QR" },
];

function Column({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: typeof indiaItems;
  tone: "india" | "eu";
}) {
  const isEu = tone === "eu";
  return (
    <div
      className={`relative flex-1 p-7 lg:p-9 rounded-none overflow-hidden flex flex-col justify-between ${
        isEu ? "bg-[#fffbeb] text-slate-900" : "bg-[#f0fdf4] text-slate-900"
      }`}
    >
      <div>
        {/* Header Bar */}
        <div className={`mb-6 pb-5 border-b ${isEu ? "border-amber-900/10" : "border-emerald-900/10"}`}>
          <div className="flex items-center gap-2 mb-1">
            {isEu ? <EUFlagSvg size={24} /> : <IndiaFlagSvg size={24} />}
            <span className="font-mono text-[11.5px] uppercase tracking-wider text-slate-700 font-normal">
              {subtitle}
            </span>
          </div>
          <h3 className="font-heading text-[24px] font-normal tracking-[-0.02em] leading-tight text-slate-900">
            {title}
          </h3>
        </div>

        {/* Structured Items List — Checkmark pill boxes with close text */}
        <div className="grid gap-2.5 mb-8">
          {items.map((item) => (
            <div
              key={item.code}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 text-slate-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 shrink-0 border ${
                    isEu
                      ? "bg-amber-200/70 text-amber-950 border-amber-300"
                      : "bg-emerald-200/70 text-emerald-950 border-emerald-300"
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-[14.5px] font-normal text-slate-800">
                  <span className="font-mono text-[13px] font-medium text-slate-950 mr-1.5">{item.code} —</span>
                  {item.title}
                </span>
              </div>
              <span className={`hidden sm:inline-block font-mono text-[11px] font-normal uppercase tracking-wider shrink-0 ml-3 ${isEu ? "text-amber-900/70" : "text-emerald-900/70"}`}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Integration Highlight Bar */}
      <div
        className={`pt-4 border-t flex items-center justify-between text-[12px] font-mono font-normal ${
          isEu
            ? "border-amber-900/15 text-amber-900"
            : "border-emerald-900/15 text-emerald-900"
        }`}
      >
        <span className="flex items-center gap-1.5 font-normal">
          {isEu ? (
            <ShieldCheck size={15} className="text-amber-700" />
          ) : (
            <Zap size={15} className="text-emerald-700" />
          )}
          {isEu
            ? "EU Customs Verification Ready (Art. 77/78)"
            : "Native Tally Prime Auto-Sync & GST Claims"}
        </span>
        <span className="font-normal uppercase tracking-wider text-slate-700">100% COVERAGE</span>
      </div>
    </div>
  );
}

export default function DualMarket() {
  return (
    <section className="">
      <div className="max-w-[1232px] mx-auto">
        {/* Section header */}
        <div className="sticky top-20 z-20 bg-bg/95 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <span className="section-index">DUAL COMPLIANCE</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-emerald-600 font-semibold">5</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

        <div className="max-w-[680px] mb-12">
          <h2 className="font-heading text-text text-[clamp(32px,4.5vw,52px)] font-semibold tracking-[-0.035em] leading-[1.08] mb-5 text-balance">
            Compliant in India. Cleared for Europe. Same data.
          </h2>
          <p className="text-[15px] leading-[1.65] text-text-muted text-pretty">
            Carbon footprint, recycled content, supplier identities, mass
            balance — enter it once. Anviora keeps you compliant with India&apos;s
            BWM Rules, BIS and CPCB EPR, and the EU Battery Regulation at the
            same time, and even files your DGFT TRACE claims.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <Column
            title="India Market"
            subtitle="Domestic Rules & Registrations"
            items={indiaItems}
            tone="india"
          />
          <Column
            title="European Union"
            subtitle="Export Mandates & Battery Passport"
            items={euItems}
            tone="eu"
          />
        </div>

        <p className="mt-8 text-[15px] font-medium text-text text-pretty">
          The only India-born platform that does both — with native Tally integration, no SAP required.
        </p>
        </div>
      </div>
    </section>
  );
}
