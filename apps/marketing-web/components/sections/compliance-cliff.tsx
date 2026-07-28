"use client";

import { motion } from "framer-motion";
import { ArrowRight, FileText, Anchor, Clock } from "lucide-react";
import DeadlineCountdown from "@/components/deadline-countdown";

export default function ComplianceCliff() {
  return (
    <section className="bg-bg">
      <div className="max-w-[1232px] mx-auto">
        {/* Sticky Section header */}
        <div className="sticky top-20 z-20 bg-bg/95 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <span className="section-index">THE PROBLEM</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-emerald-600 font-semibold">2</span>/8]
          </span>
        </div>
        
        <div className="px-6 pt-16 pb-20 lg:pt-20 lg:pb-28">

          {/* Block 1: Header Row (Full Width Split: Left Headline, Right Countdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16">
            
            {/* Left Column (Headline & Context) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase rounded-none border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-600" />
                EU Regulatory Mandate
              </div>

              <h2 className="font-heading text-text text-[clamp(32px,4.5vw,52px)] font-semibold tracking-[-0.035em] leading-[1.08] text-balance">
                The rules changed.
                <br />
                The paperwork didn&apos;t keep up.
              </h2>
              
              <p className="text-[16px] leading-[1.65] text-text-muted text-pretty max-w-[580px]">
                EU Battery Regulation 2023/1542 requires a verifiable digital passport for every battery exported to Europe, linking carbon footprints, material sourcing, and compliance records.
              </p>
            </div>

            {/* Right Column (Deadline Countdown - Direct Page Integration, No Card Box) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <DeadlineCountdown variant="block" />
            </div>

          </div>

          {/* Block 2: Full-Width 3-Column Items 01, 02, 03 (Fills Full Layout Width) */}
          <div className="pt-12 border-t border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              
              {/* Item 01 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-mono text-xs font-bold text-emerald-800 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200">
                    01 / REGULATION
                  </span>
                  <FileText size={16} className="text-emerald-700" />
                </div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] leading-snug">
                  200+ pages of EU regulation
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  A full-time compliance hire — or specialized legal consultants — just to understand what&apos;s required of you.
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold">
                    EU Battery Regulation 2023/1542
                  </span>
                </div>
              </div>

              {/* Item 02 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-mono text-xs font-bold text-amber-900 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30">
                    02 / CUSTOMS CLEARANCE
                  </span>
                  <Anchor size={16} className="text-amber-700" />
                </div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] leading-snug">
                  Held at the port
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  One missing carbon declaration or Declaration of Conformity can hold your container at European ports.
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 font-mono text-[11px] font-semibold">
                    Destination Verification Required
                  </span>
                </div>
              </div>

              {/* Item 03 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="font-mono text-xs font-bold text-emerald-800 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200">
                    03 / CERTIFICATE TRACKING
                  </span>
                  <Clock size={16} className="text-emerald-700" />
                </div>
                <h3 className="font-heading text-text text-[22px] font-normal tracking-[-0.03em] leading-snug">
                  Certificates that expire silently
                </h3>
                <p className="text-[14.5px] leading-[1.65] text-text-muted text-pretty">
                  BIS and EPR registrations lapse periodically. Miss the renewal and production — or a shipment — stops.
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold">
                    Automated Renewal Tracking
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Block 3: Solution Transition Callout Banner */}
          <div className="mt-16 bg-gradient-to-r from-[#045c43] via-[#059669] to-[#047857] p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            {/* SVG Noise / Grainy Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay">
              <svg className="w-full h-full">
                <filter id="grainNoiseProblemStoryFull">
                  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#grainNoiseProblemStoryFull)" />
              </svg>
            </div>

            <div className="relative z-10 max-w-3xl space-y-2">
              <h3 className="font-heading text-white text-[clamp(22px,2.8vw,30px)] font-bold tracking-[-0.03em] leading-tight">
                Compliance is no longer a cost center — it&apos;s your advantage to win European orders.
              </h3>
              <p className="text-emerald-100/90 text-[14.5px] leading-[1.65] font-normal">
                Anviora replaces the manual scramble with a single, cryptographically verified source of truth.
              </p>
            </div>

            <a
              href="#how-it-works"
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-950 font-medium text-[14.5px] hover:bg-emerald-50 transition-colors shrink-0"
            >
              See how Anviora solves this
              <ArrowRight size={16} className="text-emerald-700" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
