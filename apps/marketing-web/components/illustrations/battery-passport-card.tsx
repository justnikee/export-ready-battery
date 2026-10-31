"use client";

/**
 * BatteryPassportCard
 * ────────────────────
 * Animated passport card that reveals field-by-field, then shows
 * a QR-scan animation and a "Verified ✓" badge. Loops gently.
 *
 * Used in the /battery page hero as the right-side visual.
 */

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ShieldCheck, QrCode } from "lucide-react";

/* ── Passport field data ──────────────────────────────────── */
const FIELDS = [
  { label: "Battery ID", value: "LFP-B4471", color: "#0f0f0f" },
  { label: "Chemistry", value: "LFP (Lithium Iron Phosphate)", color: "#0f0f0f" },
  { label: "Rated Capacity", value: "280 Ah · 3.2 V nominal", color: "#0f0f0f" },
  { label: "Carbon Footprint", value: "Class B — 84 kg CO₂e/kWh", color: "#157a5b" },
  { label: "BIS Certificate", value: "IS 16046 · Valid to Mar 2027", color: "#157a5b" },
  { label: "UN38.3", value: "Passed · Cert #UN-2024-88421", color: "#157a5b" },
  { label: "Recycled Content", value: "Cobalt 12% · Lithium 4%", color: "#0f0f0f" },
  { label: "BPAN Serial", value: "IN-LFP-2024-B4471", color: "#1d4ed8" },
];

/* ── Mini QR pattern (purely decorative SVG) ─────────────── */
function QRPattern({ size = 72 }: { size?: number }) {
  const s = size / 9;
  const cells = [
    // top-left finder
    [0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2],
    // top-right finder
    [0,6],[0,7],[0,8],[1,6],[1,8],[2,6],[2,7],[2,8],
    // bottom-left finder
    [6,0],[6,1],[6,2],[7,0],[7,2],[8,0],[8,1],[8,2],
    // data scatter
    [3,3],[3,5],[4,0],[4,2],[4,4],[4,6],[4,8],
    [5,1],[5,3],[5,5],[5,7],[6,4],[6,6],[7,5],[7,7],[8,4],[8,6],[8,8],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {cells.map(([r, c], i) => (
        <rect
          key={i}
          x={c * s}
          y={r * s}
          width={s - 1}
          height={s - 1}
          rx={1}
          fill="#0f0f0f"
        />
      ))}
    </svg>
  );
}

/* ── Animated field row (fixed layout height, smooth opacity transition) ── */
function FieldRow({
  label,
  value,
  color,
  show,
}: {
  label: string;
  value: string;
  color: string;
  show: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: show ? 1 : 0.12, y: show ? 0 : 3 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-0.5 min-h-[34px]"
    >
      <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </span>
      <span className="text-[12.5px] font-semibold leading-snug truncate" style={{ color }}>
        {value}
      </span>
    </motion.div>
  );
}

/* ── Root component ───────────────────────────────────────── */
export default function BatteryPassportCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });

  // Phase 0: idle, Phase 1: fields revealing, Phase 2: QR scan, Phase 3: verified
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!inView) {
      setPhase(0);
      setVisibleCount(0);
      return;
    }

    const startTimer = setTimeout(() => setPhase(1), 300);
    return () => clearTimeout(startTimer);
  }, [inView]);

  // Phase 1: reveal fields sequentially
  useEffect(() => {
    if (phase !== 1) return;
    if (visibleCount >= FIELDS.length) {
      const t = setTimeout(() => setPhase(2), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setVisibleCount((n) => n + 1),
      visibleCount === 0 ? 80 : 200,
    );
    return () => clearTimeout(t);
  }, [phase, visibleCount]);

  // Phase 2: QR scan → Phase 3: verified
  useEffect(() => {
    if (phase !== 2) return;
    const t = setTimeout(() => setPhase(3), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 3: hold, then loop
  useEffect(() => {
    if (phase !== 3) return;
    const t = setTimeout(() => {
      setPhase(0);
      setVisibleCount(0);
      setTimeout(() => setPhase(1), 400);
    }, 3500);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div ref={ref} className="relative flex items-center justify-center p-2">
      {/* Card: Fixed height and width to prevent any jumping */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[400px] h-[550px] flex flex-col justify-between rounded-none border border-border bg-white overflow-hidden shadow-2xl shadow-slate-900/10"
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-none bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect width="14" height="14" fill="#059669" opacity="0.15" />
                <path d="M3 7h8M7 3v8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-heading text-[13px] font-bold text-slate-950">Battery Passport</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-none uppercase tracking-wider">
            Live
          </span>
        </div>

        {/* Body: Grid of 8 fields with fixed layout heights */}
        <div className="px-5 py-4 grid grid-cols-1 gap-2.5 flex-1 overflow-hidden">
          {FIELDS.map((f, i) => (
            <FieldRow
              key={f.label}
              {...f}
              show={phase >= 1 && visibleCount > i}
            />
          ))}
        </div>

        {/* QR + verification panel */}
        <div className="px-5 pb-5 shrink-0">
          <div className="rounded-none border border-border bg-slate-50 p-3.5 flex items-center gap-4 overflow-hidden relative">
            {/* QR code */}
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: phase >= 1 ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
              className="shrink-0"
            >
              <QRPattern size={64} />
            </motion.div>

            {/* Scan animation overlay */}
            <AnimatePresence>
              {phase === 2 && (
                <motion.div
                  className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-[64px] h-0.5 bg-emerald-500 shadow-xs"
                    animate={{ y: [-24, 24, -24] }}
                    transition={{ duration: 1.2, repeat: 1, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info panel */}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Scan to verify</p>
              <p className="font-mono text-[12px] font-bold text-slate-950 truncate">
                IN-LFP-2024-B4471
              </p>
              <p className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                OpenTimestamps · Block 842,190
              </p>

              {/* Verified badge — fixed layout slot so text never jumps */}
              <div className="h-[22px] mt-1.5 flex items-center">
                <motion.div
                  animate={{
                    opacity: phase === 3 ? 1 : 0,
                    scale: phase === 3 ? 1 : 0.85,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-none bg-emerald-500/15 border border-emerald-500/40"
                >
                  <ShieldCheck size={13} className="text-emerald-700" />
                  <span className="font-mono text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">
                    EU Verified
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge: W3C VC */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-1 -right-2 sm:-right-4 flex items-center gap-2 h-8 px-3 rounded-none bg-white border border-border shadow-md z-10"
      >
        <ShieldCheck size={14} className="text-emerald-700" />
        <span className="font-mono text-[11px] font-bold text-slate-900">W3C Credential</span>
      </motion.div>

      {/* Floating badge: public scan */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-1 -left-2 sm:-left-4 flex items-center gap-2 h-8 px-3 rounded-none bg-white border border-border shadow-md z-10"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6.5" stroke="#d97706" strokeWidth="1.2" />
          <path d="M5 4.5h3.5c.8 0 1.2.6 1.2 1.2s-.5 1-.8 1.1c.5.1 1 .5 1 1.3 0 .9-.6 1.4-1.5 1.4H5V4.5z" fill="#d97706" />
        </svg>
        <span className="font-mono text-[11px] font-bold text-amber-900">Public scan page</span>
      </motion.div>
    </div>
  );
}
