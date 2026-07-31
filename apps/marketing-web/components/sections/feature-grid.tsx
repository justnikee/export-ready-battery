"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, QrCode, FileText, Anchor, Activity, Zap } from "lucide-react";

function DetailedQRCode({ size = 52 }: { size?: number }) {
  const fill = "#045c43";
  return (
    <svg width={size} height={size} viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect width="29" height="29" fill="white" />
      <rect x="1" y="1" width="7" height="7" fill={fill} />
      <rect x="2" y="2" width="5" height="5" fill="white" />
      <rect x="3" y="3" width="3" height="3" fill={fill} />
      
      <rect x="21" y="1" width="7" height="7" fill={fill} />
      <rect x="22" y="2" width="5" height="5" fill="white" />
      <rect x="23" y="3" width="3" height="3" fill={fill} />
      
      <rect x="1" y="21" width="7" height="7" fill={fill} />
      <rect x="2" y="22" width="5" height="5" fill="white" />
      <rect x="3" y="23" width="3" height="3" fill={fill} />

      <rect x="20" y="20" width="5" height="5" fill={fill} />
      <rect x="21" y="21" width="3" height="3" fill="white" />
      <rect x="22" y="22" width="1" height="1" fill={fill} />

      <rect x="8" y="3" width="1" height="1" fill={fill} />
      <rect x="10" y="3" width="1" height="1" fill={fill} />
      <rect x="12" y="3" width="1" height="1" fill={fill} />
      <rect x="14" y="3" width="1" height="1" fill={fill} />
      <rect x="16" y="3" width="1" height="1" fill={fill} />
      <rect x="18" y="3" width="1" height="1" fill={fill} />

      {[
        [9, 1], [11, 1], [13, 1], [15, 1], [17, 1], [19, 1],
        [9, 5], [10, 5], [12, 5], [14, 5], [17, 5], [18, 5],
        [1, 9], [2, 9], [4, 9], [6, 9], [7, 9], [9, 9], [11, 9], [13, 9], [15, 9], [17, 9], [19, 9], [21, 9], [23, 9], [25, 9], [27, 9],
        [1, 11], [3, 11], [5, 11], [8, 11], [10, 11], [12, 11], [14, 11], [16, 11], [18, 11], [20, 11], [22, 11], [24, 11], [26, 11], [27, 11],
        [2, 13], [4, 13], [6, 13], [9, 13], [11, 13], [13, 13], [15, 13], [17, 13], [19, 13], [21, 13], [23, 13], [25, 13], [27, 13],
        [1, 15], [3, 15], [5, 15], [7, 15], [10, 15], [12, 15], [14, 15], [16, 15], [18, 15], [20, 15], [22, 15], [24, 15], [26, 15],
        [2, 17], [4, 17], [6, 17], [8, 17], [9, 17], [11, 17], [13, 17], [15, 17], [17, 17], [19, 17], [21, 17], [23, 17], [25, 17], [27, 17],
        [1, 19], [3, 19], [5, 19], [7, 19], [10, 19], [12, 19], [14, 19], [16, 19], [18, 19], [20, 19], [22, 19], [24, 19], [26, 19],
        [9, 21], [11, 21], [13, 21], [15, 21], [17, 21], [18, 21], [26, 21], [27, 21],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill={fill} />
      ))}
      
      <rect x="11" y="11" width="7" height="7" fill="white" />
      <rect x="12" y="12" width="5" height="5" fill={fill} />
      <path d="M14.5 13L13 16H14L14.5 14.8L15 16H16L14.5 13Z" fill="white" />
    </svg>
  );
}

interface CapabilityItem {
  id: number;
  stepNumber: string;
  title: string;
  shortDesc: string;
  detailPara1: string;
  href: string;
  cardTitle: string;
  cardContent: React.ReactNode;
}

const STEP_DURATION_MS = 6000;

export default function FeatureGrid() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0, active: false });

  // Auto-advance loop timer
  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const startProgress = progress;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, startProgress + (elapsed / STEP_DURATION_MS) * 100);

      if (newProgress >= 100) {
        setProgress(0);
        setActiveIdx((prev) => (prev + 1) % CAPABILITIES.length);
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activeIdx, isPaused]);

  const handleSelectStep = (idx: number) => {
    setActiveIdx(idx);
    setProgress(0);
  };

  const CAPABILITIES: CapabilityItem[] = [
    {
      id: 0,
      stepNumber: "01",
      title: "AI Mapping",
      shortDesc: "Turn messy supplier data into structured DPP fields.",
      detailPara1: "Drop in BIS, EPR, UN38.3, or IEC 62133 PDFs. Anviora automatically parses material composition, cell chemistry, and safety certificates with 100+ auto-mapped fields.",
      href: "#how-it-works",
      cardTitle: "AI PARSING & MAPPER",
      cardContent: (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider font-semibold">Input File</span>
            <span className="font-mono text-[11.5px] font-semibold text-emerald-800">UN38.3_LFP-B4471.pdf</span>
          </div>

          <div className="p-3 bg-emerald-50/80 border border-emerald-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-emerald-700 animate-pulse" />
              <span className="font-sans text-[12.5px] text-text font-medium">Auto-Parsing Engine</span>
            </div>
            <span className="font-mono text-[11.5px] font-bold text-emerald-900">112 Fields Extracted</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[10.5px]">
              <span className="text-text-dim font-medium">Mapping Accuracy</span>
              <span className="text-emerald-800 font-bold">100% Verified</span>
            </div>
            <div className="h-1.5 bg-border/60 w-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-500 w-[100%]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: "Chemistry", val: "LFP" },
              { label: "Voltage", val: "3.2 V" },
              { label: "Capacity", val: "280 Ah" },
              { label: "Safety", val: "UN38.3 Pass" },
            ].map((f) => (
              <div key={f.label} className="p-2.5 bg-bg-alt/60 border border-border/70">
                <div className="font-mono text-[9.5px] uppercase text-text-dim tracking-wider font-medium">{f.label}</div>
                <div className="font-mono text-[11.5px] font-bold text-text pt-0.5">{f.val}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 1,
      stepNumber: "02",
      title: "Automated Validation",
      shortDesc: "Catch missing regulatory information before publishing.",
      detailPara1: "Real-time compliance engine validates against EU Battery Regulation 2023/1542 and India EPR rules, calculating carbon classes and flagging missing certificates instantly.",
      href: "#how-it-works",
      cardTitle: "COMPLIANCE ENGINE",
      cardContent: (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider font-semibold">Ruleset Status</span>
            <span className="font-mono text-[11.5px] font-semibold text-emerald-800">EU 2023/1542</span>
          </div>

          <div className="space-y-2">
            {[
              { label: "EU Mandate", status: "100% Compliant" },
              { label: "Carbon Class", status: "Class A (12.4 kg)" },
              { label: "UN38.3 Test", status: "Pass (#94821)" },
              { label: "EPR Renewal", status: "Active (312 days)" },
            ].map((rule) => (
              <div key={rule.label} className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span className="font-sans text-[12px] text-text font-medium">{rule.label}</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-900">{rule.status}</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 flex items-center justify-between">
            <span className="font-mono text-[10.5px] text-emerald-950 font-bold uppercase tracking-wider">Validation Status</span>
            <span className="font-mono text-[11.5px] font-bold text-emerald-800">READY TO PUBLISH</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      stepNumber: "03",
      title: "Export Readiness",
      shortDesc: "Understand exactly what's blocking a shipment.",
      detailPara1: "Never get stuck at European customs. Export Readiness score verifies all required declarations and certificates before your containers ship.",
      href: "#how-it-works",
      cardTitle: "CUSTOMS GATE",
      cardContent: (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider font-semibold">Entry Gateway</span>
            <span className="font-mono text-[11.5px] font-semibold text-emerald-800">Rotterdam / Antwerp</span>
          </div>

          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] text-text-dim font-medium">Customs Clearance</span>
              <span className="font-mono text-[11.5px] font-bold text-emerald-900">100% READY</span>
            </div>
            <div className="h-1.5 bg-border/60 w-full overflow-hidden">
              <div className="h-full bg-emerald-600 transition-all duration-500 w-[100%]" />
            </div>
            <div className="flex justify-between font-mono text-[9.5px] text-text-muted pt-0.5">
              <span>0 Blockers</span>
              <span>Audit Log Verified</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-bg-alt/60 border border-border/70">
              <div className="font-mono text-[9.5px] text-text-dim uppercase tracking-wider font-medium">Declarations</div>
              <div className="font-mono text-[11.5px] font-bold text-emerald-800 flex items-center gap-1 pt-0.5">
                <Anchor size={12} /> Verified
              </div>
            </div>
            <div className="p-2.5 bg-bg-alt/60 border border-border/70">
              <div className="font-mono text-[9.5px] text-text-dim uppercase tracking-wider font-medium">Port Risk</div>
              <div className="font-mono text-[11.5px] font-bold text-emerald-800 flex items-center gap-1 pt-0.5">
                <Activity size={12} /> Zero Risk
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      stepNumber: "04",
      title: "QR Passports",
      shortDesc: "Give buyers verified product information instantly.",
      detailPara1: "Generates W3C signed Verifiable Credentials and tamper-proof QR codes. European buyers and regulators scan to inspect live passport data without log-ins.",
      href: "#how-it-works",
      cardTitle: "VERIFIABLE PASSPORT",
      cardContent: (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider font-semibold">Serial Number</span>
            <span className="font-mono text-[11.5px] font-bold text-emerald-900">IN-LFP-24-B4471</span>
          </div>

          <div className="p-3.5 bg-white text-slate-900 flex items-center gap-3.5 border border-emerald-200/90 shadow-sm">
            <DetailedQRCode size={52} />
            <div className="space-y-0.5">
              <div className="font-mono text-[11.5px] font-bold text-emerald-950">PASSPORT VERIFIED</div>
              <div className="font-sans text-[11px] text-slate-600">W3C Credential Signed</div>
              <div className="font-mono text-[9.5px] text-emerald-700 font-semibold">Bitcoin Block #842,190</div>
            </div>
          </div>

          <div className="p-2.5 bg-bg-alt/60 border border-border/70 space-y-1 font-mono text-[10.5px]">
            <div className="flex justify-between">
              <span className="text-text-dim">Proof Hash</span>
              <span className="text-text font-semibold">sha256 · a91f…c4e2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Verification</span>
              <span className="text-emerald-800 font-bold">Public Mobile Scan</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentCap = CAPABILITIES[activeIdx];

  return (
    <section className="bg-bg antialiased">
      <div className="max-w-[1232px] mx-auto">
        {/* Content Area */}
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Header Block: Centered Pill, Headline & Subheading */}
          <div className="text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Zap size={13} className="text-emerald-600 fill-emerald-600" />
              CAPABILITIES
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-bold tracking-[-0.035em] leading-[1.06] text-balance">
              Anviora does more than
              <br />
              <span className="text-emerald-600">generate passports.</span>
            </h2>

            <p className="text-[14px] leading-[22px] text-text-muted text-pretty max-w-[640px] mx-auto">
              Automate compliance tracking, carbon calculations, and permissioned buyer verification in a single platform.
            </p>
          </div>

          {/* Interactive Layout — Seamless Contiguous Container (No Center Gap, Stacked Left Cards) */}
          <div
            className="flex flex-col lg:flex-row gap-0 items-stretch border border-border/80"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Left Column: 40% width stacked step list with hairline dividers */}
            <div className="lg:w-[40%] shrink-0 flex flex-col divide-y divide-border/80 lg:border-r border-border/80 font-sans">
              {CAPABILITIES.map((item, idx) => {
                const isActive = activeIdx === idx;

                return (
                  <div
                    key={item.stepNumber}
                    onClick={() => handleSelectStep(idx)}
                    className={`relative p-6 cursor-pointer flex-1 flex flex-col justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#f2faf5]"
                        : "bg-white hover:bg-[#f2faf5]/50 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Animated Progress Bar on Active Step — Thin 2.5px line running along left border */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-emerald-100/80 overflow-hidden z-10">
                        <div
                          className="w-full bg-emerald-600 transition-all duration-100 shadow-[0_0_6px_rgba(5,150,105,0.8)]"
                          style={{ height: `${progress}%` }}
                        />
                      </div>
                    )}

                    <div className="mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 uppercase tracking-[0.15em]">
                        STEP {item.stepNumber}
                      </span>
                    </div>

                    <h3
                      className={`font-sans text-[18px] sm:text-[20px] font-semibold tracking-[-0.025em] leading-snug mb-1.5 transition-colors ${
                        isActive ? "text-text font-bold" : "text-text-muted/80 font-medium"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p className={`text-[14px] leading-[22px] font-sans transition-colors ${isActive ? "text-text-muted font-normal" : "text-text-dim font-normal"}`}>
                      {item.shortDesc}
                    </p>

                    {isActive && (
                      <p className="text-[13px] leading-[20px] text-emerald-800 font-sans mt-2 font-medium">
                        {item.detailPara1}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: 60% width white canvas */}
            <div
              className="lg:w-[60%] grow flex flex-col items-center justify-center relative group/canvas min-h-[460px]"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCanvasMousePos({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  active: true,
                });
              }}
              onMouseLeave={() => setCanvasMousePos((p) => ({ ...p, active: false }))}
            >
              {/* White Canvas Background Container */}
              <div className="w-full h-full bg-[#fafdfb] p-6 sm:p-10 relative overflow-hidden flex items-center justify-center">
                {/* Clean, Pleasing Background Accent: Subtle Dot Grid & Soft Emerald Glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.25]"
                    style={{
                      backgroundImage: "radial-gradient(circle, #045c43 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.06),transparent_70%)]" />
                </div>

                {/* Hover Spotlight Layer: Smooth Emerald Radial Cursor Spotlight */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300 overflow-hidden"
                  style={{
                    opacity: canvasMousePos.active ? 1 : 0,
                    background: canvasMousePos.active
                      ? `radial-gradient(300px circle at ${canvasMousePos.x}px ${canvasMousePos.y}px, rgba(16, 185, 129, 0.12), transparent 70%)`
                      : undefined,
                  }}
                />

                {/* Central Floating Card */}
                <div className="relative z-10 max-w-[400px] w-full bg-white border border-emerald-950/15 p-6 shadow-xl rounded-none group-hover/canvas:border-emerald-500/60 transition-all duration-300">
                  {/* Card Top Title Bar */}
                  <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="font-mono text-[11px] font-bold text-emerald-950 uppercase tracking-[0.12em]">
                        {currentCap.cardTitle}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-700">
                      [{currentCap.stepNumber}/04]
                    </span>
                  </div>

                  {/* Card Content with Motion Transition */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCap.id}
                      initial={{ opacity: 0, scale: 0.96, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -6 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      {currentCap.cardContent}
                    </motion.div>
                  </AnimatePresence>

                  {/* Card Footer Status */}
                  <div className="pt-4 mt-4 border-t border-border/80 flex items-center justify-between text-text-dim font-mono text-[10.5px]">
                    <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      LIVE PREVIEW
                    </span>
                    <span className="text-text-dim font-medium">HOVER CANVAS TO GLOW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
