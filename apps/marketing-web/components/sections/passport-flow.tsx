"use client";

import { motion } from "framer-motion";
import { FileUp, ShieldCheck, CheckCircle2, Zap } from "lucide-react";

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
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Sticky Section header with index marker */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">HOW IT WORKS</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">1</span>/8]
          </span>
        </div>

        <div className="pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Header Block */}
          <div className="px-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <div className="space-y-4 max-w-[680px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue/10 text-blue text-xs font-mono tracking-wider uppercase rounded-none">
                <span className="w-1.5 h-1.5 bg-blue" />
                Automated Compliance Pipeline
              </div>
              <h2 className="font-heading text-text text-[clamp(36px,4.8vw,58px)] font-bold tracking-[-0.04em] leading-[1.02] text-balance">
                Four steps.
                <br />
                <span className="text-blue">No consultants.</span>
              </h2>
            </div>
            <p className="text-[15px] leading-[1.65] text-text-muted max-w-[400px] flex-shrink-0 text-pretty">
              Upload raw certificates. Anviora validates against live EU &amp; India regulations, issues signed verifiable credentials, and generates instant QR codes for buyer verification.
            </p>
          </div>

          {/* 4-Step Grid Pipeline — 16px gap, crisp hairline border + multi-layer ambient shadow */}
          <div className="mx-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-none">
            
            {/* Card 01 - Upload */}
            <div className="bg-[#fafdfb] border border-emerald-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(5,98,239,0.03)] flex flex-col justify-between p-7 rounded-none">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 rounded-none">
                    01 / UPLOAD
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800/80 font-semibold uppercase tracking-wider">RAW DATA</span>
                </div>

                {/* Direct Graphic Component 01 (h-[210px]) */}
                <div className="h-[210px] w-full border border-dashed border-emerald-500/40 p-6 text-center bg-[#f2faf5] flex flex-col items-center justify-center space-y-3 mb-6 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <FileUp size={28} className="text-emerald-600 animate-pulse" />
                  <div>
                    <span className="text-emerald-950 font-bold block text-[13.5px]">📄 bis_cert_2026.pdf</span>
                    <span className="text-[11px] text-emerald-800/70 font-mono">1.2 MB • Ready to process</span>
                  </div>
                  <div className="w-full max-w-[260px] bg-emerald-200 h-1.5 overflow-hidden mt-1 rounded-none">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className="bg-emerald-600 h-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] mb-2">
                  Upload Batch Records
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  Drag and drop your BIS certificates, EPR registrations, and UN38.3 test reports. No custom spreadsheets required.
                </p>
              </div>
            </div>

            {/* Card 02 - Parse & Validate */}
            <div className="bg-[#fafdfb] border border-emerald-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(5,98,239,0.03)] flex flex-col justify-between p-7 rounded-none">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 rounded-none">
                    02 / PARSE &amp; VALIDATE
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-800 uppercase font-semibold border border-emerald-500/30 rounded-none">MAPPED</span>
                </div>

                {/* Direct Graphic Component 02 (h-[210px]) */}
                <div className="h-[210px] w-full bg-[#f2faf5] border border-emerald-500/30 p-5 font-mono text-xs flex flex-col justify-center space-y-2.5 mb-6 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center border-b border-emerald-900/10 pb-2">
                    <span className="text-emerald-800/70 text-[11.5px]">chemistry</span>
                    <span className="text-emerald-950 font-bold text-[12px]">LFP (Lithium Iron)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-900/10 pb-2">
                    <span className="text-emerald-800/70 text-[11.5px]">capacity</span>
                    <span className="text-emerald-950 font-bold text-[12px]">280 Ah</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-900/10 pb-2">
                    <span className="text-emerald-800/70 text-[11.5px]">carbon_class</span>
                    <span className="text-emerald-700 font-bold text-[12px]">Class A</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-emerald-800/70 text-[11.5px]">bis_status</span>
                    <span className="text-emerald-700 font-bold text-[12px] bg-emerald-100 px-2 py-0.5 border border-emerald-300">✔ VALID 2027</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] mb-2">
                  AI Validates &amp; Maps
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  Extracts 100+ raw data points from your certificates, checks validity, and maps them against live EU and India regulations.
                </p>
              </div>
            </div>

            {/* Card 03 - Secure & Anchor */}
            <div className="bg-[#fafdfb] border border-emerald-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(5,98,239,0.03)] flex flex-col justify-between p-7 rounded-none">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 rounded-none">
                    03 / SECURE &amp; ANCHOR
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800/80 font-semibold uppercase tracking-wider">IMMUTABLE</span>
                </div>

                {/* Direct Graphic Component 03 (h-[210px]) */}
                <div className="h-[210px] w-full bg-[#f2faf5] border border-emerald-500/30 p-5 font-mono text-xs flex flex-col justify-center gap-3.5 mb-6 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="bg-white border border-emerald-500/20 p-3 flex-1 rounded-none">
                      <div className="text-[9.5px] text-emerald-800/70 mb-0.5 uppercase tracking-wider font-semibold">DATA_HASH</div>
                      <div className="text-emerald-950 font-bold text-[11.5px] truncate">sha256:7c0a...</div>
                    </div>
                    <div className="text-emerald-600 font-bold text-lg flex-shrink-0">➔</div>
                    <div className="bg-white border border-emerald-500/20 p-3 flex-1 rounded-none">
                      <div className="text-[9.5px] text-emerald-800/70 mb-0.5 uppercase tracking-wider font-semibold">BTC_BLOCK</div>
                      <div className="text-emerald-700 font-bold text-[11.5px]">#842,190</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 font-semibold text-center rounded-none">
                    ✓ Timestamped via OpenTimestamps
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] mb-2">
                  Blockchain Anchored Proof
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  Every certificate hash is anchored to the Bitcoin blockchain via OpenTimestamps — providing free, permanent, and tamper-proof proof of origin.
                </p>
              </div>
            </div>

            {/* Card 04 - Identity Issued */}
            <div className="bg-[#fafdfb] border border-emerald-900/10 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(5,98,239,0.03)] flex flex-col justify-between p-7 rounded-none">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 rounded-none">
                    04 / IDENTITY ISSUED
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-800 font-semibold uppercase border border-emerald-500/30 rounded-none">W3C VC</span>
                </div>

                {/* Direct Graphic Component 04 (h-[210px]) */}
                <div className="h-[210px] w-full bg-[#f2faf5] border border-emerald-500/30 p-6 font-mono text-xs flex items-center justify-between mb-6 rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-emerald-800/70 uppercase tracking-wider font-semibold">ANVIORA PASSPORT</div>
                    <div className="text-emerald-950 font-bold text-[15px] tracking-wide">IN-LFP-2026-B4471</div>
                    <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-2 font-bold">
                      <CheckCircle2 size={13} />
                      Cryptographically Signed
                    </div>
                  </div>
                  <div className="bg-white border border-emerald-200 p-2 flex items-center justify-center shadow-xs rounded-none">
                    <MiniQR size={42} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] mb-2">
                  Signed Verifiable Credentials
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  Compiled as a W3C Verifiable Credential — cryptographically signed, secure, and ready to export as JSON or PDF.
                </p>
              </div>
            </div>

          </div>

          {/* 5th Card - Outcome / Destination Verification Hero (Green with Grainy Texture) */}
          <div className="mx-6 mt-4 bg-gradient-to-r from-[#045c43] via-[#059669] to-[#047857] p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_4px_24px_-2px_rgba(5,96,67,0.25)] rounded-none">
            
            {/* SVG Noise / Grainy Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay">
              <svg className="w-full h-full">
                <filter id="grainNoise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grainNoise)" />
              </svg>
            </div>

            {/* Radial Halftone Pattern Overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 0.8px, transparent 1.2px)",
                backgroundSize: "8px 8px"
              }}
            />

            {/* Content Left */}
            <div className="space-y-4 max-w-xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/40 text-emerald-100 text-xs font-mono font-medium rounded-none">
                <Zap size={13} className="text-emerald-200 fill-emerald-200" />
                THE VERIFICATION PAYOFF
              </div>
              <h3 className="font-heading text-white text-[clamp(28px,3.8vw,44px)] font-bold tracking-[-0.035em] leading-[1.06] text-balance">
                10-second scan verify at destination.
              </h3>
              <p className="text-emerald-100/90 text-[15px] leading-[1.65] text-pretty font-normal">
                Steps 01–04 compile the cryptographic credential. European buyers simply scan the QR code on the battery at destination to instantly view compliance details, carbon footprint, and blockchain proofs.
              </p>
            </div>

            {/* Right Side Destination Verification Preview Card (Crisp White & Glassmorphic) */}
            <div className="w-full md:w-[320px] bg-white/95 backdrop-blur-md p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/40 relative z-10 select-none rounded-none text-text">
              {/* Header badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="text-[12px] font-mono font-bold text-emerald-700 tracking-wide">PASSPORT VERIFIED</div>
                    <div className="text-[10px] font-mono text-slate-500">Live Cryptographic Audit</div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase rounded-none">
                  100% PASS
                </span>
              </div>

              {/* Passport Specs List */}
              <div className="space-y-2.5 font-mono text-[11.5px] border-b border-slate-100 pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Serial ID:</span>
                  <span className="text-slate-900 font-bold">IN-LFP-2026-B4471</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chemistry:</span>
                  <span className="text-slate-900 font-semibold">LFP (Lithium Iron)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Carbon Footprint:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">Class A (18 kg)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">BTC Timestamp:</span>
                  <span className="text-emerald-600 font-semibold">Block #842,190</span>
                </div>
              </div>

              {/* Live QR Verification Badge Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 font-mono">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Verified at EU Customs
                </div>
                <div className="p-1 bg-slate-50 border border-slate-200">
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
