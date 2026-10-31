"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, FileText, QrCode, Zap, ShieldCheck, CheckCircle2, AlertTriangle, Eye, Lock, RefreshCw, Server } from "lucide-react";

export default function Platform() {
  const parsedFields = [
    { label: "Chemistry", value: "LFP" },
    { label: "Nominal voltage", value: "3.2 V" },
    { label: "Rated capacity", value: "280 Ah" },
    { label: "UN38.3 Status", value: "Pass" },
  ];

  const assembleFields = [
    { label: "Identity & manufacturer", pct: 100 },
    { label: "Materials & composition", pct: 100 },
    { label: "Carbon estimate (optional)", pct: 40 },
    { label: "Due diligence (from Aug 2027)", pct: 20 },
  ];

  return (
    <section id="platform" className="bg-bg antialiased">
      <div className="max-w-[1232px] mx-auto border-x border-b border-border">
        <div className="px-6 pt-16 pb-16 lg:pt-20 lg:pb-20">
          {/* Header Block: Centered Option C Header */}
          <div className="text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Zap size={13} className="text-emerald-600 fill-emerald-600" />
              INDIA &amp; EU COMPLIANCE
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
              Two regulatory markets.
              <br />
              One automated platform.
            </h2>

            <p className="text-[14px] leading-[22px] text-text-muted text-pretty max-w-[640px] mx-auto">
              Upload the PDFs you already have. We issue serials, a public QR page, and a certificate vault. That is not a notified-body stamp and not a CPCB filing.
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
                Drop in UN 38.3, MSDS, DoC, and BIS/EPR PDFs when you have them. Extraction is an aid — you still review the fields. We do not verify licences against CPCB or BIS.
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
                Category-correct activation checklist
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Flags missing fields for this lot and this category. Warnings for duties not yet in force. A score is not a legal clearance.
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
                Lot → serials → public page
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                House serials, printable QR to /p/{"{uuid}"}, hash-chained lifecycle. Optional W3C credential is extra — the scan page is the product.
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
                Carbon screening estimate
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Optional kg CO₂e per kWh from a bill of materials. Not PEFCR, not Article 7, not a Commission A–G class. Useful for internal talk; not a legal declaration.
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
                Public page, partner link, regulator key
              </h3>
              <p className="font-sans text-[14px] leading-[22px] text-text-muted text-pretty">
                Three access tiers on our host. The importer scans without an account. That is not a customs portal and not the EU DPP Registry.
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
                Reminder dates on certificates you stored. A reminder is not a renewed licence and does not clear a shipment.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
