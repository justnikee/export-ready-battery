"use client";

import { Lock, Pencil } from "lucide-react";

/** LAB_CERTIFIED is accepted for backward compat but always displayed as SELF_DECLARED — lab registry partnerships are not live. */
export type TrustTier = "BLOCKCHAIN_ANCHORED" | "SELF_DECLARED" | "LAB_CERTIFIED";

interface TrustBadgeProps {
  tier?: TrustTier;
  size?: "sm" | "md";
}

type DisplayTrustTier = "BLOCKCHAIN_ANCHORED" | "SELF_DECLARED";

const tierConfig: Record<
  DisplayTrustTier,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    title: string;
  }
> = {
  BLOCKCHAIN_ANCHORED: {
    label: "Blockchain Anchored",
    icon: <Lock className="h-3.5 w-3.5" />,
    className:
      "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    title:
      "This certificate's hash is timestamped on the Bitcoin blockchain via OpenTimestamps. The proof can be independently verified by anyone.",
  },
  SELF_DECLARED: {
    label: "Self-Declared",
    icon: <Pencil className="h-3.5 w-3.5" />,
    className:
      "bg-amber-500/10 text-amber-400 ring-amber-500/30",
    title:
      "This document was uploaded by the manufacturer without independent third-party verification. The platform does not validate certificate authenticity against BIS, CPCB, EU NANDO, or UN38.3 lab registries.",
  },
};

export function TrustBadge({
  tier = "SELF_DECLARED",
  size = "sm",
}: TrustBadgeProps) {
  const resolvedTier: DisplayTrustTier =
    tier === "BLOCKCHAIN_ANCHORED" ? "BLOCKCHAIN_ANCHORED" : "SELF_DECLARED";
  const config = tierConfig[resolvedTier];
  const sizeClasses =
    size === "sm"
      ? "px-3 py-1 text-xs gap-1.5"
      : "px-4 py-1.5 text-sm gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full ring-1 ${config.className} ${sizeClasses}`}
      title={config.title}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
