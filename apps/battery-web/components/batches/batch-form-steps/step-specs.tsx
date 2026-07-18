"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity } from "lucide-react";
import { AiBadge, aiFieldClass } from "@/components/batches/batch-form-steps/ai-badge";
import { SettingsBadge } from "@/components/batches/batch-form-steps/settings-badge";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

const materialKeyLabels = [
  { key: "lithium" as const, label: "Lithium" },
  { key: "graphite" as const, label: "Graphite" },
  { key: "cobalt" as const, label: "Cobalt" },
  { key: "nickel" as const, label: "Nickel" },
  { key: "manganese" as const, label: "Manganese" },
];

interface StepSpecsProps {
  aiFilledFields?: Set<string>;
  settingsFilledFields?: Set<string>;
}

// Splits a stored "number + unit" string (e.g. "100Ah", "3.7 V") into its parts
// so the UI can edit the number and pick the unit separately.
function splitUnitValue(raw: string, units: string[], fallback: string) {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
  const unit = units.find((u) => u.toLowerCase() === m?.[2]?.toLowerCase()) ?? fallback;
  return { num: m?.[1] ?? "", unit };
}

// Number input + unit pill selector. The form value stays a single combined
// string (e.g. "100Ah") so drafts/templates/submission are unchanged.
function UnitNumberInput({
  name,
  id,
  units,
  defaultUnit,
  placeholder,
  hasError,
  aiFilled,
}: {
  name: "capacity" | "voltage" | "weight";
  id: string;
  units: string[];
  defaultUnit: string;
  placeholder?: string;
  hasError?: boolean;
  aiFilled?: boolean;
}) {
  const { register, setValue, control } = useFormContext<BatchFormData>();
  const value = (useWatch({ control, name }) as string | undefined) ?? "";
  const parsed = useMemo(() => splitUnitValue(value, units, defaultUnit), [value, units, defaultUnit]);
  const [text, setText] = useState(parsed.num);
  const [unit, setUnit] = useState(parsed.unit);
  const [editing, setEditing] = useState(false);

  // Re-sync when the value changes externally (AI fill, template load, draft
  // resume) — but never clobber what the user is currently typing.
  useEffect(() => {
    if (!editing) {
      setText(parsed.num);
      setUnit(parsed.unit);
    }
  }, [parsed.num, parsed.unit, editing]);

  const commit = (numText: string, nextUnit: string) => {
    const trimmed = numText.trim();
    setValue(name, trimmed === "" ? "" : `${trimmed}${nextUnit}`, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="flex gap-2 items-start">
      <input type="hidden" {...register(name)} />
      <Input
        id={id}
        value={text}
        inputMode="decimal"
        placeholder={placeholder}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          const t = e.target.value;
          if (!/^\d*\.?\d*$/.test(t)) return;
          setText(t);
          commit(t, unit);
        }}
        className={`flex-1 ${hasError ? "border-red-500" : ""} ${aiFieldClass(aiFilled ?? false)}`}
      />
      <div className="flex shrink-0 overflow-hidden rounded-md border border-border h-9">
        {units.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => {
              setUnit(u);
              commit(text, u);
            }}
            className={`px-2.5 text-xs transition-colors ${
              unit === u
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepSpecs({ aiFilledFields, settingsFilledFields }: StepSpecsProps = {}) {
  const filledByAi = aiFilledFields ?? new Set<string>();
  const filledBySettings = settingsFilledFields ?? new Set<string>();
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();

  const marketRegion = watch("marketRegion");
  const chemistry = watch("chemistry");
  const materialComposition = watch("materialComposition");
  const isEUMode = marketRegion === "EU";
  const isIndiaMode = marketRegion === "INDIA";

  const matTotal = (
    ["cobalt", "lithium", "nickel", "manganese", "graphite", "lead"] as const
  ).reduce((sum, key) => sum + (parseFloat(materialComposition[key]) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Chemistry */}
      <div className="grid gap-2">
        <Label htmlFor="chemistry">
          Chemistry <span className="text-red-500">*</span>
        </Label>
        <Select
          value={chemistry}
          onValueChange={(v) => setValue("chemistry", v as BatchFormData["chemistry"])}
        >
          <SelectTrigger id="chemistry">
            <SelectValue placeholder="Select chemistry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LFP">LFP — Lithium Iron Phosphate</SelectItem>
            <SelectItem value="NMC">NMC — Nickel Manganese Cobalt</SelectItem>
            <SelectItem value="NMC811">NMC811</SelectItem>
            <SelectItem value="NMC622">NMC622</SelectItem>
            <SelectItem value="NCA">NCA — Nickel Cobalt Aluminium</SelectItem>
            <SelectItem value="LCO">LCO — Lithium Cobalt Oxide</SelectItem>
            <SelectItem value="LTO">LTO — Lithium Titanate</SelectItem>
            <SelectItem value="LMO">LMO — Lithium Manganese Oxide</SelectItem>
            <SelectItem value="Sodium-ion">Sodium-ion</SelectItem>
            <SelectItem value="Li-ion">Li-ion (generic)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Battery Category (EU/GLOBAL) */}
      {(isEUMode || marketRegion === "GLOBAL") && (
        <div className="grid gap-2">
          <Label htmlFor="batteryCategory">
            Battery Category <span className="text-red-500">*</span>
            <span className="text-xs text-muted-foreground ml-1">(EU Reg. Art 2)</span>
          </Label>
          <Select
            value={watch("batteryCategory")}
            onValueChange={(v) => setValue("batteryCategory", v)}
          >
            <SelectTrigger id="batteryCategory" className={errors.batteryCategory ? "border-red-500" : ""}>
              <SelectValue placeholder="Select EU battery category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EV">EV — Electric Vehicle Battery</SelectItem>
              <SelectItem value="LMT">LMT — Light Means of Transport</SelectItem>
              <SelectItem value="INDUSTRIAL">Industrial Battery (&gt;2 kWh)</SelectItem>
              <SelectItem value="PORTABLE">Portable Battery</SelectItem>
              <SelectItem value="SLI">SLI — Starting, Lighting, Ignition</SelectItem>
            </SelectContent>
          </Select>
          {errors.batteryCategory && (
            <p className="text-xs text-red-500">{errors.batteryCategory.message}</p>
          )}
        </div>
      )}

      {/* Capacity & Voltage */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="grid gap-2">
          <Label htmlFor="capacity" className="flex items-center gap-1.5">
            Rated Capacity <span className="text-red-500">*</span>
            {filledByAi.has("capacity") && <AiBadge />}
          </Label>
          <UnitNumberInput
            name="capacity"
            id="capacity"
            units={["mAh", "Ah", "kWh"]}
            defaultUnit="Ah"
            placeholder="e.g. 100"
            hasError={!!errors.capacity}
            aiFilled={filledByAi.has("capacity")}
          />
          {errors.capacity && (
            <p className="text-xs text-red-500">{errors.capacity.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="voltage" className="flex items-center gap-1.5">
            Voltage <span className="text-red-500">*</span>
            {filledByAi.has("voltage") && <AiBadge />}
          </Label>
          <UnitNumberInput
            name="voltage"
            id="voltage"
            units={["V", "mV"]}
            defaultUnit="V"
            placeholder="e.g. 48"
            hasError={!!errors.voltage}
            aiFilled={filledByAi.has("voltage")}
          />
          {errors.voltage && (
            <p className="text-xs text-red-500">{errors.voltage.message}</p>
          )}
        </div>
      </div>

      {/* Weight & Country */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="grid gap-2">
          <Label htmlFor="weight" className="flex items-center gap-1.5">
            Weight
            {filledByAi.has("weight") && <AiBadge />}
          </Label>
          <UnitNumberInput
            name="weight"
            id="weight"
            units={["kg", "g"]}
            defaultUnit="kg"
            placeholder="e.g. 45"
            hasError={!!errors.weight}
            aiFilled={filledByAi.has("weight")}
          />
          {errors.weight && (
            <p className="text-xs text-red-500">{errors.weight.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="countryOfOrigin" className="flex items-center gap-1.5">
            Country of Origin
            {filledByAi.has("countryOfOrigin") && <AiBadge />}
            {filledBySettings.has("countryOfOrigin") && <SettingsBadge />}
          </Label>
          <Input
            id="countryOfOrigin"
            {...register("countryOfOrigin")}
            maxLength={2}
            placeholder={isIndiaMode ? "IN" : "e.g. DE"}
            title="ISO 3166-1 alpha-2 country code (2 characters)"
            className={aiFieldClass(filledByAi.has("countryOfOrigin"))}
          />
        </div>
      </div>

      {/* Material Composition */}
      <div className="p-4 border border-border bg-muted/30 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Material Composition (Chemistry Breakdown)
          </div>
          <div className={`text-xs font-mono ${matTotal > 100 ? "text-red-500" : "text-muted-foreground"}`}>
            Total: {matTotal.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {materialKeyLabels.map(({ key, label }) => (
            <div key={key} className="grid gap-1">
              <Label htmlFor={`mat-${key}`} className="text-[10px] uppercase text-muted-foreground truncate" title={label}>
                {label} %
              </Label>
              <Input
                id={`mat-${key}`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                {...register(`materialComposition.${key}` as const)}
                placeholder="0.0"
                className="h-8 text-xs bg-transparent border-border px-2"
              />
            </div>
          ))}
        </div>
        {/* Lead */}
        <div className="grid gap-1 max-w-[120px]">
          <Label htmlFor="mat-lead" className="text-[10px] uppercase text-muted-foreground">Lead %</Label>
          <Input
            id="mat-lead"
            type="number"
            min="0"
            max="100"
            step="0.1"
            {...register("materialComposition.lead")}
            placeholder="0.0"
            className="h-8 text-xs bg-transparent border-border px-2"
          />
        </div>

        {matTotal > 100 && (
          <p className="text-[10px] text-red-500">⚠️ Total percentage cannot exceed 100%.</p>
        )}
        {errors.materialComposition && typeof errors.materialComposition.message === "string" && (
          <p className="text-[10px] text-red-500">{errors.materialComposition.message}</p>
        )}
      </div>

      {/* Recyclable */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="recyclable"
          {...register("recyclable")}
          className="h-4 w-4 rounded border-border bg-transparent text-foreground focus:ring-foreground"
        />
        <Label htmlFor="recyclable" className="font-normal cursor-pointer text-foreground">
          Recyclable
        </Label>
      </div>
    </div>
  );
}
