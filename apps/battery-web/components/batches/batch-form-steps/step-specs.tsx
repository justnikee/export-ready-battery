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
import { Activity } from "lucide-react";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

const materialKeyLabels = [
  { key: "lithium" as const, label: "Lithium" },
  { key: "graphite" as const, label: "Graphite" },
  { key: "cobalt" as const, label: "Cobalt" },
  { key: "nickel" as const, label: "Nickel" },
  { key: "manganese" as const, label: "Manganese" },
];

export function StepSpecs() {
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
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="capacity">
            Rated Capacity <span className="text-red-500">*</span>
          </Label>
          <Input
            id="capacity"
            {...register("capacity")}
            placeholder="e.g. 5000mAh"
            className={errors.capacity ? "border-red-500" : ""}
          />
          {errors.capacity && (
            <p className="text-xs text-red-500">{errors.capacity.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="voltage">
            Voltage <span className="text-red-500">*</span>
          </Label>
          <Input
            id="voltage"
            {...register("voltage")}
            placeholder="e.g. 3.7V"
            className={errors.voltage ? "border-red-500" : ""}
          />
          {errors.voltage && (
            <p className="text-xs text-red-500">{errors.voltage.message}</p>
          )}
        </div>
      </div>

      {/* Weight & Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="weight">Weight</Label>
          <Input id="weight" {...register("weight")} placeholder="e.g. 500g" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="countryOfOrigin">Country of Origin</Label>
          <Input
            id="countryOfOrigin"
            {...register("countryOfOrigin")}
            maxLength={2}
            placeholder={isIndiaMode ? "IN" : "e.g. DE"}
            title="ISO 3166-1 alpha-2 country code (2 characters)"
          />
        </div>
      </div>

      {/* Material Composition */}
      <div className="p-4 border border-teal-200 bg-teal-50 space-y-4">
        <div className="flex items-center justify-between border-b border-teal-200 pb-2">
          <div className="flex items-center gap-2 text-teal-700 text-sm">
            <Activity className="h-4 w-4" />
            🧪 Material Composition (Chemistry Breakdown)
          </div>
          <div className={`text-xs font-mono ${matTotal > 100 ? "text-red-500" : "text-teal-600"}`}>
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
          className="h-4 w-4 rounded border-border bg-transparent text-teal-500 focus:ring-teal-500"
        />
        <Label htmlFor="recyclable" className="font-normal cursor-pointer text-foreground">
          Recyclable
        </Label>
      </div>
    </div>
  );
}
