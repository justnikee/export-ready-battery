"use client";

import { ArrowRight, X } from "lucide-react";

export default function AnnouncementBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="relative bg-blue text-white text-center py-2.5 px-12 text-sm font-medium overflow-hidden">
      <span className="relative inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center h-[22px] px-2 rounded-sm bg-white text-blue text-[11px] font-semibold tracking-wide">
          NEW
        </span>
        <span>EU Battery Passport mandatory — 18 Feb 2027.</span>
        <a
          href="/compliance/eu-battery-regulation"
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline"
        >
          Get ready now
          <ArrowRight size={14} />
        </a>
      </span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss announcement"
        className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded-sm text-white/80 hover:text-white hover:bg-white/15 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
