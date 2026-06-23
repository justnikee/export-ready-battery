"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, FileCheck, AlertTriangle, ShieldCheck, CircleDot } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { AiBadge } from "@/components/batches/batch-form-steps/ai-badge";
import type { BatchFormData } from "@/components/batches/batch-form-schema";
import { batchCompletionChecks, completionBandLabel } from "@/lib/batch-completion";
import { CompletionRing } from "@/components/batches/wizard/completion-ring";
import {
  getActivationBlockers,
  formatBlockerLabel,
  isProfileBlocker,
  type ActivationBatchInput,
} from "@/lib/activation-blockers";

function Section({
  title,
  onJump,
  children,
}: {
  title: string;
  onJump?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
        {onJump && (
          <button
            type="button"
            onClick={onJump}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit →
          </button>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  warning,
  onClick,
  ai,
  incomplete,
  scoreImpact,
}: {
  label: string;
  value: React.ReactNode;
  warning?: string;
  onClick?: () => void;
  ai?: boolean;
  incomplete?: boolean;
  scoreImpact?: number;
}) {
  const content = (
    <>
      <span className="text-muted-foreground flex items-center gap-1.5">
        {label}
        {ai && <AiBadge />}
      </span>
      <div className="text-right">
        {incomplete ? (
          <span className="font-medium text-amber-600 dark:text-amber-400">Add now →</span>
        ) : (
          <span className="font-medium">{value || <span className="text-muted-foreground italic">—</span>}</span>
        )}
        {warning && <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end"><AlertTriangle className="h-3 w-3" />{warning}</p>}
        {incomplete && scoreImpact ? (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
            <AlertTriangle className="h-3 w-3" />Not filled — adds {scoreImpact}% to passport score
          </p>
        ) : null}
      </div>
    </>
  );

  const wrapperClass = `flex justify-between items-start text-sm rounded px-1 -mx-1 ${incomplete ? "bg-amber-400/10 border-l-2 border-l-amber-400" : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${wrapperClass} w-full text-left hover:bg-accent/40 transition-colors`}
      >
        {content}
      </button>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

interface StepReviewProps {
  onJumpToStep: (step: number) => void;
  aiFilledFields?: Set<string>;
  iecError?: boolean;
}

export function StepReview({ onJumpToStep, aiFilledFields, iecError }: StepReviewProps) {
  const filledByAi = aiFilledFields ?? new Set<string>();
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();
  const { user } = useAuth();

  const values = watch();
  const isEUMode = values.marketRegion === "EU";
  const isIndiaMode = values.marketRegion === "INDIA";
  const hasErrors = Object.keys(errors).length > 0;

  // Activation readiness — runs the SAME gate the detail page and backend use
  // (lib/activation-blockers), but against this form, so the user sees what will
  // block activation BEFORE creating the draft instead of discovering it later.
  const activationInput: ActivationBatchInput = (() => {
    let dva = 0;
    if (values.cellSource === "DOMESTIC") {
      if (values.dvaSource === "AUDITED") {
        dva = parseFloat(values.auditedDva) || 0;
      } else {
        const sale = parseFloat(values.salePrice) || 0;
        const imp = parseFloat(values.importCost) || 0;
        dva = sale > 0 ? Math.max(0, ((sale - imp) / sale) * 100) : 0;
      }
    }
    return {
      model_name: values.modelName,
      market_region: values.marketRegion,
      manufacturing_start_date: values.manufacturingStartDate || null,
      manufacturing_end_date: values.manufacturingEndDate || null,
      pli_compliant: values.pliCompliant,
      domestic_value_add: dva,
      carbon_footprint_result: null, // produced after creation via the Carbon Calculator
      specs: {
        chemistry: values.chemistry,
        capacity: values.capacity,
        cell_source: values.cellSource || undefined,
        certifications: values.certifications,
        battery_category: values.batteryCategory || undefined,
        bill_of_entry_no: values.billOfEntryNo,
        country_of_origin:
          values.cellSource === "IMPORTED" ? values.cellCountryOfOrigin : values.countryOfOrigin,
        customs_date: values.customsDate,
        bis_certificate_issue_date: values.bisCertificateIssueDate,
        un38_3_test_date: values.un383TestDate,
        iec_62133_test_date: values.iec62133TestDate,
        msds_issue_date: values.msdsIssueDate,
        material_composition: values.materialComposition,
        hazardous_substances: { declaration: values.hazardousDeclaration },
        expected_lifetime_cycles: values.expectedLifetime ? parseInt(values.expectedLifetime) : 0,
        warranty_months: values.warrantyMonths ? parseInt(values.warrantyMonths) : 0,
      },
    };
  })();
  const activation = getActivationBlockers(activationInput, user);
  const activationDataBlockers = activation.blocking.filter((b) => !isProfileBlocker(b));
  const activationProfileBlockers = activation.blocking.filter((b) => isProfileBlocker(b));
  const canActivateNow = activation.blocking.length === 0;

  // Batch-form completion ring — distinct from profileReadiness() (which tracks the
  // tenant's company-level certifications, not this batch's own field values).
  // Uses the shared helper so the entry-modal draft list scores identically.
  const completionChecks = batchCompletionChecks(values);

  const completionFilledCount = completionChecks.filter((c) => c.filled).length;
  const completionPct =
    completionChecks.length > 0 ? Math.round((completionFilledCount / completionChecks.length) * 100) : 0;
  const incompleteLabels = new Set(completionChecks.filter((c) => !c.filled).map((c) => c.label));
  const scoreImpactPct = completionChecks.length > 0 ? Math.round(100 / completionChecks.length) : 0;
  const nextBestAction = completionChecks.find((c) => !c.filled);
  const nextBestActionProjectedPct = nextBestAction
    ? Math.round(((completionFilledCount + 1) / completionChecks.length) * 100)
    : completionPct;

  const matTotal = (
    ["cobalt", "lithium", "nickel", "manganese", "graphite", "lead"] as const
  ).reduce((sum, key) => sum + (parseFloat(values.materialComposition[key]) || 0), 0);

  return (
    <div className="space-y-6">
      {hasErrors && (
        <div className="p-3 bg-red-500/10 border border-red-200 rounded text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Please fix the errors highlighted above before submitting.
        </div>
      )}

      {iecError && (
        <div className="p-3 bg-red-500/10 border border-red-200 rounded text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p>Create Batch is disabled — an IEC Code is required for imported cells.</p>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => onJumpToStep(1)} className="text-xs underline hover:text-foreground">
                Back to Compliance
              </button>
              <Link href="/dashboard/settings?tab=compliance" className="text-xs underline hover:text-foreground">
                Add IEC Code in Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Batch completion ring */}
      <div className="flex items-center gap-4 p-3 border border-border rounded">
        <CompletionRing pct={completionPct} />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{completionBandLabel(completionPct)}</div>
          <p className="text-xs text-muted-foreground">Batch profile completeness</p>
          {nextBestAction && (
            <button
              type="button"
              onClick={() => onJumpToStep(nextBestAction.step)}
              className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Add {nextBestAction.label} to raise score to {nextBestActionProjectedPct}% — Add now →
            </button>
          )}
        </div>
      </div>

      {/* Activation readiness — what it takes to ACTIVATE this batch after creating it */}
      <div className="border border-border rounded">
        <div className="flex items-start gap-3 p-3">
          {canActivateNow ? (
            <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">
              {canActivateNow
                ? "Ready to activate right after creating"
                : `${activation.blocking.length} item${activation.blocking.length > 1 ? "s" : ""} needed before activation`}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Creating saves this as a <span className="font-medium text-foreground">draft</span>. To
              generate passports &amp; exports you&apos;ll <span className="font-medium text-foreground">activate</span> it
              — which uses <span className="font-medium text-foreground">1 activation credit</span> and requires the items below.
            </p>
          </div>
        </div>

        {!canActivateNow && (
          <div className="border-t border-border px-3 py-2.5 space-y-3">
            {activationDataBlockers.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Complete on this batch
                </div>
                <ul className="space-y-0.5">
                  {activationDataBlockers.map((b) => (
                    <li key={b} className="flex items-center gap-1.5 text-xs text-foreground">
                      <CircleDot className="h-3 w-3 shrink-0 text-amber-500" />
                      {formatBlockerLabel(b)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activationProfileBlockers.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Complete once in Settings
                  </div>
                  <Link
                    href="/dashboard/settings?tab=compliance"
                    className="text-[10px] text-muted-foreground underline hover:text-foreground"
                  >
                    Open Settings
                  </Link>
                </div>
                <ul className="space-y-0.5">
                  {activationProfileBlockers.map((b) => (
                    <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CircleDot className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {formatBlockerLabel(b)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="border-t border-border px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
            What happens after you create
          </div>
          <ol className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-foreground">1</span>
              Saved as a draft batch (no credit used)
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-foreground">2</span>
              Add passports &amp; clear any items above
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-foreground">3</span>
              Activate (uses 1 credit) → labels, passports &amp; reports unlock
            </li>
          </ol>
        </div>
      </div>

      {/* Identity Summary */}
      <Section title="Identity" onJump={() => onJumpToStep(0)}>
        <Row label="Batch Name" value={values.batchName} onClick={() => onJumpToStep(0)} incomplete={incompleteLabels.has("Batch Name")} scoreImpact={scoreImpactPct} />
        <Row label="Model Name" value={values.modelName} onClick={() => onJumpToStep(0)} ai={filledByAi.has("modelName")} incomplete={incompleteLabels.has("Model Name")} scoreImpact={scoreImpactPct} />
        <Row label="Market Region" value={values.marketRegion} onClick={() => onJumpToStep(0)} />
        <Row label="Manufacturing" value={`${values.manufacturingStartDate} → ${values.manufacturingEndDate}`} onClick={() => onJumpToStep(0)} incomplete={incompleteLabels.has("Manufacturing Start Date") || incompleteLabels.has("Manufacturing End Date")} scoreImpact={scoreImpactPct} />
        <Row label="Manufacturer" value={values.manufacturer} onClick={() => onJumpToStep(0)} ai={filledByAi.has("manufacturer")} incomplete={incompleteLabels.has("Manufacturer")} scoreImpact={scoreImpactPct} />
      </Section>

      {/* Specifications Summary */}
      <Section title="Specifications" onJump={() => onJumpToStep(0)}>
        <Row label="Chemistry" value={values.chemistry} onClick={() => onJumpToStep(0)} ai={filledByAi.has("chemistry")} incomplete={incompleteLabels.has("Chemistry")} scoreImpact={scoreImpactPct} />
        <Row label="Capacity" value={values.capacity} onClick={() => onJumpToStep(0)} ai={filledByAi.has("capacity")} incomplete={incompleteLabels.has("Capacity")} scoreImpact={scoreImpactPct} />
        <Row label="Voltage" value={values.voltage} onClick={() => onJumpToStep(0)} ai={filledByAi.has("voltage")} incomplete={incompleteLabels.has("Voltage")} scoreImpact={scoreImpactPct} />
        <Row label="Weight" value={values.weight} onClick={() => onJumpToStep(0)} ai={filledByAi.has("weight")} incomplete={incompleteLabels.has("Weight")} scoreImpact={scoreImpactPct} />
        {(isEUMode || values.marketRegion === "GLOBAL") && (
          <Row label="Battery Category" value={values.batteryCategory} onClick={() => onJumpToStep(0)} />
        )}
        <Row label="Material Total" value={`${matTotal.toFixed(1)}%`} warning={matTotal > 100 ? "Exceeds 100%" : undefined} onClick={() => onJumpToStep(0)} />
      </Section>

      {/* Compliance Summary */}
      {(isEUMode || values.marketRegion === "GLOBAL") && (
        <Section title="EU Compliance" onJump={() => onJumpToStep(1)}>
          <Row label="Carbon Footprint" value={values.carbonFootprint} onClick={() => onJumpToStep(1)} ai={filledByAi.has("carbonFootprint")} incomplete={incompleteLabels.has("Carbon Footprint")} scoreImpact={scoreImpactPct} />
          <Row label="Carbon Class" value={values.carbonPerformanceClass} onClick={() => onJumpToStep(1)} ai={filledByAi.has("carbonPerformanceClass")} incomplete={incompleteLabels.has("Carbon Class")} scoreImpact={scoreImpactPct} />
          <Row label="CE Marking" value={values.ceMarking ? "Yes" : "No"} onClick={() => onJumpToStep(1)} incomplete={incompleteLabels.has("CE Marking")} scoreImpact={scoreImpactPct} />
          <Row label="Notified Body" value={values.notifiedBodyNumber} onClick={() => onJumpToStep(1)} ai={filledByAi.has("notifiedBodyNumber")} incomplete={incompleteLabels.has("Notified Body")} scoreImpact={scoreImpactPct} />
          <Row label="EU Representative" value={values.euRepresentative} onClick={() => onJumpToStep(1)} ai={filledByAi.has("euRepresentative")} incomplete={incompleteLabels.has("EU Representative")} scoreImpact={scoreImpactPct} />
          <Row label="Lifetime" value={values.expectedLifetime ? `${values.expectedLifetime} cycles` : ""} onClick={() => onJumpToStep(1)} ai={filledByAi.has("expectedLifetime")} incomplete={incompleteLabels.has("Lifetime")} scoreImpact={scoreImpactPct} />
          <Row label="Warranty" value={values.warrantyMonths ? `${values.warrantyMonths} months` : ""} onClick={() => onJumpToStep(1)} ai={filledByAi.has("warrantyMonths")} incomplete={incompleteLabels.has("Warranty")} scoreImpact={scoreImpactPct} />
          <Row label="DoC Upload" value={values.docUploadUrl ? <span className="text-foreground flex items-center gap-1"><FileCheck className="h-3 w-3" /> Uploaded</span> : "Not uploaded"} onClick={() => onJumpToStep(1)} />
        </Section>
      )}

      {isIndiaMode && (
        <Section title="India Compliance" onJump={() => onJumpToStep(1)}>
          <Row label="HSN Code" value={values.hsnCode} onClick={() => onJumpToStep(1)} ai={filledByAi.has("hsnCode")} incomplete={incompleteLabels.has("HSN Code")} scoreImpact={scoreImpactPct} />
          <Row label="Cell Source" value={values.cellSource} onClick={() => onJumpToStep(1)} incomplete={incompleteLabels.has("Cell Source")} scoreImpact={scoreImpactPct} />
          <Row label="BIS Number" value={values.bisNumber} onClick={() => onJumpToStep(1)} ai={filledByAi.has("bisNumber")} incomplete={incompleteLabels.has("BIS Number")} scoreImpact={scoreImpactPct} />
          <Row label="EPR Number" value={values.eprNumber} onClick={() => onJumpToStep(1)} ai={filledByAi.has("eprNumber")} incomplete={incompleteLabels.has("EPR Number")} scoreImpact={scoreImpactPct} />
          <Row label="PLI Eligible" value={values.pliCompliant ? "Yes" : "No"} onClick={() => onJumpToStep(1)} />
          {values.cellSource === "IMPORTED" && (
            <>
              <Row label="Bill of Entry" value={values.billOfEntryNo} onClick={() => onJumpToStep(1)} />
              <Row label="Import Date" value={values.customsDate} onClick={() => onJumpToStep(1)} />
            </>
          )}
          {values.cellSource !== "IMPORTED" && values.dvaSource === "ESTIMATED" && values.salePrice && values.importCost && (
            <Row
              label="Estimated DVA"
              value={`${Math.max(0, ((parseFloat(values.salePrice) - parseFloat(values.importCost)) / parseFloat(values.salePrice)) * 100).toFixed(1)}%`}
              onClick={() => onJumpToStep(1)}
            />
          )}
        </Section>
      )}

      {/* Save as Template */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="saveAsTemplate"
            {...register("saveAsTemplate")}
            className="h-4 w-4 rounded border-border bg-transparent text-foreground focus:ring-foreground"
          />
          <Label htmlFor="saveAsTemplate" className="font-normal cursor-pointer flex items-center gap-2 text-foreground">
            <Save className="h-4 w-4 text-muted-foreground" />
            Save these settings as a new template
          </Label>
        </div>
        {values.saveAsTemplate && (
          <div className="pl-6">
            <Input
              {...register("templateName")}
              placeholder="Template name (e.g. E-Bike Standard Pack)"
              className={`max-w-sm bg-transparent border-border text-foreground ${errors.templateName ? "border-red-500" : ""}`}
            />
            {errors.templateName && <p className="text-xs text-red-500 mt-1">{errors.templateName.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
