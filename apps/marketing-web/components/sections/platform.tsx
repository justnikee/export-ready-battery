"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, FileText, QrCode } from "lucide-react";

const parsedFields = [
  { label: "Chemistry", value: "LFP" },
  { label: "Nominal voltage", value: "3.2 V" },
  { label: "Rated capacity", value: "280 Ah" },
  { label: "Cycle life", value: "6,000" },
  { label: "UN38.3", value: "Pass" },
  { label: "Mfg. country", value: "India" },
];

const assembleFields = [
  { label: "Identity & manufacturer", pct: 100 },
  { label: "Materials & composition", pct: 100 },
  { label: "Carbon footprint", pct: 80 },
  { label: "Supply chain due diligence", pct: 64 },
];

const carbonClasses = ["A", "B", "C", "D", "E"];

interface RowProps {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta?: { label: string; href: string };
  flip?: boolean;
  children: React.ReactNode;
}

// Visual Row Wrapper
function FeatureRow({ eyebrow, title, body, bullets, cta, flip, children }: RowProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center ${
        flip ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div>
        <div className="eyebrow-blue mb-3">{eyebrow}</div>
        <h3 className="font-heading text-text text-[clamp(28px,3.4vw,40px)] font-medium tracking-[-0.035em] leading-[1.08] mb-5">
          {title}
        </h3>
        <p className="text-[15px] leading-[1.65] text-text-muted mb-3 text-pretty">{body}</p>
        <ul className="grid gap-2 mb-6">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15px] leading-[1.65] text-text-muted">
              <span className="inline-flex items-center justify-center w-[20px] h-[20px] mt-0.5 rounded-sm bg-blue-tint text-blue shrink-0">
                <Check size={12} strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
        {cta && (
          <a
            href={cta.href}
            className="group inline-flex items-center gap-1 text-[14px] font-medium text-blue hover:text-blue-hover transition-colors"
          >
            {cta.label} <ArrowRight size={14} className="cta-arrow" />
          </a>
        )}
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}

export default function Platform() {
  const visualCardWrapper = "relative bg-[#f4f8ff] border border-border p-6 rounded-none overflow-hidden min-h-[300px] flex flex-col justify-center";
  
  const DotGrid = () => (
    <div 
      className="absolute inset-0 pointer-events-none" 
      style={{
        backgroundImage: "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
        backgroundSize: "16px 16px"
      }}
    />
  );

  return (
    <section id="platform" className="">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">PLATFORM</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">3</span>/8]
          </span>
        </div>
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

        <div className="grid gap-28 lg:gap-36">
          {/* Row 1 — Collect / Discover */}
          <FeatureRow
            eyebrow="01 · COLLECT"
            title="Know what's missing before you ship"
            body="Drop in your BIS, EPR, UN38.3, IEC 62133 and MSDS PDFs. Anviora reads them, extracts 100+ fields, and maps every one against EU and India requirements — so you see exactly which gaps will block your next order."
            bullets={[
              "AI extracts 100+ fields from a certificate in seconds",
              "Live gap score per product line, updated as documents arrive",
              "Supplier reminders and expiry tracking built in",
            ]}
            cta={{ label: "Learn more", href: "/battery" }}
          >
            <div className={visualCardWrapper}>
              <DotGrid />
              <div className="relative z-10 bg-white border border-border p-4 shadow-md space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-text">Certificate parsing</span>
                  <span className="inline-flex items-center h-6 px-2.5 rounded-sm bg-blue-tint text-blue text-[11px] font-mono font-medium">
                    112 fields · 98%
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-3 border border-border">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-blue-tint text-blue shrink-0">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-text truncate">
                      UN38.3_LFP-B4471.pdf
                    </div>
                    <div className="text-[11px] text-text-dim font-mono">Parsed in 4.2s · auto-mapped</div>
                  </div>
                  <span className="inline-flex items-center h-5 px-2 rounded-sm bg-blue-tint text-blue text-[10px] font-mono font-medium">
                    Done
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {parsedFields.map((f) => (
                    <div key={f.label} className="px-3 py-2 bg-bg-alt">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
                        {f.label}
                      </div>
                      <div
                        className="text-[12px] font-medium text-text tabular-nums"
                      >
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border text-[11px] font-medium font-mono text-text-dim">
                  Mapped to EU 2023/1542 + India BWM — 2 gaps flagged
                </div>
              </div>
            </div>
          </FeatureRow>

          {/* Row 2 — Assemble / Build */}
          <FeatureRow
            eyebrow="02 · ASSEMBLE"
            title="Build an EU-ready passport in minutes"
            body="Turn scattered certificates and ERP exports into a structured, versioned Battery Passport — every field the EU expects, a calculated carbon class, and a QR code buyers can verify in seconds."
            bullets={[
              "Every EU 2023/1542 passport field, pre-mapped",
              "Carbon footprint + A–G class, calculated for you",
              "Full version history on every field",
            ]}
            cta={{ label: "See how it works", href: "/battery" }}
            flip
          >
            <div className={visualCardWrapper}>
              <DotGrid />
              <div className="relative z-10 bg-white border border-border p-4 shadow-md space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-text">LFP-B4471 — passport build</span>
                  <span
                    className="font-heading text-[20px] font-medium tracking-[-0.03em] text-text tabular-nums"
                  >
                    84%
                  </span>
                </div>
                <div className="text-[11px] text-text-dim font-mono">Ready to publish once due diligence closes</div>
                <div className="grid gap-3">
                  {assembleFields.map((f) => (
                    <div key={f.label}>
                      <div className="flex items-center justify-between mb-1 text-[11px]">
                        <span className="font-medium text-text-muted">{f.label}</span>
                        <span
                          className="font-mono font-medium text-blue tabular-nums"
                        >
                          {f.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-bg-alt overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${f.pct}%`,
                            background: f.pct === 100 ? "var(--color-blue)" : "var(--color-text-dim)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-text-dim font-mono mb-1.5">Carbon class</div>
                    <div className="flex items-center gap-1">
                      {carbonClasses.map((c) => (
                        <span
                          key={c}
                          className={`inline-flex items-center justify-center w-6 h-6 text-[11px] font-mono font-bold ${
                            c === "B"
                              ? "bg-blue text-white"
                              : "bg-bg-alt text-text-dim"
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center w-12 h-12 border border-border text-text">
                    <QrCode size={28} />
                  </span>
                </div>
              </div>
            </div>
          </FeatureRow>

          {/* Row 3 — Share / Govern */}
          <FeatureRow
            eyebrow="03 · SHARE"
            title="Share proof with buyers, on your terms"
            body="Publish a QR-coded public page and permissioned portals. Buyers verify in one click; regulators get the full audit trail; you control exactly which fields each side sees."
            bullets={[
              "Three access tiers — public, partner, regulator (Art. 78)",
              "Magic-link portals per buyer",
              "Scan analytics and view tracking",
            ]}
            cta={{ label: "Explore sharing", href: "/battery" }}
          >
            <div className={visualCardWrapper}>
              <DotGrid />
              <div className="relative z-10 bg-white border border-border p-4 shadow-md space-y-3.5">
                <div className="text-[13px] font-medium text-text">Share passport — LFP-B4471</div>
                <div className="flex items-center gap-2 px-3 py-2 border border-border bg-bg-alt">
                  <span className="flex-1 text-[11px] font-medium font-mono text-text-dim truncate">
                    portal.anviora.com/p/lfp-b4471
                  </span>
                  <span className="inline-flex items-center h-6 px-2.5 rounded-sm bg-dark text-white text-[10px] font-medium font-mono">
                    Copy link
                  </span>
                </div>
                <div className="grid gap-2.5">
                  {[
                    { label: "Public QR page", desc: "Regulated fields — anyone", on: true },
                    { label: "Buyer portal — Nordvolt", desc: "Partner: full evidence", on: true },
                    { label: "Regulator access", desc: "Complete audit trail", on: false },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[12.5px] font-medium text-text">{p.label}</div>
                        <div className="text-[11px] text-text-dim">{p.desc}</div>
                      </div>
                      <span
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${
                          p.on ? "bg-blue" : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white ${
                            p.on ? "right-0.5" : "left-0.5"
                          }`}
                        />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-[11px] font-medium font-mono text-text-dim">
                  Viewed by Nordvolt GmbH 2 hours ago
                  <ArrowRight size={11} />
                </div>
              </div>
            </div>
          </FeatureRow>

          {/* Row 4 — Monitor / Optimize */}
          <FeatureRow
            eyebrow="04 · MONITOR"
            title="Catch problems before they reach the port"
            body="Anviora watches every certificate, carbon figure, and supplier record and warns you 30, 7, and 1 days out — so issues get fixed in Pune, not flagged in Rotterdam."
            bullets={[
              "Proactive expiry and compliance-drop alerts",
              "Multi-supplier dashboard with risk scoring",
              "Audit-ready evidence pack in one click",
            ]}
            cta={{ label: "See monitoring", href: "/battery" }}
            flip
          >
            <div className={visualCardWrapper}>
              <DotGrid />
              <div className="relative z-10 bg-white border border-border p-4 shadow-md space-y-3.5">
                <div className="text-[13px] font-medium text-text">Compliance alerts — Next 30 days</div>
                <div className="grid gap-3">
                  {[
                    { text: "CE Declaration expires in 14 days", tone: "#ea580c", icon: "!" },
                    { text: "2 suppliers missing REACH letters", tone: "#dc2626", icon: "!" },
                    { text: "Carbon data stale for PACK-M204", tone: "#a16207", icon: "•" },
                  ].map((alert) => (
                    <div
                      key={alert.text}
                      className="flex items-center gap-3 px-3 py-2 border border-border text-[12.5px] font-medium text-text bg-white"
                    >
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-white text-[10px] font-bold shrink-0"
                        style={{ background: alert.tone }}
                      >
                        {alert.icon}
                      </span>
                      {alert.text}
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] font-medium font-mono text-text-dim">
                  <span>3 risks need attention</span>
                  <a href="/battery" className="text-blue hover:underline">
                    View all
                  </a>
                </div>
              </div>
            </div>
          </FeatureRow>
        </div>
        </div>
      </div>
    </section>
  );
}
