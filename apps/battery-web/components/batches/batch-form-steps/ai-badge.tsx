"use client";

import { Sparkles } from "lucide-react";

/**
 * Persistent "this value came from AI" marker — kept visible on the actual
 * form field (not just the transient preview table) all the way through
 * Identity/Specs/Compliance and into the Review summary.
 */
export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-amber-400/40 bg-amber-400/10 px-1 py-0.5 text-[9px] font-medium leading-none text-amber-600 dark:text-amber-400">
      <Sparkles className="h-2.5 w-2.5" />
      AI
    </span>
  );
}

export function aiFieldClass(isAiFilled: boolean): string {
  return isAiFilled ? "border-l-2 border-l-amber-400 bg-amber-400/5" : "";
}
