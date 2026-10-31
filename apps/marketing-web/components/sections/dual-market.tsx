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
  { code: "BIS CRS", title: "Store IS 16046 R-numbers and PDFs for portable cells — we do not issue the licence", badge: "VAULT" },
  { code: "CPCB EPR", title: "Keep EPR numbers and export a Form 3 CSV helper — filing stays on the CPCB portal", badge: "LEDGER" },
  { code: "BWM RULES", title: "Track producer records; recycled-content floors start FY 2027-28", badge: "RECORDS" },
  { code: "UN 38.3", title: "Hold the transport test report next to the lot — not a passport duty", badge: "DOCUMENT" },
  { code: "PACK QR", title: "Serials and printable labels your warehouse can scan", badge: "ACTIVE QR" },
];

const euItems = [
  { code: "ART. 77", title: "Passport for LMT, industrial >2 kWh, and EV packs from 18 Feb 2027", badge: "PASSPORT" },
  { code: "ART. 13", title: "QR on all batteries from the same date; full passport only for the three categories", badge: "QR" },
  { code: "ART. 7", title: "Optional screening estimate — not PEFCR, not a Commission class", badge: "ESTIMATE" },
  { code: "ART. 48", title: "Due diligence from 18 Aug 2027 — not a Feb 2027 passport field", badge: "LATER" },
  { code: "PUBLIC PAGE", title: "Buyer scans /p/{uuid} with no Anviora login", badge: "NO LOGIN" },
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
            ? "Public / partner / regulator views — not the EU registry"
            : "Certificate vault — not a CPCB or BIS filing"}
        </span>
        <span className="font-semibold uppercase tracking-wider text-emerald-700">RECORDS, NOT FILINGS</span>
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
              India papers you already have.
              <br />
              An EU-scannable record for the buyer.
            </h2>

            <p className="text-[14px] leading-[22px] text-text-muted text-pretty max-w-[680px] mx-auto">
              One lot record: category, certificates, serials, QR. India numbers live next to the EU scan page. We store evidence. We do not file CPCB, issue BIS, or assign a legal carbon class.
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
            Built for Indian pack assemblers who already export, or are contracted to export, LMT or industrial packs above 2 kWh to the EU.
          </p>
        </div>
      </div>
    </section>
  );
}
