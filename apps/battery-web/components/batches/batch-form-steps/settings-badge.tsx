"use client";

import { Building2 } from "lucide-react";

/**
 * Marks a field as pre-filled from the tenant's organization Settings, so
 * users understand where the value came from and where to change it
 * permanently instead of editing it per-batch.
 */
export function SettingsBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-sky-400/40 bg-sky-400/10 px-1 py-0.5 text-[9px] font-medium leading-none text-sky-600 dark:text-sky-400">
      <Building2 className="h-2.5 w-2.5" />
      Settings
    </span>
  );
}

export function settingsFieldClass(isSettingsFilled: boolean): string {
  return isSettingsFilled ? "border-l-2 border-l-sky-400 bg-sky-400/5" : "";
}
