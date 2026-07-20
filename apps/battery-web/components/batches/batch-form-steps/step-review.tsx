"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  FileCheck,
  AlertTriangle,
  ShieldCheck,
  CircleDot,
  Building2,
  Globe,
  Leaf,
  Shield,
  Calendar,
  Activity,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { AiBadge } from "@/components/batches/batch-form-steps/ai-badge";
import { calculateEstimatedDVA, type BatchFormData } from "@/components/batches/batch-form-schema";
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
  icon: Icon,
  onJump,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  onJump?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border/80 rounded-xl bg-card/15 overflow-hidden space-y-0.5">
      <div className="flex items-center justify-between bg-muted/20 px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground/75" />}
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h4>
        </div>
        {onJump && (
          <button
            type="button"
            onClick={onJump}
            className="text-[11px] text-[var(--brand)] hover:underline font-semibold cursor-pointer"
          >
            Edit Fields
          </button>
        )}
      </div>
      <div className="p-3.5 space-y-2 bg-transparent">{children}</div>
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
      <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
        {label}
        {ai && <AiBadge />}
      </span>
      <div className="text-right flex flex-col items-end">
        {incomplete ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">Add now →</span>
        ) : (
          <span className="font-semibold text-foreground">{value || <span className="text-muted-foreground/60 italic font-normal">—</span>}</span>
        )}
        {warning && (
          <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 justify-end font-medium">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            {warning}
          </p>
        )}
        {incomplete && scoreImpact ? (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5 justify-end font-medium">
            <AlertTriangle className="h-3 w-3" />
            +{scoreImpact}% completion score
          </p>
        ) : null}
      </div>
    </>
  );

  const wrapperClass = `flex justify-between items-center text-sm rounded-lg p-2.5 transition-all border border-transparent ${
    incomplete
      ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
      : "hover:bg-muted/30 border-b border-border/10 last:border-b-0"
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${wrapperClass} w-full text-left cursor-pointer`}
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
        dva = calculateEstimatedDVA(values);
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
        carbon_footprint: values.carbonFootprint,
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
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          Please fix the errors highlighted above before submitting.
        </div>
      )}

      {iecError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2.5 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Create Batch is disabled — an IEC Code is required for imported cells.</p>
            <div className="flex gap-3 mt-1.5">
              <button type="button" onClick={() => onJumpToStep(1)} className="text-xs underline hover:text-red-600 transition-colors font-medium">
                Back to Compliance
              </button>
              <Link href="/dashboard/settings?tab=compliance" className="text-xs underline hover:text-red-600 transition-colors font-medium">
                Add IEC Code in Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Batch completion score */}
      <div className="flex items-center gap-5 p-4 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-xl shadow-xs">
        <CompletionRing pct={completionPct} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {completionBandLabel(completionPct)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Batch profile completeness score</p>
          {nextBestAction && (
            <button
              type="button"
              onClick={() => onJumpToStep(nextBestAction.step)}
              className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Add {nextBestAction.label} to raise score to {nextBestActionProjectedPct}% — Add now →
            </button>
          )}
        </div>
      </div>

      {/* Activation readiness — what it takes to ACTIVATE this batch after creating it */}
      <div className={`border rounded-xl overflow-hidden ${
        canActivateNow
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      }`}>
        <div className="flex items-start gap-3.5 p-4">
          {canActivateNow ? (
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">
              {canActivateNow
                ? "Ready to activate right after creating"
                : `${activation.blocking.length} item${activation.blocking.length > 1 ? "s" : ""} needed before activation`}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Creating saves this as a <span className="font-semibold text-foreground bg-muted/40 px-1 py-0.5 rounded">draft</span>. To
              generate passports &amp; exports you&apos;ll <span className="font-semibold text-foreground bg-muted/40 px-1 py-0.5 rounded">activate</span> it
              — which uses <span className="font-semibold text-emerald-500">1 activation credit</span> and requires the items below.
            </p>
          </div>
        </div>

        {!canActivateNow && (
          <div className="border-t border-border/40 bg-card/10 px-4 py-3.5 space-y-3.5">
            {activationDataBlockers.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Complete on this batch
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                  {activationDataBlockers.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-foreground font-semibold">
                      <CircleDot className="h-3 w-3 shrink-0 text-amber-500/70" />
                      {formatBlockerLabel(b)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activationProfileBlockers.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Complete once in Settings
                  </div>
                  <Link
                    href="/dashboard/settings?tab=compliance"
                    className="text-[10px] text-[var(--brand)] underline hover:text-[var(--brand)]/85 font-semibold"
                  >
                    Open Settings
                  </Link>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                  {activationProfileBlockers.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CircleDot className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      {formatBlockerLabel(b)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="border-t border-border/40 bg-muted/10 px-4 py-3.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Next Steps Lifecycle
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <li className="flex items-center gap-2.5 p-2 bg-background/50 rounded-lg border border-border/30 font-medium">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">1</span>
              Saved as a draft
            </li>
            <li className="flex items-center gap-2.5 p-2 bg-background/50 rounded-lg border border-border/30 font-medium">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">2</span>
              Clear blocking items
            </li>
            <li className="flex items-center gap-2.5 p-2 bg-background/50 rounded-lg border border-border/30 font-medium">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">3</span>
              Activate & unlock passport
            </li>
          </ol>
        </div>
      </div>

      {/* Identity Summary */}
      <Section title="Identity" icon={Building2} onJump={() => onJumpToStep(0)}>
        <Row label="Batch Name" value={values.batchName} onClick={() => onJumpToStep(0)} incomplete={incompleteLabels.has("Batch Name")} scoreImpact={scoreImpactPct} />
        <Row label="Model Name" value={values.modelName} onClick={() => onJumpToStep(0)} ai={filledByAi.has("modelName")} incomplete={incompleteLabels.has("Model Name")} scoreImpact={scoreImpactPct} />
        <Row label="Market Region" value={values.marketRegion} onClick={() => onJumpToStep(0)} />
        <Row label="Manufacturing" value={`${values.manufacturingStartDate} → ${values.manufacturingEndDate}`} onClick={() => onJumpToStep(0)} incomplete={incompleteLabels.has("Manufacturing Start Date") || incompleteLabels.has("Manufacturing End Date")} scoreImpact={scoreImpactPct} />
        <Row label="Manufacturer" value={values.manufacturer} onClick={() => onJumpToStep(0)} ai={filledByAi.has("manufacturer")} incomplete={incompleteLabels.has("Manufacturer")} scoreImpact={scoreImpactPct} />
      </Section>

      {/* Specifications Summary */}
      <Section title="Specifications" icon={Activity} onJump={() => onJumpToStep(0)}>
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
        <Section title="EU Compliance" icon={Leaf} onJump={() => onJumpToStep(1)}>
          <Row label="Carbon Footprint" value={values.carbonFootprint} onClick={() => onJumpToStep(1)} ai={filledByAi.has("carbonFootprint")} incomplete={incompleteLabels.has("Carbon Footprint")} scoreImpact={scoreImpactPct} />
          <Row label="Carbon Class" value={values.carbonPerformanceClass} onClick={() => onJumpToStep(1)} ai={filledByAi.has("carbonPerformanceClass")} incomplete={incompleteLabels.has("Carbon Class")} scoreImpact={scoreImpactPct} />
          <Row label="CE Marking" value={values.ceMarking ? "Yes" : "No"} onClick={() => onJumpToStep(1)} incomplete={incompleteLabels.has("CE Marking")} scoreImpact={scoreImpactPct} />
          <Row label="Notified Body" value={values.notifiedBodyNumber} onClick={() => onJumpToStep(1)} ai={filledByAi.has("notifiedBodyNumber")} incomplete={incompleteLabels.has("Notified Body")} scoreImpact={scoreImpactPct} />
          <Row label="EU Representative" value={values.euRepresentative} onClick={() => onJumpToStep(1)} ai={filledByAi.has("euRepresentative")} incomplete={incompleteLabels.has("EU Representative")} scoreImpact={scoreImpactPct} />
          <Row label="Lifetime" value={values.expectedLifetime ? `${values.expectedLifetime} cycles` : ""} onClick={() => onJumpToStep(1)} ai={filledByAi.has("expectedLifetime")} incomplete={incompleteLabels.has("Lifetime")} scoreImpact={scoreImpactPct} />
          <Row label="Warranty" value={values.warrantyMonths ? `${values.warrantyMonths} months` : ""} onClick={() => onJumpToStep(1)} ai={filledByAi.has("warrantyMonths")} incomplete={incompleteLabels.has("Warranty")} scoreImpact={scoreImpactPct} />
          <Row label="DoC Upload" value={values.docUploadUrl ? <span className="text-foreground flex items-center gap-1"><FileCheck className="h-3.5 w-3.5 text-emerald-500" /> Uploaded</span> : "Not uploaded"} onClick={() => onJumpToStep(1)} />
        </Section>
      )}

      {isIndiaMode && (
        <Section title="India Compliance" icon={Shield} onJump={() => onJumpToStep(1)}>
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
          {values.cellSource !== "IMPORTED" && values.dvaSource === "ESTIMATED" && values.salePrice && (
            <Row
              label="Estimated DVA"
              value={`${calculateEstimatedDVA(values).toFixed(1)}%`}
              onClick={() => onJumpToStep(1)}
            />
          )}
        </Section>
      )}

      {/* Save as Template */}
      <div className="border-t border-border pt-5 space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="saveAsTemplate"
            {...register("saveAsTemplate")}
            className="h-4.5 w-4.5 rounded border-border bg-transparent text-[var(--brand)] focus:ring-[var(--brand)] cursor-pointer accent-[var(--brand)]"
          />
          <Label htmlFor="saveAsTemplate" className="font-semibold cursor-pointer flex items-center gap-2 text-foreground text-sm select-none">
            <Save className="h-4 w-4 text-[var(--brand)]" />
            Save these settings as a new template
          </Label>
        </div>
        {values.saveAsTemplate && (
          <div className="pl-6.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <Input
              {...register("templateName")}
              placeholder="Template name (e.g. E-Bike Standard Pack)"
              className={`max-w-sm bg-transparent border-border text-foreground h-9 rounded-md focus-visible:ring-1 focus-visible:ring-[var(--ring)]/30 focus-visible:border-[var(--ring)] ${errors.templateName ? "border-red-500" : ""}`}
            />
            {errors.templateName && <p className="text-xs text-red-500 mt-1">{errors.templateName.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
