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

/* ── Animated field row ───────────────────────────────────── */
function FieldRow({
  label,
  value,
  color,
  delay,
  show,
}: {
  label: string;
  value: string;
  color: string;
  delay: number;
  show: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-0.5"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
            {label}
          </span>
          <span className="text-[13px] font-medium leading-snug" style={{ color }}>
            {value}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
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

    // Start Phase 1 after a brief pause
    const startTimer = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(startTimer);
  }, [inView]);

  // Phase 1: reveal fields one by one
  useEffect(() => {
    if (phase !== 1) return;
    if (visibleCount >= FIELDS.length) {
      // All fields shown → move to QR scan phase
      const t = setTimeout(() => setPhase(2), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setVisibleCount((n) => n + 1),
      visibleCount === 0 ? 100 : 280,
    );
    return () => clearTimeout(t);
  }, [phase, visibleCount]);

  // Phase 2: QR scan → Phase 3: verified
  useEffect(() => {
    if (phase !== 2) return;
    const t = setTimeout(() => setPhase(3), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 3: hold, then loop
  useEffect(() => {
    if (phase !== 3) return;
    const t = setTimeout(() => {
      setPhase(0);
      setVisibleCount(0);
      // brief gap before restart
      setTimeout(() => setPhase(1), 500);
    }, 3500);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[380px] rounded-[24px] border border-[#e5e7eb] bg-white overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6] bg-[#f9fafb]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#e8f4ee] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect width="14" height="14" rx="3" fill="#157a5b" opacity="0.15" />
                <path d="M3 7h8M7 3v8" stroke="#157a5b" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[12px] font-semibold text-[#0f0f0f]">Battery Passport</span>
          </div>
          <span className="inline-flex items-center h-5 px-2 rounded-full bg-[#dcfce7] text-[10px] font-semibold text-[#16a34a] uppercase tracking-wide">
            Live
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-4 grid gap-3 min-h-[280px]">
          {FIELDS.map((f, i) => (
            <FieldRow
              key={f.label}
              {...f}
              delay={0}
              show={phase >= 1 && visibleCount > i}
            />
          ))}
        </div>

        {/* QR + verification panel */}
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 flex items-center gap-4 overflow-hidden relative">
            {/* QR code */}
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: phase >= 1 ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
              className="shrink-0"
            >
              <QRPattern size={72} />
            </motion.div>

            {/* Scan animation overlay */}
            <AnimatePresence>
              {phase === 2 && (
                <motion.div
                  className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-[72px] h-0.5 bg-crew-coral/70"
                    animate={{ y: [-28, 28, -28] }}
                    transition={{ duration: 1.4, repeat: 1, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info panel */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#9ca3af] mb-1">Scan to verify</p>
              <p className="font-mono text-[12px] font-semibold text-[#0f0f0f] truncate">
                IN-LFP-2024-B4471
              </p>
              <p className="text-[11px] text-[#9ca3af] mt-1">
                OpenTimestamps · Bitcoin block 842,190
              </p>

              {/* Verified badge */}
              <AnimatePresence>
                {phase === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="mt-2 inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-[#dcfce7] border border-[#86efac]"
                  >
                    <ShieldCheck size={12} className="text-[#16a34a]" />
                    <span className="text-[11px] font-bold text-[#15803d] uppercase tracking-wide">
                      EU Verified
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge: W3C VC */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-3 -right-3 sm:-right-6 flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-[#e5e7eb] shadow-sm"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
      >
        <ShieldCheck size={14} className="text-[#1d4ed8]" />
        <span className="text-[11px] font-semibold text-[#1e40af]">W3C Verifiable Credential</span>
      </motion.div>

      {/* Floating badge: Bitcoin anchored */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-3 -left-3 sm:-left-6 flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-[#e5e7eb] shadow-sm"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6.5" stroke="#f59e0b" />
          <path d="M5 4.5h3.5c.8 0 1.2.6 1.2 1.2s-.5 1-.8 1.1c.5.1 1 .5 1 1.3 0 .9-.6 1.4-1.5 1.4H5V4.5z" fill="#f59e0b" />
        </svg>
        <span className="text-[11px] font-semibold text-[#92400e]">Bitcoin timestamped</span>
      </motion.div>
    </div>
  );
}
