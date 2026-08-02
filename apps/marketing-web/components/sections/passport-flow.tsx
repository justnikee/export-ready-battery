"use client";

import { motion } from "framer-motion";
import { FileUp, ShieldCheck, CheckCircle2, Zap, Check } from "lucide-react";

/* Decorative mini QR code for Step 4 visual */
function MiniQR({ size = 44 }: { size?: number }) {
  const s = size / 9;
  const cells = [
    [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
    [0, 6], [0, 7], [0, 8], [1, 6], [1, 8], [2, 6], [2, 7], [2, 8],
    [6, 0], [6, 1], [6, 2], [7, 0], [7, 2], [8, 0], [8, 1], [8, 2],
    [3, 4], [4, 1], [4, 3], [4, 5], [4, 7], [5, 2], [5, 4], [5, 6],
    [6, 4], [6, 6], [7, 5], [7, 7], [8, 4], [8, 6], [8, 8],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="text-emerald-950">
      {cells.map(([r, c], i) => (
        <rect
          key={i}
          x={c * s}
          y={r * s}
          width={s - 0.5}
          height={s - 0.5}
          rx={0}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default function PassportFlow() {
  return (
    <section id="how-it-works" className="relative bg-bg">
      <div className="max-w-[1232px] mx-auto border-x border-b border-border">
        <div className="pt-16 lg:pt-20">
          {/* Header Block: Centered Pill, Headline & Subheading */}
          <div className="px-6 text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Check size={13} className="text-emerald-600" />
              HOW IT WORKS
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
              Four steps.
              <br />
              No consultants.
            </h2>

            <p className="text-[16px] leading-[1.65] text-text-muted text-pretty max-w-[620px] mx-auto">
              Upload raw certificates. Anviora validates against live EU &amp; India regulations, issues signed verifiable credentials, and generates instant QR codes for buyer verification.
            </p>
          </div>

          {/* 4-Step Grid Pipeline — Contiguous Gapless 2x2 Container */}
          <div className="border-t border-border bg-white grid grid-cols-1 md:grid-cols-2">
            
            {/* Card 01 - Upload */}
            <div className="bg-white border-b md:border-r border-border flex flex-col justify-between p-6 sm:p-8 rounded-none">
              {/* Direct Graphic Component 01 (h-[200px]) */}
              <div className="h-[200px] w-full p-5 text-center bg-[#f2faf5] flex flex-col items-center justify-center space-y-3 mb-6 rounded-none">
                <FileUp size={26} className="text-emerald-600 animate-pulse" />
                <div>
                  <span className="text-emerald-950 font-bold block text-[13.5px]">📄 bis_cert_2026.pdf</span>
                  <span className="text-[11px] text-emerald-800/70 font-mono">1.2 MB • Ready to process</span>
                </div>
                <div className="w-full max-w-[280px] bg-emerald-200 h-1.5 overflow-hidden mt-1 rounded-none">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    className="bg-emerald-600 h-full"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                    01 / UPLOAD
                  </span>
                </div>
                <h3 className="font-heading text-text text-[20px] sm:text-[22px] font-semibold tracking-[-0.03em] mb-2">
                  Upload Batch Records
                </h3>
                <p className="text-[15px] leading-[1.6] text-text-muted text-pretty">
                  Upload raw manufacturer PDFs, test reports, and supply chain records. Our automated ingester extracts batch parameters directly without manual data entry.
                </p>
              </div>
            </div>

            {/* Card 02 - Parse & Validate */}
            <div className="bg-white border-b border-border flex flex-col justify-between p-6 sm:p-8 rounded-none">
              {/* Direct Graphic Component 02 (h-[200px]) */}
              <div className="h-[200px] w-full bg-[#f2faf5] p-5 font-mono text-xs flex flex-col justify-center space-y-2.5 mb-6 rounded-none">
                <div className="flex justify-between items-center border-b border-emerald-900/10 pb-2">
                  <span className="text-emerald-800/70 text-[11.5px]">chemistry</span>
                  <span className="text-slate-900 font-semibold text-[12px]">LFP (Lithium Iron)</span>
                </div>
                <div className="flex justify-between items-center border-b border-emerald-900/10 pb-2">
                  <span className="text-emerald-800/70 text-[11.5px]">capacity</span>
                  <span className="text-slate-900 font-semibold text-[12px]">280 Ah</span>
                </div>
                <div className="flex justify-between items-center border-b border-emerald-900/10 pb-2">
                  <span className="text-emerald-800/70 text-[11.5px]">carbon_class</span>
                  <span className="text-emerald-800 font-semibold text-[12px]">Class A</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-emerald-800/70 text-[11.5px]">bis_status</span>
                  <span className="text-emerald-800 font-semibold text-[11.5px] bg-emerald-100 px-2 py-0.5 border border-emerald-300">✓ VALID 2027</span>
                </div>
              </div>

              <div>
                <div className="mb-2.5">
                  <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                    02 / PARSE &amp; VALIDATE
                  </span>
                </div>
                <h3 className="font-heading text-text text-[22px] font-bold tracking-[-0.03em] mb-2">
                  AI Validates &amp; Maps
                </h3>
                <p className="text-[15.5px] leading-[1.6] text-text-muted text-pretty">
                  Automated engine parses 100+ battery metrics — from cell chemistry to carbon footprint calculations — validating compliance against active EU Battery Regulation rules.
                </p>
              </div>
            </div>

            {/* Card 03 - Secure & Anchor */}
            <div className="bg-white border-b md:border-b-0 md:border-r border-border flex flex-col justify-between p-7 sm:p-8 rounded-none">
              {/* Direct Graphic Component 03 (h-[210px]) */}
              <div className="h-[210px] w-full bg-[#f2faf5] p-5 font-mono text-xs flex flex-col justify-center gap-3.5 mb-6 rounded-none">
                <div className="flex items-center justify-between gap-3">
                  <div className="bg-white border border-emerald-500/20 p-3 flex-1 rounded-none">
                    <div className="text-[9.5px] text-emerald-800/70 mb-0.5 uppercase tracking-wider font-semibold">DATA_HASH</div>
                    <div className="text-emerald-950 font-bold text-[11.5px] truncate">sha256:7c0a...</div>
                  </div>
                  <div className="text-amber-500 font-bold text-lg flex-shrink-0">➔</div>
                  <div className="bg-amber-50 border border-amber-300 p-3 flex-1 rounded-none">
                    <div className="text-[9.5px] text-amber-900/80 mb-0.5 uppercase tracking-wider font-bold">BTC_BLOCK</div>
                    <div className="text-amber-900 font-bold text-[11.5px]">#842,190</div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 font-semibold text-center rounded-none">
                  ✓ Timestamped via OpenTimestamps
                </div>
              </div>

              <div>
                <div className="mb-2.5">
                  <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                    03 / SECURE &amp; ANCHOR
                  </span>
                </div>
                <h3 className="font-heading text-text text-[22px] font-bold tracking-[-0.03em] mb-2">
                  Blockchain Anchored Proof
                </h3>
                <p className="text-[15.5px] leading-[1.6] text-text-muted text-pretty">
                  Batch parameters are cryptographically hashed and anchored to the Bitcoin blockchain via OpenTimestamps, establishing permanent, tamper-proof proof of origin.
                </p>
              </div>
            </div>

            {/* Card 04 - Identity Issued */}
            <div className="bg-white flex flex-col justify-between p-7 sm:p-8 rounded-none">
              {/* Direct Graphic Component 04 (h-[210px]) */}
              <div className="h-[210px] w-full bg-[#f2faf5] p-6 font-mono text-xs flex items-center justify-between mb-6 rounded-none">
                <div className="space-y-1.5">
                  <div className="text-[10px] text-emerald-800/70 uppercase tracking-wider font-semibold">ANVIORA PASSPORT</div>
                  <div className="text-emerald-950 font-bold text-[15px] tracking-wide">IN-LFP-2026-B4471</div>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-2 font-bold">
                    <CheckCircle2 size={13} />
                    Cryptographically Signed
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 p-2 flex items-center justify-center rounded-none">
                  <MiniQR size={42} />
                </div>
              </div>

              <div>
                <div className="mb-2.5">
                  <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                    04 / IDENTITY ISSUED
                  </span>
                </div>
                <h3 className="font-heading text-text text-[22px] font-bold tracking-[-0.03em] mb-2">
                  Signed Verifiable Credentials
                </h3>
                <p className="text-[15.5px] leading-[1.6] text-text-muted text-pretty">
                  Generates W3C-compliant Digital Battery Passports with cryptographically signed JSON data and dynamic QR codes for instant verification at European ports.
                </p>
              </div>
            </div>

          </div>

          {/* 5th Card - Outcome / Destination Verification Payoff (Matching White Card Style) */}
          <div className="border-t border-border bg-white p-7 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-10 rounded-none">
            
            {/* Content Left */}
            <div className="space-y-3.5 max-w-xl">
              <div>
                <span className="font-mono text-xs font-semibold text-emerald-700 tracking-wider uppercase inline-block">
                  05 / VERIFICATION PAYOFF
                </span>
              </div>
              <h3 className="font-heading text-text text-[clamp(28px,3.8vw,42px)] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
                10-second scan verify at destination.
              </h3>
              <p className="text-[15.5px] leading-[1.6] text-text-muted text-pretty">
                Steps 01–04 compile the cryptographic credential. European buyers &amp; customs authorities scan the QR code on the battery at destination port to instantly view compliance details, carbon footprint, and blockchain proofs.
              </p>
            </div>

            {/* Right Side Destination Verification Preview Card (Clean Inner Graphic Box) */}
            <div className="w-full lg:w-[360px] bg-[#f2faf5] p-5 sm:p-6 border border-emerald-500/20 select-none rounded-none text-text">
              {/* Header badge */}
              <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-white border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="text-[12px] font-mono font-bold text-emerald-800 tracking-wide">PASSPORT VERIFIED</div>
                    <div className="text-[10px] font-mono text-emerald-800/70">Live Cryptographic Audit</div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase rounded-none">
                  100% PASS
                </span>
              </div>

              {/* Passport Specs List */}
              <div className="space-y-2.5 font-mono text-[11.5px] border-b border-emerald-900/10 pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800/70">Serial ID:</span>
                  <span className="text-slate-900 font-bold">IN-LFP-2026-B4471</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800/70">Chemistry:</span>
                  <span className="text-slate-900 font-semibold">LFP (Lithium Iron)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800/70">Carbon Footprint:</span>
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">Class A (18 kg)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800/70">BTC Timestamp:</span>
                  <span className="text-emerald-700 font-semibold">Block #842,190</span>
                </div>
              </div>

              {/* Live QR Verification Badge Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 font-mono">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Verified at EU Customs
                </div>
                <div className="p-1 bg-white border border-emerald-200">
                  <MiniQR size={32} />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
