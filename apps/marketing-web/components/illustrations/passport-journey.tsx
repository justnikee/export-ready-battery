"use client";

/**
 * PassportJourney
 * ───────────────
 * Animated 4-station flow showing the full product journey:
 *   Factory (India) → Anviora Platform → Passport Issued → EU Cleared
 *
 * Uses framer-motion for:
 *   • Staggered station reveal on scroll entry
 *   • Traveling "data packet" dots along the connecting path
 *   • Station icon pulse when a packet arrives
 */

import { motion, useInView, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Factory,
  ScanLine,
  QrCode,
  ShieldCheck,
} from "lucide-react";

/* ── Station data ─────────────────────────────────────────── */
const STATIONS = [
  {
    id: "upload",
    Icon: Factory,
    iconBg: "#e8f4ee",
    iconColor: "#157a5b",
    tag: "India",
    tagBg: "#fff7ed",
    tagColor: "#c2410c",
    title: "Upload batch records",
    items: ["BIS IS 16046", "UN38.3 test cert", "EPR registration"],
    delay: 0,
  },
  {
    id: "validate",
    Icon: ScanLine,
    iconBg: "#e8f4ee",
    iconColor: "#0f5a43",
    tag: "Anviora",
    tagBg: "#e8f4ee",
    tagColor: "#157a5b",
    title: "AI validates & maps",
    items: ["100+ fields parsed", "EU 2023/1542 check", "Carbon class B calc"],
    delay: 0.15,
  },
  {
    id: "issue",
    Icon: QrCode,
    iconBg: "#eff6ff",
    iconColor: "#1d4ed8",
    tag: "Passport",
    tagBg: "#eff6ff",
    tagColor: "#1d4ed8",
    title: "Identity issued",
    items: ["BPAN V2 serial", "W3C Verifiable VC", "QR code + PDF export"],
    delay: 0.3,
  },
  {
    id: "cleared",
    Icon: ShieldCheck,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    tag: "EU cleared ✓",
    tagBg: "#dcfce7",
    tagColor: "#15803d",
    title: "Ship with confidence",
    items: ["10-second scan verify", "Blockchain anchored", "Buyer confirms ready"],
    delay: 0.45,
  },
];

/* ── Animated traveling dot ───────────────────────────────── */
/**
 * Travels from left edge of connection line to right edge,
 * then fades out and restarts. Three dots stagger to create
 * a continuous-flow feel.
 */
function TravelingDot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-crew-coral shadow-[0_0_8px_rgba(21,122,91,0.6)]"
      style={{ left: 0 }}
      animate={{
        x: ["0%", "100%"],
        opacity: [0, 1, 1, 1, 0],
      }}
      transition={{
        x: { duration: 2.4, delay, repeat: Infinity, ease: "linear" },
        opacity: {
          duration: 2.4,
          delay,
          repeat: Infinity,
          times: [0, 0.08, 0.5, 0.92, 1],
        },
      }}
    />
  );
}

/* ── Station card ─────────────────────────────────────────── */
function Station({
  station,
  isLast,
}: {
  station: (typeof STATIONS)[0];
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="flex items-start gap-0 flex-1 min-w-0">
      {/* Station block */}
      <motion.div
        className="flex-1 min-w-0"
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: 0.5,
          delay: station.delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Icon + tag row */}
        <div className="flex flex-col items-center mb-4">
          <motion.div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border"
            style={{
              background: station.iconBg,
              borderColor: station.iconColor + "30",
            }}
            animate={inView ? { scale: [1, 1.08, 1] } : {}}
            transition={{
              duration: 0.5,
              delay: station.delay + 0.3,
              ease: "easeOut",
            }}
          >
            <station.Icon size={26} style={{ color: station.iconColor }} />
          </motion.div>

          <span
            className="inline-flex items-center h-[18px] px-2 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: station.tagBg, color: station.tagColor }}
          >
            {station.tag}
          </span>
        </div>

        {/* Title + items */}
        <div className="text-center px-2">
          <p className="font-semibold text-[15px] text-crew-ink mb-2 leading-tight">
            {station.title}
          </p>
          <ul className="grid gap-1">
            {station.items.map((item) => (
              <li key={item} className="text-[12px] text-crew-muted leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Connecting path (between stations) */}
      {!isLast && (
        <div className="relative flex-shrink-0 w-8 sm:w-12 lg:w-16 h-14 flex items-center justify-center">
          {/* Static dashed line */}
          <div
            className="absolute inset-x-0 top-7 h-px"
            style={{
              background:
                "repeating-linear-gradient(90deg, #d1d5db 0, #d1d5db 5px, transparent 5px, transparent 10px)",
            }}
          />
          {/* Traveling dots */}
          <div className="relative w-full h-3 overflow-visible">
            <TravelingDot delay={0} />
            <TravelingDot delay={0.8} />
            <TravelingDot delay={1.6} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mobile vertical layout ───────────────────────────────── */
function MobileStation({ station }: { station: (typeof STATIONS)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className="flex gap-4 items-start"
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: station.delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Icon */}
      <div className="shrink-0 flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center border"
          style={{ background: station.iconBg, borderColor: station.iconColor + "30" }}
        >
          <station.Icon size={22} style={{ color: station.iconColor }} />
        </div>
        {/* Vertical line connector */}
        <div className="flex-1 w-px bg-crew-border mt-2" style={{ minHeight: 24 }} />
      </div>

      {/* Content */}
      <div className="pb-6">
        <span
          className="inline-flex items-center h-[16px] px-2 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ background: station.tagBg, color: station.tagColor }}
        >
          {station.tag}
        </span>
        <p className="font-semibold text-[15px] text-crew-ink leading-tight mb-1">
          {station.title}
        </p>
        <p className="text-[13px] text-crew-muted">{station.items.join(" · ")}</p>
      </div>
    </motion.div>
  );
}

/* ── Root component ───────────────────────────────────────── */
export default function PassportJourney() {
  return (
    <>
      {/* Desktop: horizontal flow */}
      <div className="hidden sm:flex items-start gap-0 w-full">
        {STATIONS.map((s, i) => (
          <Station key={s.id} station={s} isLast={i === STATIONS.length - 1} />
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="sm:hidden">
        {STATIONS.map((s) => (
          <MobileStation key={s.id} station={s} />
        ))}
      </div>
    </>
  );
}
