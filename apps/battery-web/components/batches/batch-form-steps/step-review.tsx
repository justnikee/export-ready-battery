"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, FileCheck, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { AiBadge } from "@/components/batches/batch-form-steps/ai-badge";
import type { BatchFormData } from "@/components/batches/batch-form-schema";
import { batchCompletionChecks, completionBandLabel } from "@/lib/batch-completion";
import { CompletionRing } from "@/components/batches/wizard/completion-ring";

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

  // Profile readiness for selected market
  const profileReadiness = () => {
    if (!user) return null
    const items: { label: string; ready: boolean }[] = []
    if (isIndiaMode || values.marketRegion === "GLOBAL") {
      items.push({ label: "EPR Registration", ready: !!user.epr_registration_number?.trim() && (user.epr_status === "PENDING" || user.epr_status === "VERIFIED") })
      items.push({ label: "BIS Certification", ready: !!user.bis_r_number?.trim() && (user.bis_status === "PENDING" || user.bis_status === "VERIFIED") })
      items.push({ label: "IEC Code", ready: !!user.iec_code?.trim() })
    }
    if (isEUMode || values.marketRegion === "GLOBAL") {
      items.push({ label: "EU Representative", ready: !!user.eu_authorized_representative_name?.trim() && !!user.eu_contact_email?.trim() })
    }
    const readyCount = items.filter((i) => i.ready).length
    return { items, readyCount, total: items.length }
  }
  const readiness = profileReadiness()

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

      {/* Profile Readiness for Selected Market */}
      {readiness && readiness.total > 0 && (
        <div className={`p-3 border rounded text-sm ${readiness.readyCount === readiness.total ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="font-medium">Profile Readiness ({readiness.readyCount}/{readiness.total})</span>
            <Link href="/dashboard/settings?tab=compliance" className="text-xs underline hover:text-foreground ml-auto">
              Update in Settings
            </Link>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mb-2">
            <div
              className={`h-1.5 rounded-full transition-all ${readiness.readyCount === readiness.total ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${(readiness.readyCount / readiness.total) * 100}%` }}
            />
          </div>
          {readiness.items.some((i) => !i.ready) && (
            <ul className="text-xs space-y-0.5">
              {readiness.items.filter((i) => !i.ready).map((item) => (
                <li key={item.label} className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {item.label} — required for activation
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
