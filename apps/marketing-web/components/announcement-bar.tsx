"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative bg-[#E8F72A] text-[#111111] text-center py-2.5 px-4 text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <span className="font-semibold">EU Battery Passport mandatory — 18 Feb 2027.</span>
        <a href="/compliance/eu-battery-regulation" className="underline hover:no-underline">
          Get ready now →
        </a>
      </span>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
