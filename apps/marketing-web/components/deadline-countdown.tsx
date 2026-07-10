"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// EU Battery Passport mandatory: 18 February 2027
const TARGET = new Date("2027-02-18T00:00:00.000Z");

function getTimeLeft() {
  const diff = Math.max(0, TARGET.getTime() - Date.now());
  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function DigitCell({
  value,
  label,
  large = false,
}: {
  value: number | null;
  label: string;
  large?: boolean;
}) {
  // value is null before mount — render a stable placeholder so the
  // server HTML and first client render match (no hydration mismatch).
  const display = value === null ? "––" : large ? String(value) : pad(value);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative overflow-hidden rounded-xl bg-white px-3 py-2 min-w-[56px] sm:min-w-[72px] text-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="block font-mono text-[clamp(22px,3.5vw,36px)] font-bold leading-none text-crew-ink tracking-[-0.04em] tabular-nums"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-crew-muted">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-[clamp(18px,2.5vw,28px)] font-bold text-crew-muted/40 leading-none mb-5 select-none">
      :
    </span>
  );
}

interface Props {
  /** "inline" = compact badge style · "block" = full display */
  variant?: "inline" | "block";
  className?: string;
}

export default function DeadlineCountdown({
  variant = "block",
  className = "",
}: Props) {
  // null until mounted: the countdown depends on the client clock, so the
  // prerendered HTML must not contain a computed value (hydration mismatch).
  const [time, setTime] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Inline (compact pill) ── */
  if (variant === "inline") {
    return (
      <div
        className={`inline-flex items-center gap-2 h-[30px] pl-2 pr-3 rounded-full bg-[#fef2f2] border border-[#fecaca] ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
        <span className="font-mono text-[12px] font-bold text-[#b91c1c] tabular-nums">
          {time === null
            ? "––d ––h ––m ––s"
            : `${time.days}d ${pad(time.hours)}h ${pad(time.minutes)}m ${pad(time.seconds)}s`}
        </span>
        <span className="text-[11px] font-medium text-[#991b1b] hidden sm:inline">
          — EU DPP deadline
        </span>
      </div>
    );
  }

  /* ── Block (full countdown display) ── */
  return (
    <div className={className}>
      {/* Urgency eyebrow */}
      <div className="inline-flex items-center gap-2 mb-5 h-7 pl-2 pr-3 rounded-full bg-[#fef2f2] border border-[#fecaca]">
        <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
        <span className="text-[12px] font-semibold text-[#b91c1c] tracking-[0.06em] uppercase">
          EU Battery Passport deadline
        </span>
      </div>

      {/* Digit row */}
      <div className="flex items-center gap-2 sm:gap-3">
        <DigitCell value={time && time.days} label="Days" large />
        <Colon />
        <DigitCell value={time && time.hours} label="Hours" />
        <Colon />
        <DigitCell value={time && time.minutes} label="Min" />
        <Colon />
        <DigitCell value={time && time.seconds} label="Sec" />
      </div>

      {/* Date line */}
      <p className="mt-4 text-[14px] leading-[1.5] text-crew-muted">
        Until{" "}
        <strong className="font-semibold text-crew-ink">18 February 2027</strong>
        {" "}— no passport, no EU market access.
      </p>
    </div>
  );
}
