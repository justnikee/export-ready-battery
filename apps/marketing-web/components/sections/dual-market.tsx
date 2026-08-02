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
  { code: "BIS IS 16046 / 16047", title: "Mandatory Cell & Pack Safety Certification", badge: "BIS VERIFIED" },
  { code: "CPCB EPR FILING", title: "Extended Producer Responsibility Target Return", badge: "CPCB CLEARED" },
  { code: "BWM RULES 2022", title: "Battery Waste Management Recycling & Recovery", badge: "COMPLIANT" },
  { code: "DGFT TRACE CLAIMS", title: "Export Incentive & Duty Drawback Verification", badge: "AUTOMATED" },
  { code: "BATCH QR TRACEABILITY", title: "Serialized Production Batch QR & Custom Portals", badge: "ACTIVE QR" },
];

const euItems = [
  { code: "EU REG 2023/1542", title: "Mandatory Digital Battery Passport Credential", badge: "ART. 77 MANDATE" },
  { code: "EU CE MARKING", title: "Declaration of Conformity & Safety Dossier", badge: "DOC VERIFIED" },
  { code: "CARBON CLASS A–E", title: "Lifecycle Carbon Footprint & Energy Mix Audit", badge: "ANNEX II AUDIT" },
  { code: "CMRT DUE DILIGENCE", title: "Supply Chain Conflict Mineral & Risk Audit", badge: "ART. 48 AUDIT" },
  { code: "PUBLIC W3C QR", title: "Cryptographically Signed Verifiable Credential", badge: "W3C SIGNED" },
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
      className="relative p-7 lg:p-9 bg-[#f2faf5] text-slate-900 flex flex-col justify-between font-sans"
      style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
    >
      <div>
        {/* Header Bar */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            {isEu ? <EUFlagSvg size={24} /> : <IndiaFlagSvg size={24} />}
            <span className="font-mono text-[11.5px] uppercase tracking-wider text-text-dim font-medium">
              {subtitle}
            </span>
          </div>
          <h3 className="font-sans text-[26px] font-semibold tracking-[-0.03em] leading-tight text-text">
            {title}
          </h3>
        </div>

        {/* Structured Items List — Pure clean design tokens */}
        <div className="grid gap-2.5 mb-6 font-sans">
          {items.map((item) => (
            <div
              key={item.code}
              className="flex flex-row items-start justify-between py-1.5 text-text gap-3"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="h-[22px] flex items-center shrink-0">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] border bg-white text-emerald-800 border-emerald-500/40 translate-y-[2px]">
                    <Check size={11} strokeWidth={3} />
                  </span>
                </div>
                <span className="text-[14px] leading-[22px] font-normal text-text-muted">
                  <span className="font-mono text-[13px] font-semibold text-text mr-1.5">{item.code} —</span>
                  {item.title}
                </span>
              </div>
              <div className="h-[22px] flex items-center shrink-0">
                <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-emerald-800">
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Integration Highlight Bar */}
      <div className="pt-2 flex items-center justify-between text-[12px] font-mono font-medium text-text-muted">
        <span className="flex items-center gap-1.5 font-medium text-text">
          {isEu ? (
            <ShieldCheck size={15} className="text-emerald-700" />
          ) : (
            <Zap size={15} className="text-emerald-700" />
          )}
          {isEu
            ? "EU Customs Verification Ready (Art. 77/78)"
            : "Native Tally Prime Auto-Sync & GST Claims"}
        </span>
        <span className="font-semibold uppercase tracking-wider text-emerald-700">100% COVERAGE</span>
      </div>
    </div>
  );
}

export default function DualMarket() {
  return (
    <section className="bg-bg antialiased">
      <div className="max-w-[1232px] mx-auto border-x border-b border-border">
        <div className="px-6 pt-16 pb-16 lg:pt-20 lg:pb-20">

          {/* Header Block: Centered Pill, Headline & Subheading */}
          <div className="text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Zap size={13} className="text-emerald-600 fill-emerald-600" />
              DUAL COMPLIANCE
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
              Compliant in India.
              <br />
              Cleared for Europe. Single Data Engine.
            </h2>

            <p className="text-[14px] leading-[22px] text-text-muted text-pretty max-w-[680px] mx-auto">
              Enter cell chemistry, carbon accounting, EPR filings, and supplier declarations once. Anviora automatically synchronizes Indian CPCB/BIS registrations with mandatory EU 2023/1542 battery passport credentials.
            </p>
          </div>

          {/* 2-Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <p className="mt-10 lg:mt-12 text-center text-[15px] font-medium text-text text-pretty">
            The only platform engineered for Indian battery exporters — zero manual re-entry, native ERP sync, 100% audit-ready.
          </p>
        </div>
      </div>
    </section>
  );
}
