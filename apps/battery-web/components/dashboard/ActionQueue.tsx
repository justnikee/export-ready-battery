"use client";

import Link from "next/link";
import { AlertCircle, Package, Clock, ShieldAlert } from "lucide-react";
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
  /** At least one compliance item is missing or rejected — genuinely needs the user to act. */
  complianceSetupIncomplete: boolean;
  complianceSetupMessage?: string;
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

  if (input.complianceSetupIncomplete) {
    items.push({
      icon: ShieldAlert,
      message: input.complianceSetupMessage || "Compliance setup incomplete",
      href: input.complianceSettingsHref,
      severity: "warning",
    });
  }

  if (input.pendingCertCount > 0) {
    items.push({
      icon: Clock,
      message: `${input.pendingCertCount} compliance cert(s) awaiting verification`,
      href: input.complianceSettingsHref,
      severity: "info",
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

  return items.slice(0, 4);
}

const SEVERITY_TEXT: Record<ActionItem["severity"], string> = {
  critical: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

const STRIP_TONE: Record<ActionItem["severity"], string> = {
  critical: "bg-red-500/10",
  warning: "bg-amber-500/10",
  info: "bg-blue-500/10",
};

export function ActionQueue({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  const worstSeverity = items.some((i) => i.severity === "critical")
    ? "critical"
    : items.some((i) => i.severity === "warning")
      ? "warning"
      : "info";

  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md px-4 py-2.5 ${STRIP_TONE[worstSeverity]}`}
    >
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 ${SEVERITY_TEXT[worstSeverity]}`}
      >
        Needs attention
      </span>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <span key={i} className="flex items-center gap-x-5">
            <Link
              href={item.href}
              className={`flex items-center gap-1.5 text-sm hover:underline underline-offset-2 ${SEVERITY_TEXT[item.severity]}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {item.message}
            </Link>
            {i < items.length - 1 && (
              <span className="text-muted-foreground/40" aria-hidden="true">
                &middot;
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
