"use client";

import { useFormContext } from "react-hook-form";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, CircleDot, Sparkles } from "lucide-react";
import { CompletionRing } from "@/components/batches/wizard/completion-ring";
import {
  batchCompletionChecks,
  completionPctFromChecks,
  completionBandLabel,
} from "@/lib/batch-completion";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

// Minimal shape of the tenant profile fields used for market readiness.
interface ReadinessUser {
  epr_registration_number?: string;
  epr_status?: string;
  bis_r_number?: string;
  bis_status?: string;
  iec_code?: string;
  eu_authorized_representative_name?: string;
  eu_contact_email?: string;
}

interface WizardSummaryPanelProps {
  user?: ReadinessUser | null;
  onJumpToStep: (step: number) => void;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-[11px] text-foreground">
      {children}
    </span>
  );
}

/**
 * Always-visible context panel for the full-screen wizard: completion ring,
 * batch identity chips, the list of fields still needed, and market profile
 * readiness — so the user sees "what's left" at every step, not just on Review.
 */
export function WizardSummaryPanel({ user, onJumpToStep }: WizardSummaryPanelProps) {
  const { watch } = useFormContext<BatchFormData>();
  const values = watch();

  const checks = batchCompletionChecks(values);
  const pct = completionPctFromChecks(checks);
  const remaining = checks.filter((c) => !c.filled);

  const market = values.marketRegion;
  const isIndia = market === "INDIA" || market === "GLOBAL";
  const isEU = market === "EU" || market === "GLOBAL";

  // Market profile readiness (tenant-level certifications), mirrors Review.
  const readinessItems: { label: string; ready: boolean }[] = [];
  if (user) {
    if (isIndia) {
      readinessItems.push({
        label: "EPR Registration",
        ready: !!user.epr_registration_number?.trim() && (user.epr_status === "PENDING" || user.epr_status === "VERIFIED"),
      });
      readinessItems.push({
        label: "BIS Certification",
        ready: !!user.bis_r_number?.trim() && (user.bis_status === "PENDING" || user.bis_status === "VERIFIED"),
      });
      readinessItems.push({ label: "IEC Code", ready: !!user.iec_code?.trim() });
    }
    if (isEU) {
      readinessItems.push({
        label: "EU Representative",
        ready: !!user.eu_authorized_representative_name?.trim() && !!user.eu_contact_email?.trim(),
      });
    }
  }
  const readyCount = readinessItems.filter((i) => i.ready).length;

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-border p-5">
      {/* Completion */}
      <div className="flex items-center gap-3">
        <CompletionRing pct={pct} size={64} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{completionBandLabel(pct)}</div>
          <p className="text-xs text-muted-foreground">Batch completeness</p>
        </div>
      </div>

      {/* Identity chips */}
      <div className="flex flex-wrap gap-1.5">
        {market && <Chip>{market}</Chip>}
        {values.chemistry && <Chip>{values.chemistry}</Chip>}
        {values.cellSource && <Chip>{values.cellSource}</Chip>}
        {values.capacity && <Chip>{values.capacity}</Chip>}
      </div>

      {/* Fields remaining */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Fields remaining
          </span>
          <span className="text-[11px] text-muted-foreground">{remaining.length}</span>
        </div>
        {remaining.length === 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-500">
            <ShieldCheck className="h-3.5 w-3.5" /> All tracked fields filled
          </p>
        ) : (
          <ul className="space-y-0.5">
            {remaining.slice(0, 8).map((c) => (
              <li key={c.label}>
                <button
                  type="button"
                  onClick={() => onJumpToStep(c.step)}
                  className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <CircleDot className="h-3 w-3 shrink-0 opacity-60" />
                  {c.label}
                </button>
              </li>
            ))}
            {remaining.length > 8 && (
              <li className="px-1 text-[11px] text-muted-foreground">+{remaining.length - 8} more</li>
            )}
          </ul>
        )}
      </div>

      {/* Profile readiness */}
      {readinessItems.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Profile readiness
            </span>
            <span className={`text-[11px] ${readyCount === readinessItems.length ? "text-emerald-500" : "text-amber-500"}`}>
              {readyCount}/{readinessItems.length}
            </span>
          </div>
          <ul className="space-y-0.5">
            {readinessItems.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-xs">
                {item.ready ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
                <span className={item.ready ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              </li>
            ))}
          </ul>
          {readyCount < readinessItems.length && (
            <Link
              href="/dashboard/settings?tab=compliance"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Complete in Settings
            </Link>
          )}
        </div>
      )}

      {/* AI hint */}
      <div className="mt-auto flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span>Use the AI Assistant at the top of the first step to auto-fill from a datasheet.</span>
      </div>
    </aside>
  );
}
