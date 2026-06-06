"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, FileCheck, AlertTriangle } from "lucide-react";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded p-3 space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, warning }: { label: string; value: React.ReactNode; warning?: string }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="font-medium">{value || <span className="text-muted-foreground italic">—</span>}</span>
        {warning && <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end"><AlertTriangle className="h-3 w-3" />{warning}</p>}
      </div>
    </div>
  );
}

export function StepReview() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();

  const values = watch();
  const isEUMode = values.marketRegion === "EU";
  const isIndiaMode = values.marketRegion === "INDIA";
  const hasErrors = Object.keys(errors).length > 0;

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

      {/* Identity Summary */}
      <Section title="Identity">
        <Row label="Batch Name" value={values.batchName} />
        <Row label="Model Name" value={values.modelName} />
        <Row label="Market Region" value={values.marketRegion} />
        <Row label="Manufacturing" value={`${values.manufacturingStartDate} → ${values.manufacturingEndDate}`} />
        <Row label="Manufacturer" value={values.manufacturer} />
      </Section>

      {/* Specifications Summary */}
      <Section title="Specifications">
        <Row label="Chemistry" value={values.chemistry} />
        <Row label="Capacity" value={values.capacity} />
        <Row label="Voltage" value={values.voltage} />
        <Row label="Weight" value={values.weight} />
        {(isEUMode || values.marketRegion === "GLOBAL") && (
          <Row label="Battery Category" value={values.batteryCategory} />
        )}
        <Row label="Material Total" value={`${matTotal.toFixed(1)}%`} warning={matTotal > 100 ? "Exceeds 100%" : undefined} />
      </Section>

      {/* Compliance Summary */}
      {(isEUMode || values.marketRegion === "GLOBAL") && (
        <Section title="EU Compliance">
          <Row label="Carbon Footprint" value={values.carbonFootprint} />
          <Row label="Carbon Class" value={values.carbonPerformanceClass} />
          <Row label="CE Marking" value={values.ceMarking ? "Yes" : "No"} />
          <Row label="Notified Body" value={values.notifiedBodyNumber} />
          <Row label="EU Representative" value={values.euRepresentative} />
          <Row label="Lifetime" value={values.expectedLifetime ? `${values.expectedLifetime} cycles` : ""} />
          <Row label="Warranty" value={values.warrantyMonths ? `${values.warrantyMonths} months` : ""} />
          <Row label="DoC Upload" value={values.docUploadUrl ? <span className="text-foreground flex items-center gap-1"><FileCheck className="h-3 w-3" /> Uploaded</span> : "Not uploaded"} />
        </Section>
      )}

      {isIndiaMode && (
        <Section title="India Compliance">
          <Row label="HSN Code" value={values.hsnCode} />
          <Row label="Cell Source" value={values.cellSource} />
          <Row label="BIS Number" value={values.bisNumber} />
          <Row label="EPR Number" value={values.eprNumber} />
          <Row label="PLI Eligible" value={values.pliCompliant ? "Yes" : "No"} />
          {values.cellSource === "IMPORTED" && (
            <>
              <Row label="Bill of Entry" value={values.billOfEntryNo} />
              <Row label="Import Date" value={values.customsDate} />
            </>
          )}
          {values.cellSource !== "IMPORTED" && values.dvaSource === "ESTIMATED" && values.salePrice && values.importCost && (
            <Row
              label="Estimated DVA"
              value={`${Math.max(0, ((parseFloat(values.salePrice) - parseFloat(values.importCost)) / parseFloat(values.salePrice)) * 100).toFixed(1)}%`}
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
