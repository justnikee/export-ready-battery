"use client";

import Link from "next/link";
import { AlertCircle, Package, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ActionItem {
  icon: LucideIcon;
  message: string;
  href: string;
  severity: "critical" | "warning" | "info";
}

export interface ActionQueueInputs {
  quotaBalance: number;
  quotaLimit: number;
  /** Batches still in DRAFT (not yet activated) for more than 7 days. */
  staleDraftBatchCount: number;
  /** Compliance certs (EPR/BIS/PLI) submitted but awaiting verification. */
  pendingCertCount: number;
  billingHref: string;
  batchesHref: string;
  complianceSettingsHref: string;
}

export function buildActionItems(input: ActionQueueInputs): ActionItem[] {
  const items: ActionItem[] = [];

  if (input.quotaLimit > 0 && input.quotaBalance <= input.quotaLimit * 0.1) {
    items.push({
      icon: AlertCircle,
      message: `Only ${input.quotaBalance} passport credit${input.quotaBalance === 1 ? "" : "s"} left`,
      href: input.billingHref,
      severity: input.quotaBalance <= 0 ? "critical" : "warning",
    });
  }

  if (input.staleDraftBatchCount > 0) {
    items.push({
      icon: Package,
      message: `${input.staleDraftBatchCount} batch${input.staleDraftBatchCount === 1 ? "" : "es"} not yet activated`,
      href: input.batchesHref,
      severity: "info",
    });
  }

  if (input.pendingCertCount > 0) {
    items.push({
      icon: Clock,
      message: `${input.pendingCertCount} compliance cert(s) awaiting verification`,
      href: input.complianceSettingsHref,
      severity: "warning",
    });
  }

  return items.slice(0, 4);
}

const SEVERITY_CLASSES: Record<ActionItem["severity"], string> = {
  critical: "border-red-500/20 bg-red-500/5 text-red-600",
  warning: "border-amber-500/20 bg-amber-500/5 text-amber-600",
  info: "border-blue-500/20 bg-blue-500/5 text-blue-600",
};

export function ActionQueue({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">✓ Nothing needs your attention today</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <Link
            key={i}
            href={item.href}
            className={`flex items-center gap-3 p-3 border transition-opacity hover:opacity-80 ${SEVERITY_CLASSES[item.severity]}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{item.message}</span>
          </Link>
        );
      })}
    </div>
  );
}
