"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, FileText, QrCode, Zap, ShieldCheck, CheckCircle2, AlertTriangle, Eye, Lock, RefreshCw, Server } from "lucide-react";

export default function Platform() {
  const carbonClasses = ["A", "B", "C", "D", "E"];

  const parsedFields = [
    { label: "Chemistry", value: "LFP" },
    { label: "Nominal voltage", value: "3.2 V" },
    { label: "Rated capacity", value: "280 Ah" },
    { label: "UN38.3 Status", value: "Pass" },
  ];

  const assembleFields = [
    { label: "Identity & manufacturer", pct: 100 },
    { label: "Materials & composition", pct: 100 },
    { label: "Carbon footprint", pct: 80 },
    { label: "Supply chain due diligence", pct: 64 },
  ];

  return (
    <section id="platform" className="bg-bg antialiased">
      <div className="max-w-[1232px] mx-auto">
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Header Block: Centered Option C Header */}
          <div className="text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Zap size={13} className="text-emerald-600 fill-emerald-600" />
              INDIA &amp; EU COMPLIANCE
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-bold tracking-[-0.035em] leading-[1.06] text-balance">
              Two regulatory markets.
              <br />
              <span className="text-emerald-600">One automated platform.</span>
            </h2>

            <p className="text-[14px] leading-[22px] text-text-muted text-pretty max-w-[640px] mx-auto">
              Ingest Indian supplier certificates and automatically output verified EU digital battery passports with complete carbon and supply chain traceability.
            </p>
          </div>

          {/* 6-Card Grid with 24px Gap (gap-6) - 14px Chamfer Cut Corner Cards (Plus Jakarta Sans Font) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            
            {/* Card 01 — UPLOAD CERTIFICATES */}
            <div
              className="bg-white border border-border p-7 sm:p-8 flex flex-col rounded-none transition-all duration-300 hover:bg-[#f2faf5] hover:border-emerald-500/50 font-sans"
              style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  01 / UPLOAD CERTIFICATES
                </span>
              </div>
              <h3 className="font-sans text-text text-[21px] font-bold tracking-[-0.03em] mb-3">
                AI Certificate Extraction
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Drop in raw BIS registrations, EPR approvals, UN38.3 transport reports, IEC 62133 safety certs, and MSDS PDFs. Anviora&apos;s OCR engine extracts 100+ raw parameters into structured JSON in seconds.
              </p>
            </div>

            {/* Card 02 — GAP ANALYSIS */}
            <div
              className="bg-white border border-border p-7 sm:p-8 flex flex-col rounded-none transition-all duration-300 hover:bg-[#f2faf5] hover:border-emerald-500/50 font-sans"
              style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  02 / GAP ANALYSIS
                </span>
              </div>
              <h3 className="font-sans text-text text-[21px] font-bold tracking-[-0.03em] mb-3">
                Live India &amp; EU Regulation Engine
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Cross-checks extracted battery metrics against active Indian CPCB &amp; BIS rules alongside EU Battery Regulation 2023/1542 mandates — generating a live readiness score that flags missing fields before shipment approval.
              </p>
            </div>

            {/* Card 03 — BUILD PASSPORT */}
            <div
              className="bg-white border border-border p-7 sm:p-8 flex flex-col rounded-none transition-all duration-300 hover:bg-[#f2faf5] hover:border-emerald-500/50 font-sans"
              style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  03 / BUILD PASSPORT
                </span>
              </div>
              <h3 className="font-sans text-text text-[21px] font-bold tracking-[-0.03em] mb-3">
                Automated W3C Passport Builder
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Aggregates cell chemistry, nominal capacity, lifecycle metrics, and supplier documentation into a version-controlled, cryptographically signed W3C Verifiable Credential tied to the battery serial number.
              </p>
            </div>

            {/* Card 04 — CARBON FOOTPRINT */}
            <div
              className="bg-white border border-border p-7 sm:p-8 flex flex-col rounded-none transition-all duration-300 hover:bg-[#f2faf5] hover:border-emerald-500/50 font-sans"
              style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  04 / CARBON FOOTPRINT
                </span>
              </div>
              <h3 className="font-sans text-text text-[21px] font-bold tracking-[-0.03em] mb-3">
                Calculated EU Carbon <span className="whitespace-nowrap">Class A–E</span>
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Automates lifecycle carbon accounting across raw material extraction, cell manufacturing, and grid energy mix to assign mandatory EU performance classes (Class A through E) per manufactured battery batch.
              </p>
            </div>

            {/* Card 05 — SHARE WITH BUYERS */}
            <div
              className="bg-white border border-border p-7 sm:p-8 flex flex-col rounded-none transition-all duration-300 hover:bg-[#f2faf5] hover:border-emerald-500/50 font-sans"
              style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  05 / SHARE WITH BUYERS
                </span>
              </div>
              <h3 className="font-sans text-text text-[21px] font-bold tracking-[-0.03em] mb-3">
                Multi-Tier Buyer &amp; Customs Portals
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Generate dynamic QR-coded public landing pages and buyer-specific portals. European importers verify compliance in one click while you retain full governance over proprietary supplier &amp; material data.
              </p>
            </div>

            {/* Card 06 — EXPIRY ALERTS */}
            <div
              className="bg-white border border-border p-7 sm:p-8 flex flex-col rounded-none transition-all duration-300 hover:bg-[#f2faf5] hover:border-emerald-500/50 font-sans"
              style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
            >
              <div className="mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  06 / EXPIRY ALERTS
                </span>
              </div>
              <h3 className="font-sans text-text text-[21px] font-bold tracking-[-0.03em] mb-3">
                Automated Expiry &amp; Risk Warnings
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Tracks periodic renewal windows for BIS registrations, UN38.3 test validity, and supplier declarations — sending automated 30, 7, and 1-day alerts before regulatory lapses stall customs clearance.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
