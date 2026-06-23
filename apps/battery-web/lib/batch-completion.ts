/**
 * Shared batch-completion scoring. Used by both the Review step's completion
 * ring and the entry-modal draft list, so a draft's "% complete" reflects the
 * same field checks the user sees on Review — not a coarse step/total estimate.
 */

import type { BatchFormData } from "@/components/batches/batch-form-schema";

export interface CompletionCheck {
  label: string;
  filled: boolean;
  /** Wizard step the field lives on, for jump-to-field navigation. */
  step: number;
}

/**
 * Build the market-aware list of completion checks for a batch form.
 * Accepts partial data (e.g. a saved draft) — missing fields read as unfilled.
 */
export function batchCompletionChecks(data: Partial<BatchFormData>): CompletionCheck[] {
  const market = data.marketRegion;
  const showEU = market === "EU" || market === "GLOBAL";
  const showIndia = market === "INDIA" || market === "GLOBAL";

  const checks: CompletionCheck[] = [
    { label: "Batch Name", filled: !!data.batchName, step: 0 },
    { label: "Model Name", filled: !!data.modelName, step: 0 },
    { label: "Manufacturer", filled: !!data.manufacturer, step: 0 },
    { label: "Chemistry", filled: !!data.chemistry, step: 0 },
    { label: "Capacity", filled: !!data.capacity, step: 0 },
    { label: "Voltage", filled: !!data.voltage, step: 0 },
    { label: "Weight", filled: !!data.weight, step: 0 },
    { label: "Manufacturing Start Date", filled: !!data.manufacturingStartDate, step: 0 },
    { label: "Manufacturing End Date", filled: !!data.manufacturingEndDate, step: 0 },
  ];

  if (showEU) {
    checks.push(
      { label: "Carbon Footprint", filled: !!data.carbonFootprint, step: 1 },
      { label: "Carbon Class", filled: !!data.carbonPerformanceClass, step: 1 },
      { label: "CE Marking", filled: data.ceMarking === true, step: 1 },
      { label: "Notified Body", filled: !!data.notifiedBodyNumber, step: 1 },
      { label: "EU Representative", filled: !!data.euRepresentative, step: 1 },
      { label: "Lifetime", filled: !!data.expectedLifetime, step: 1 },
      { label: "Warranty", filled: !!data.warrantyMonths, step: 1 }
    );
  }

  if (showIndia) {
    checks.push(
      { label: "HSN Code", filled: !!data.hsnCode, step: 1 },
      { label: "Cell Source", filled: !!data.cellSource, step: 1 },
      { label: "BIS Number", filled: !!data.bisNumber, step: 1 },
      { label: "EPR Number", filled: !!data.eprNumber, step: 1 }
    );
  }

  return checks;
}

/** Percentage (0–100) of completion checks that are filled. */
export function batchCompletionPct(data: Partial<BatchFormData>): number {
  const checks = batchCompletionChecks(data);
  if (checks.length === 0) return 0;
  const filled = checks.filter((c) => c.filled).length;
  return Math.round((filled / checks.length) * 100);
}

/** Percentage from an already-computed check list (avoids recomputing). */
export function completionPctFromChecks(checks: CompletionCheck[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter((c) => c.filled).length / checks.length) * 100);
}

/** Human-readable band label for a completion percentage. */
export function completionBandLabel(pct: number): string {
  if (pct >= 100) return "Complete — export passport ready";
  if (pct >= 75) return "Good — almost ready";
  if (pct >= 50) return "Fair — keep going";
  if (pct > 0) return "Getting started";
  return "Not started";
}
