"use client";

import { Globe, Lock, ShieldCheck, AlertTriangle, XCircle, Unlock } from "lucide-react";

/**
 * Shared status/market/compliance badges so the batches list, batch detail
 * header, and dashboard all render the same entity states identically.
 * All colors carry explicit dark-mode variants.
 */

export type BatchMarketRegion = "INDIA" | "EU" | "GLOBAL";

const badgeBase =
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border";

export function BatchStatusBadge({ status }: { status?: string }) {
  const s = (status || "DRAFT").toUpperCase();
  if (s === "ACTIVE") {
    return (
      <span
        className={`${badgeBase} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`}
      >
        <Unlock className="h-3 w-3" />
        Active
      </span>
    );
  }
  if (s === "ARCHIVED") {
    return (
      <span
        className={`${badgeBase} bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Archived
      </span>
    );
  }
  return (
    <span className={`${badgeBase} bg-muted text-muted-foreground border-border`}>
      <Lock className="h-3 w-3" />
      Draft
    </span>
  );
}

export function MarketBadge({ region }: { region?: BatchMarketRegion | string }) {
  if (region === "INDIA") {
    return (
      <span
        className={`${badgeBase} bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20`}
      >
        <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
        India
      </span>
    );
  }
  if (region === "EU") {
    return (
      <span
        className={`${badgeBase} bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20`}
      >
        <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
        EU
      </span>
    );
  }
  return (
    <span className={`${badgeBase} bg-muted text-muted-foreground border-border`}>
      <Globe className="h-3 w-3" />
      Global
    </span>
  );
}

export type ComplianceStatus = "READY" | "NEEDS_WORK" | "BLOCKED";

export function ComplianceBadge({
  status,
  label,
  score,
  blockerCount = 0,
}: {
  status: ComplianceStatus;
  label: string;
  score?: number;
  blockerCount?: number;
}) {
  const title =
    typeof score === "number" ? `${score.toFixed(0)}% compliant` : undefined;
  if (status === "READY") {
    return (
      <span
        className={`${badgeBase} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`}
        title={title}
      >
        <ShieldCheck className="h-3 w-3" />
        {label}
      </span>
    );
  }
  if (status === "NEEDS_WORK") {
    return (
      <span
        className={`${badgeBase} bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20`}
        title={title}
      >
        <AlertTriangle className="h-3 w-3" />
        {label}
        {blockerCount > 0 && ` (${blockerCount})`}
      </span>
    );
  }
  return (
    <span
      className={`${badgeBase} bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20`}
      title={title}
    >
      <XCircle className="h-3 w-3" />
      {label}
      {blockerCount > 0 && ` (${blockerCount})`}
    </span>
  );
}
