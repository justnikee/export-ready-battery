"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import DeadlineCountdown from "@/components/deadline-countdown";

interface ProblemCardItem {
  number: string;
  tag: string;
  title: string;
  description: string;
  badge: string;
}

const PROBLEMS: ProblemCardItem[] = [
  {
    number: "001",
    tag: "REGULATION",
    title: "200+ pages of EU rules.",
    description: "A full-time compliance hire — or specialized legal consultants — just to understand what's required of your export lines.",
    badge: "EU Battery Regulation 2023/1542",
  },
  {
    number: "002",
    tag: "CUSTOMS CLEARANCE",
    title: "Containers held at port.",
    description: "The EU importer will refuse a PO without a scannable pack record. A missing DoC is a lab and legal problem — software cannot invent one.",
    badge: "Destination Verification Required",
  },
  {
    number: "003",
    tag: "CERTIFICATE EXPIRY",
    title: "Certificates expire silently.",
    description: "BIS and EPR registrations lapse periodically. Miss a renewal window and production — or export shipping — halts instantly.",
    badge: "Automated Renewal Tracking",
  },
  {
    number: "004",
    tag: "DATA FRAGMENTATION",
    title: "Scramble for supplier data.",
    description: "Scattered PDFs across emails and ERPs make compliance auditing slow, error-prone, and high-risk for every batch.",
    badge: "Fragmented Audit Trail",
  },
];

export default function ComplianceCliff() {
  return (
    <section className="bg-bg antialiased">
      <div className="max-w-[1232px] mx-auto border-x border-b border-border">
        <div className="pt-16 lg:pt-20">
          {/* Header Block: Centered Pill & Headline */}
          <div className="px-6 text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <X size={13} className="text-emerald-600" />
              THE PROBLEM
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
              The rules changed.
              <br />
              The paperwork didn&apos;t keep up.
            </h2>

            <p className="text-[16px] leading-[1.65] text-text-muted text-pretty max-w-[620px] mx-auto">
              From 18 February 2027, LMT, industrial batteries above 2 kWh, and EV batteries placed on the EU market need a battery passport. Portable and SLI packs need a QR, not that full record. Carbon class is not the 2027 product.
            </p>
          </div>

          {/* Grid Layout Container (Left Radar Graphic + Right 2x2 Problem Cards) */}
          <div className="border-t border-border bg-white grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column (5 Cols): Clean Geometric Radar Scanner & Countdown */}
            <div className="lg:col-span-5 bg-[#fafdfb] p-8 lg:p-10 flex flex-col justify-center items-center lg:border-r border-border/60 relative overflow-hidden">
              {/* Radar Scanner (Clean Geometric Crosshairs & Concentric Rings) */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center select-none">
                <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Corner Target Brackets */}
                  <path d="M 25 40 L 25 25 L 40 25" stroke="#045c43" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
                  <path d="M 240 25 L 255 25 L 255 40" stroke="#045c43" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
                  <path d="M 25 240 L 25 255 L 40 255" stroke="#045c43" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
                  <path d="M 240 255 L 255 255 L 255 240" stroke="#045c43" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />

                  {/* Concentric Radar Rings */}
                  <circle cx="140" cy="140" r="115" stroke="#045c43" strokeWidth="1" strokeOpacity="0.25" />
                  <circle cx="140" cy="140" r="90" stroke="#045c43" strokeWidth="1" strokeOpacity="0.25" />
                  <circle cx="140" cy="140" r="65" stroke="#045c43" strokeWidth="1" strokeOpacity="0.25" />
                  <circle cx="140" cy="140" r="40" stroke="#045c43" strokeWidth="1" strokeOpacity="0.25" />
                  <circle cx="140" cy="140" r="18" stroke="#045c43" strokeWidth="1" strokeOpacity="0.25" />

                  {/* Horizontal & Vertical Crosshair Lines */}
                  <line x1="15" y1="140" x2="265" y2="140" stroke="#045c43" strokeWidth="1" strokeOpacity="0.2" />
                  <line x1="140" y1="15" x2="140" y2="265" stroke="#045c43" strokeWidth="1" strokeOpacity="0.2" />

                  {/* 45-Degree Diagonal Guidelines */}
                  <line x1="45" y1="45" x2="235" y2="235" stroke="#045c43" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.2" />
                  <line x1="235" y1="45" x2="45" y2="235" stroke="#045c43" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.2" />

                  {/* Small Radar Intersection Dots */}
                  {[
                    [76, 76], [204, 76], [76, 204], [204, 204],
                    [94, 94], [186, 94], [94, 186], [186, 186],
                    [140, 25], [140, 255], [25, 140], [265, 140],
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="2" fill="#045c43" fillOpacity="0.5" />
                  ))}
                </svg>

                {/* Scanning Radar Line */}
                <motion.div
                  className="absolute inset-4 sm:inset-5 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(16,185,129,0.18)_360deg)] pointer-events-none"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Countdown Component Integration */}
              <div className="w-full mt-6 pt-6 border-t border-border/60">
                <DeadlineCountdown variant="block" />
              </div>
            </div>

            {/* Right Column (7 Cols): 2x2 Problem Cards Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 border-t lg:border-t-0 border-border/80">
              {PROBLEMS.map((item, idx) => {
                const isRightColumn = idx % 2 === 1;
                const isTopRow = idx < 2;

                return (
                  <div
                    key={item.number}
                    className={`p-7 sm:p-8 flex flex-col justify-between space-y-4 hover:bg-emerald-50/20 transition-colors ${
                      !isRightColumn ? "sm:border-r border-border/80" : ""
                    } ${isTopRow ? "border-b border-border/80" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-xs mb-3">
                        <span className="font-bold text-emerald-800 tracking-wider">
                          {item.tag}
                        </span>
                        <span className="text-text-dim/80 font-medium">
                          {item.number}
                        </span>
                      </div>
                      <h3 className="font-heading text-text text-[20px] sm:text-[22px] font-bold tracking-[-0.025em] leading-snug mb-2">
                        {item.title}
                      </h3>
                      <p className="text-[13.5px] leading-[1.65] text-text-muted font-normal text-pretty">
                        {item.description}
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10.5px] font-semibold">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
