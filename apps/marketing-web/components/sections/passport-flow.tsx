"use client";

import { motion } from "framer-motion";
import { FileUp, Link2, ShieldCheck, CheckCircle2, QrCode } from "lucide-react";

/* Decorative mini QR code for Step 4 visual */
function MiniQR({ size = 48 }: { size?: number }) {
  const s = size / 9;
  const cells = [
    [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2],
    [0, 6], [0, 7], [0, 8], [1, 6], [1, 8], [2, 6], [2, 7], [2, 8],
    [6, 0], [6, 1], [6, 2], [7, 0], [7, 2], [8, 0], [8, 1], [8, 2],
    [3, 4], [4, 1], [4, 3], [4, 5], [4, 7], [5, 2], [5, 4], [5, 6],
    [6, 4], [6, 6], [7, 5], [7, 7], [8, 4], [8, 6], [8, 8],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="text-white">
      {cells.map(([r, c], i) => (
        <rect
          key={i}
          x={c * s}
          y={r * s}
          width={s - 0.5}
          height={s - 0.5}
          rx={0.5}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

export default function PassportFlow() {
  return (
    <section id="how-it-works" className="">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header with index marker */}
        <div className="sticky top-14 z-20 bg-bg/95 backdrop-blur-sm border-b border-border px-6 py-4 flex justify-between items-center">
          <span className="section-index">HOW IT WORKS</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-blue font-semibold">1</span>/8]
          </span>
        </div>

        <div className="pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Header Title and Description */}
          <div className="px-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div className="max-w-[680px]">
              <h2 className="font-heading text-text text-[clamp(34px,4.6vw,56px)] font-medium tracking-[-0.04em] leading-[1.02] text-balance">
                Four steps. <span className="text-blue">No consultants.</span>
              </h2>
            </div>
            <p className="text-[15px] leading-[1.65] text-text-muted max-w-[380px] flex-shrink-0 text-pretty">
              Upload your certificates. Anviora validates against live EU and
              India regulations, issues a signed verifiable credential, and gives
              you a QR code your buyer scans in 10 seconds to confirm compliance.
            </p>
          </div>

          {/* Grid Layout of the steps */}
          <div className="mx-6 grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border overflow-hidden">
            
            {/* Step 1 */}
            <div className="bg-white flex flex-col">
              {/* Visual wrapper with radial dot grid */}
              <div 
                className="h-[240px] w-full bg-[#f4f8ff] flex items-center justify-center p-6 relative overflow-hidden"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}
              >
                {/* macOS Style Window Mockup */}
                <div className="bg-[#0b1015] border border-white/10 rounded-lg shadow-2xl w-[260px] overflow-hidden">
                  {/* Title bar */}
                  <div className="bg-[#13191f] px-3.5 py-2.5 flex items-center justify-between border-b border-[#1f2933]">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-[10px] font-mono text-text-dim">drop_zone.sh</span>
                    <div className="w-10" />
                  </div>
                  {/* Window Body */}
                  <div className="p-4 space-y-3 bg-[#0b1015]">
                    <div className="border border-dashed border-white/15 p-3 flex flex-col items-center justify-center text-center rounded">
                      <FileUp size={20} className="text-blue mb-2 animate-pulse" />
                      <span className="text-[11px] font-medium text-[#f5f9ff]">bis_cert_2026.pdf</span>
                      <span className="text-[9px] font-mono text-[#6b7480] mt-1">1.2 MB · 9.4 MB/s</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        className="bg-blue h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Text content wrapper */}
              <div className="p-8 flex-1 flex flex-col justify-between border-t border-border">
                <div>
                  <div className="text-[11px] font-mono font-medium tracking-[0.14em] text-blue uppercase mb-3">
                    01 / UPLOAD
                  </div>
                  <h3 className="font-heading text-text text-[20px] font-medium tracking-[-0.03em] mb-2 leading-tight">
                    Upload batch records.
                  </h3>
                  <p className="text-[14.5px] leading-[1.6] text-text-muted text-pretty">
                    Drag and drop your BIS certificates, EPR registrations, and UN38.3 test reports. No custom spreadsheets or formatting required.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white flex flex-col">
              {/* Visual wrapper with radial dot grid */}
              <div 
                className="h-[240px] w-full bg-[#f4f8ff] flex items-center justify-center p-6 relative overflow-hidden"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}
              >
                {/* AI Mapper View */}
                <div className="bg-white border border-border shadow-2xl rounded-lg w-[260px] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue" />
                      <span className="text-[11px] font-heading font-medium text-text">AI Parser Output</span>
                    </div>
                    <span className="text-[10px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">mapped</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10.5px]">
                    <div className="flex justify-between items-center py-1 border-b border-border-light">
                      <span className="text-text-dim">chemistry</span>
                      <span className="text-text font-medium">LFP (Lithium Iron)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f0f4f8]">
                      <span className="text-text-dim">capacity</span>
                      <span className="text-text font-medium">280 Ah</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#f0f4f8]">
                      <span className="text-text-dim">carbon_class</span>
                      <span className="text-blue font-bold">Class A</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-text-dim">bis_status</span>
                      <span className="text-green-600 font-semibold">✓ VALID 2027</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Text content wrapper */}
              <div className="p-8 flex-1 flex flex-col justify-between border-t border-border">
                <div>
                  <div className="text-[11px] font-mono font-medium tracking-[0.14em] text-blue uppercase mb-3">
                    02 / PARSE & VALIDATE
                  </div>
                  <h3 className="font-heading text-text text-[20px] font-medium tracking-[-0.03em] mb-2 leading-tight">
                    AI validates & maps.
                  </h3>
                  <p className="text-[14.5px] leading-[1.6] text-text-muted text-pretty">
                    Our platform automatically extracts 100+ raw data points from your certificates, checks validity, and maps them against live EU and India regulations.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white flex flex-col">
              {/* Visual wrapper with radial dot grid */}
              <div 
                className="h-[240px] w-full bg-[#f4f8ff] flex items-center justify-center p-6 relative overflow-hidden"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}
              >
                {/* Cryptographic anchoring visual */}
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center p-3 bg-white border border-border shadow-md rounded relative">
                      <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t border-l border-blue" />
                      <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">data_hash</span>
                      <span className="text-[11px] font-mono font-semibold text-text mt-1">sha256:7c9e</span>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue text-white shadow-md">
                      <Link2 size={16} />
                    </div>
                    <div className="flex flex-col items-center p-3 bg-white border border-border shadow-md rounded relative">
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t border-r border-amber-500" />
                      <span className="text-[9px] font-mono text-amber-600 uppercase tracking-wider">btc_block</span>
                      <span className="text-[11px] font-mono font-semibold text-text mt-1">#842,190</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-blue bg-blue-tint border border-blue/20 px-2 py-0.5 rounded font-semibold mt-1">
                    ✓ Timestamped via OpenTimestamps
                  </div>
                </div>
              </div>
              {/* Text content wrapper */}
              <div className="p-8 flex-1 flex flex-col justify-between border-t border-border">
                <div>
                  <div className="text-[11px] font-mono font-medium tracking-[0.14em] text-blue uppercase mb-3">
                    03 / SECURE & ANCHOR
                  </div>
                  <h3 className="font-heading text-text text-[20px] font-medium tracking-[-0.03em] mb-2 leading-tight">
                    Blockchain anchored proof.
                  </h3>
                  <p className="text-[14.5px] leading-[1.6] text-text-muted text-pretty">
                    Every certificate hash is anchored to the Bitcoin blockchain via OpenTimestamps — providing free, permanent, and tamper-proof proof of origin.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white flex flex-col">
              {/* Visual wrapper with radial dot grid */}
              <div 
                className="h-[240px] w-full bg-[#f4f8ff] flex items-center justify-center p-6 relative overflow-hidden"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(5, 98, 239, 0.08) 1px, transparent 1px)",
                  backgroundSize: "16px 16px"
                }}
              >
                {/* W3C Verifiable Credential Mockup */}
                <div className="bg-[#0b1015] text-white border border-white/10 rounded-lg p-4 w-[260px] space-y-3 relative overflow-hidden shadow-2xl">
                  {/* Subtle noise/gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue/10 to-transparent pointer-events-none" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="text-[8px] font-mono tracking-widest text-text-dim uppercase">ANVIORA PASSPORT</div>
                      <div className="text-[13px] font-mono font-semibold mt-1 text-blue-light">IN-LFP-2024-B4471</div>
                    </div>
                    <span className="text-[9px] text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">W3C VC</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 relative z-10">
                    <div className="text-[9px] font-mono text-white/50 space-y-0.5">
                      <div>did:key:z6Mk...9fQ2</div>
                      <div className="text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={10} /> Cryptographically Signed
                      </div>
                    </div>
                    <div className="bg-white/5 p-1 rounded border border-white/10">
                      <MiniQR size={32} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Text content wrapper */}
              <div className="p-8 flex-1 flex flex-col justify-between border-t border-border">
                <div>
                  <div className="text-[11px] font-mono font-medium tracking-[0.14em] text-blue uppercase mb-3">
                    04 / IDENTITY ISSUED
                  </div>
                  <h3 className="font-heading text-text text-[20px] font-medium tracking-[-0.03em] mb-2 leading-tight">
                    Signed Verifiable Credentials.
                  </h3>
                  <p className="text-[14.5px] leading-[1.6] text-text-muted text-pretty">
                    Your digital passport is compiled as a W3C Verifiable Credential — cryptographically signed, secure, and ready to export as JSON or PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 - Full Width Payoff Block */}
          <div className="mx-6 mt-px bg-gradient-to-br from-[#0562ef] to-[#0015ff] text-white p-8 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 border-x border-b border-border">
            {/* Halftone grid overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 1px)",
                backgroundSize: "4px 4px",
                mixBlendMode: "overlay",
              }}
            />
            
            {/* Left Content */}
            <div className="relative z-10 max-w-[540px]">
              <div className="text-[11px] font-mono font-medium tracking-[0.14em] text-white/77 uppercase mb-3">
                05 / INSTANT VERIFICATION
              </div>
              <h3 className="font-heading text-white text-[clamp(26px,3.5vw,42px)] font-medium tracking-[-0.035em] leading-[1.05] mb-4 text-balance">
                10-second scan verify at destination.
              </h3>
              <p className="text-[15.5px] leading-[1.6] text-white/80 text-pretty">
                Steps 01–04 compile the credential. This is the payoff: European buyers simply scan the QR code on the battery at destination to instantly view compliance details, carbon footprint, and blockchain proofs.
              </p>
            </div>

            {/* Right Phone Mockup */}
            <div className="relative z-10 shrink-0 select-none">
              {/* Outer phone frame */}
              <div className="w-[230px] h-[350px] bg-[#0b1015] rounded-[36px] border-[6px] border-[#1e293b] relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(5,98,239,0.3)] flex flex-col justify-between p-4">
                
                {/* Phone Notch/Speaker bar */}
                <div className="w-20 h-4 bg-[#1e293b] rounded-full mx-auto -mt-2 flex items-center justify-center">
                  <div className="w-10 h-1 bg-[#0b1015] rounded-full" />
                </div>

                {/* Scanned result dashboard inside phone */}
                <div className="flex-1 flex flex-col items-center justify-center text-center my-4 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">PASSPORT VERIFIED</div>
                    <div className="text-[9px] text-[#888e94] mt-0.5">Active & Cryptographically Secure</div>
                  </div>
                  
                  {/* Mini info list */}
                  <div className="w-full bg-white/5 rounded border border-white/10 p-2 text-left font-mono text-[9px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#888e94]">Serial:</span>
                      <span className="text-white font-medium">IN-LFP-280A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888e94]">Carbon:</span>
                      <span className="text-green-400 font-medium">Class A</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1 mt-1 text-[8.5px]">
                      <span className="text-[#888e94]">EU Conformity:</span>
                      <span className="text-blue-light font-semibold">100% PASS</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Home Indicator Line */}
                <div className="w-16 h-1 bg-white/30 rounded-full mx-auto -mb-1" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
