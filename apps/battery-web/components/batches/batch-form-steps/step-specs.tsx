"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Recycle } from "lucide-react";
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

const parseValueAndUnit = (str: string, defaultUnit: string) => {
  if (!str) return { value: "", unit: defaultUnit };
  const valMatch = str.match(/^\d+(\.\d+)?/);
  const unitMatch = str.match(/[a-zA-Z]+$/);
  return {
    value: valMatch ? valMatch[0] : "",
    unit: unitMatch ? unitMatch[0] : defaultUnit,
  };
};

interface StepSpecsProps {
  aiFilledFields?: Set<string>;
  settingsFilledFields?: Set<string>;
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

  const capacityStr = watch("capacity") || "";
  const voltageStr = watch("voltage") || "";
  const weightStr = watch("weight") || "";

  const capacity = parseValueAndUnit(capacityStr, "Ah");
  const voltage = parseValueAndUnit(voltageStr, "V");
  const weight = parseValueAndUnit(weightStr, "kg");

  const handleCapacityValueChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, "");
    setValue("capacity", cleanVal ? `${cleanVal}${capacity.unit}` : "", { shouldValidate: true, shouldDirty: true });
  };

  const handleCapacityUnitChange = (unit: string) => {
    setValue("capacity", capacity.value ? `${capacity.value}${unit}` : "", { shouldValidate: true, shouldDirty: true });
  };

  const handleVoltageValueChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, "");
    setValue("voltage", cleanVal ? `${cleanVal}${voltage.unit}` : "", { shouldValidate: true, shouldDirty: true });
  };

  const handleVoltageUnitChange = (unit: string) => {
    setValue("voltage", voltage.value ? `${voltage.value}${unit}` : "", { shouldValidate: true, shouldDirty: true });
  };

  const handleWeightValueChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, "");
    setValue("weight", cleanVal ? `${cleanVal}${weight.unit}` : "", { shouldValidate: true, shouldDirty: true });
  };

  const handleWeightUnitChange = (unit: string) => {
    setValue("weight", weight.value ? `${weight.value}${unit}` : "", { shouldValidate: true, shouldDirty: true });
  };

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

      {/* Battery Category — required for EU; used in India to apply AIS only to EV/LMT */}
      <div className="grid gap-2">
          <Label htmlFor="batteryCategory">
            Battery Category {isEUMode || marketRegion === "GLOBAL" ? <span className="text-red-500">*</span> : null}
            <span className="text-xs text-muted-foreground ml-1">
              {isEUMode || marketRegion === "GLOBAL" ? "(EU Reg. Art 2)" : "(AIS type-approval applies to EV/LMT)"}
            </span>
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

      {/* Capacity & Voltage */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="capacity" className="flex items-center gap-1.5 font-medium text-foreground">
            Rated Capacity <span className="text-red-500">*</span>
            {filledByAi.has("capacity") && <AiBadge />}
          </Label>
          <div className={`flex rounded-md overflow-hidden border bg-card/50 transition-all ${
            errors.capacity 
              ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20 focus-within:border-destructive" 
              : "border-border focus-within:ring-2 focus-within:ring-[var(--ring)]/25 focus-within:border-[var(--ring)]"
          }`}>
            <Input
              id="capacity"
              type="text"
              placeholder="e.g. 150"
              value={capacity.value}
              onChange={(e) => handleCapacityValueChange(e.target.value)}
              className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-r-none h-9 shadow-none font-medium ${aiFieldClass(filledByAi.has("capacity"))}`}
            />
            <Select value={capacity.unit} onValueChange={handleCapacityUnitChange}>
              <SelectTrigger className="w-[68px] px-2 border-y-0 border-r-0 border-l border-border bg-muted/20 text-muted-foreground focus:ring-0 focus:ring-offset-0 rounded-l-none h-9 font-semibold cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ah">Ah</SelectItem>
                <SelectItem value="mAh">mAh</SelectItem>
                <SelectItem value="Wh">Wh</SelectItem>
                <SelectItem value="kWh">kWh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.capacity && (
            <p className="text-xs text-red-500">{errors.capacity.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="voltage" className="flex items-center gap-1.5 font-medium text-foreground">
            Voltage <span className="text-red-500">*</span>
            {filledByAi.has("voltage") && <AiBadge />}
          </Label>
          <div className={`flex rounded-md overflow-hidden border bg-card/50 transition-all ${
            errors.voltage 
              ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20 focus-within:border-destructive" 
              : "border-border focus-within:ring-2 focus-within:ring-[var(--ring)]/25 focus-within:border-[var(--ring)]"
          }`}>
            <Input
              id="voltage"
              type="text"
              placeholder="e.g. 48"
              value={voltage.value}
              onChange={(e) => handleVoltageValueChange(e.target.value)}
              className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-r-none h-9 shadow-none font-medium ${aiFieldClass(filledByAi.has("voltage"))}`}
            />
            <div className="flex items-center justify-center w-[68px] border-y-0 border-r-0 border-l border-border bg-muted/20 text-muted-foreground h-9 font-semibold text-sm select-none">
              V
            </div>
          </div>
          {errors.voltage && (
            <p className="text-xs text-red-500">{errors.voltage.message}</p>
          )}
        </div>
      </div>

      {/* Weight & Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="weight" className="flex items-center gap-1.5 font-medium text-foreground">
            Weight
            {filledByAi.has("weight") && <AiBadge />}
          </Label>
          <div className="flex rounded-md overflow-hidden border border-border bg-card/50 focus-within:ring-2 focus-within:ring-[var(--ring)]/25 focus-within:border-[var(--ring)] transition-all">
            <Input
              id="weight"
              type="text"
              placeholder="e.g. 50"
              value={weight.value}
              onChange={(e) => handleWeightValueChange(e.target.value)}
              className={`flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-r-none h-9 shadow-none font-medium ${aiFieldClass(filledByAi.has("weight"))}`}
            />
            <Select value={weight.unit} onValueChange={handleWeightUnitChange}>
              <SelectTrigger className="w-[68px] px-2 border-y-0 border-r-0 border-l border-border bg-muted/20 text-muted-foreground focus:ring-0 focus:ring-offset-0 rounded-l-none h-9 font-semibold cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="g">g</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
      <div className="p-4 border border-border bg-card/15 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2 text-foreground text-sm font-medium">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Material Composition (Chemistry Breakdown)
          </div>
          <div className={`text-xs font-semibold font-mono ${matTotal > 100 ? "text-red-500" : "text-muted-foreground"}`}>
            Total: {matTotal.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            ...materialKeyLabels,
            { key: "lead" as const, label: "Lead" },
          ].map(({ key, label }) => (
            <div key={key} className="grid gap-1.5">
              <Label htmlFor={`mat-${key}`} className="text-[10px] font-semibold uppercase text-muted-foreground truncate" title={label}>
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
                className="h-8 text-xs bg-transparent border-border px-2.5 focus-visible:ring-1 focus-visible:ring-[var(--ring)]/30 focus-visible:border-[var(--ring)] rounded-md font-medium"
              />
            </div>
          ))}
        </div>

        {matTotal > 100 && (
          <p className="text-[10px] text-red-500">⚠️ Total percentage cannot exceed 100%.</p>
        )}
        {errors.materialComposition && typeof errors.materialComposition.message === "string" && (
          <p className="text-[10px] text-red-500">{errors.materialComposition.message}</p>
        )}
      </div>

      {/* Recyclable */}
      <div className="flex items-center space-x-3 bg-card/15 border border-border p-3.5 rounded-xl max-w-max transition-all hover:bg-card/25">
        <input
          type="checkbox"
          id="recyclable"
          {...register("recyclable")}
          className="h-4.5 w-4.5 rounded border-border bg-transparent text-[var(--brand)] focus:ring-[var(--brand)] transition-all cursor-pointer accent-[var(--brand)]"
        />
        <Label htmlFor="recyclable" className="flex items-center gap-2 font-medium cursor-pointer text-foreground text-sm select-none">
          <Recycle className="h-4 w-4 text-emerald-500" />
          Recyclable Battery Pack
        </Label>
      </div>
    </div>
  );
}
