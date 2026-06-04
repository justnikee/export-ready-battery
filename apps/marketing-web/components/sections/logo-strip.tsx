"use client";

import { useEffect, useRef } from "react";

interface BadgeProps {
  label: string;
  abbr: string;
  color: string;
}

function ComplianceBadge({ label, abbr, color }: BadgeProps) {
  return (
    <div className="flex items-center gap-2 shrink-0 px-2">
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded text-[9px] font-bold text-white"
        style={{ background: color }}
      >
        {abbr}
      </span>
      <span className="text-[12px] font-medium text-[#64748d] whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

const badges: BadgeProps[] = [
  { label: "EU Battery Regulation", abbr: "EU", color: "#003399" },
  { label: "EUDR", abbr: "DR", color: "#1e4d2b" },
  { label: "REACH", abbr: "RE", color: "#2563eb" },
  { label: "RoHS", abbr: "RH", color: "#0891b2" },
  { label: "CE Marking", abbr: "CE", color: "#dc2626" },
  { label: "BIS", abbr: "BI", color: "#ea580c" },
  { label: "UN38.3", abbr: "UN", color: "#4f46e5" },
  { label: "GOTS", abbr: "GO", color: "#16a34a" },
  { label: "OEKO-TEX", abbr: "OE", color: "#7c3aed" },
];

export default function LogoStrip() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onEnter = () => { track.style.animationPlayState = "paused"; };
    const onLeave = () => { track.style.animationPlayState = "running"; };
    track.addEventListener("mouseenter", onEnter);
    track.addEventListener("mouseleave", onLeave);
    return () => {
      track.removeEventListener("mouseenter", onEnter);
      track.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="relative z-[3] py-4 bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6 overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#f6f9fc] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#f6f9fc] to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="flex gap-6 w-max animate-marquee"
        >
          {/* First set */}
          {badges.map((b, i) => (
            <ComplianceBadge key={`a-${i}`} {...b} />
          ))}
          {/* Duplicate for seamless loop */}
          {badges.map((b, i) => (
            <ComplianceBadge key={`b-${i}`} {...b} />
          ))}
          {/* Third set for extra smoothness on wide screens */}
          {badges.map((b, i) => (
            <ComplianceBadge key={`c-${i}`} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}
