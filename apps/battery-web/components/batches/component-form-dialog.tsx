"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { toast } from "sonner";
import api from "@/lib/api";

interface ComponentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  parentId?: string;
  editComponent?: ComponentFormData;
  onSaved: () => void;
}

export interface ComponentFormData {
  id?: string;
  component_type: string;
  name: string;
  model_number?: string;
  serial_number?: string;
  lot_number?: string;
  date_of_manufacture?: string;
  manufacturer?: string;
  manufacturer_address?: string;
  country_of_origin?: string;
  chemistry?: string;
  cobalt_pct?: number;
  lithium_pct?: number;
  nickel_pct?: number;
  manganese_pct?: number;
  graphite_pct?: number;
  lead_pct?: number;
  recycled_cobalt_pct?: number;
  recycled_lithium_pct?: number;
  recycled_nickel_pct?: number;
  recycled_lead_pct?: number;
  weight_kg?: number;
  ce_marking?: boolean;
  bis_number?: string;
  hazardous_lead?: boolean;
  hazardous_mercury?: boolean;
  hazardous_cadmium?: boolean;
}

const COMPONENT_TYPES = [
  { value: "pack", label: "Battery Pack" },
  { value: "module", label: "Module" },
  { value: "cell", label: "Cell" },
  { value: "subsystem", label: "Subsystem (BMS, Housing, etc.)" },
];

const CHEMISTRY_OPTIONS = [
  { value: "LFP", label: "LFP (Lithium Iron Phosphate)" },
  { value: "NMC", label: "NMC (Nickel Manganese Cobalt)" },
  { value: "NCA", label: "NCA (Nickel Cobalt Aluminum)" },
  { value: "LeadAcid", label: "Lead Acid" },
  { value: "SolidState", label: "Solid State" },
  { value: "NaIon", label: "Sodium Ion" },
  { value: "Other", label: "Other" },
];

export default function ComponentFormDialog({
  open,
  onOpenChange,
  batchId,
  parentId,
  editComponent,
  onSaved,
}: ComponentFormDialogProps) {
  const isEditing = !!editComponent?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ComponentFormData>({
    component_type: "cell",
    name: "",
    ce_marking: false,
    hazardous_lead: false,
    hazardous_mercury: false,
    hazardous_cadmium: false,
  });

  useEffect(() => {
    if (editComponent) {
      setForm(editComponent);
    } else {
      setForm({
        component_type: parentId ? "cell" : "pack",
        name: "",
        ce_marking: false,
        hazardous_lead: false,
        hazardous_mercury: false,
        hazardous_cadmium: false,
      });
    }
  }, [editComponent, parentId, open]);

  const updateField = <K extends keyof ComponentFormData>(key: K, value: ComponentFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Component name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, parent_id: parentId };
      if (isEditing) {
        await api.put(`/api/v1/components/${editComponent!.id}`, payload);
        toast.success("Component updated");
      } else {
        await api.post(`/api/v1/batches/${batchId}/components`, payload);
        toast.success("Component added");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? "Failed to update component" : "Failed to add component");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Component" : "Add Component"}</DialogTitle>
          <DialogDescription>
            {parentId
              ? "Add a child component (cell, module, or subsystem)."
              : "Add a top-level component to the BOM."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <Label>Component Type</Label>
            <Select
              value={form.component_type}
              onValueChange={(v) => updateField("component_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-name">Name *</Label>
                <Input
                  id="comp-name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. LFP Cell 3.2V 100Ah"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-model">Model Number</Label>
                <Input
                  id="comp-model"
                  value={form.model_number || ""}
                  onChange={(e) => updateField("model_number", e.target.value)}
                  placeholder="e.g. AR-100-LFP"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-serial">Serial Number</Label>
                <Input
                  id="comp-serial"
                  value={form.serial_number || ""}
                  onChange={(e) => updateField("serial_number", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-lot">Lot Number</Label>
                <Input
                  id="comp-lot"
                  value={form.lot_number || ""}
                  onChange={(e) => updateField("lot_number", e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Manufacturer */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Manufacturer</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-mfg">Manufacturer</Label>
                <Input
                  id="comp-mfg"
                  value={form.manufacturer || ""}
                  onChange={(e) => updateField("manufacturer", e.target.value)}
                  placeholder="e.g. Amara Raja"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-origin">Country of Origin</Label>
                <Input
                  id="comp-origin"
                  value={form.country_of_origin || ""}
                  onChange={(e) => updateField("country_of_origin", e.target.value)}
                  placeholder="e.g. India"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comp-mfg-addr">Manufacturer Address</Label>
              <Input
                id="comp-mfg-addr"
                value={form.manufacturer_address || ""}
                onChange={(e) => updateField("manufacturer_address", e.target.value)}
                placeholder="Full address"
              />
            </div>
          </div>

          <hr className="border-border" />

          {/* Chemistry */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Chemistry & Materials</h4>
            <Select
              value={form.chemistry || ""}
              onValueChange={(v) => updateField("chemistry", v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chemistry" />
              </SelectTrigger>
              <SelectContent>
                {CHEMISTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "cobalt_pct", label: "Co %" },
                { key: "lithium_pct", label: "Li %" },
                { key: "nickel_pct", label: "Ni %" },
                { key: "manganese_pct", label: "Mn %" },
                { key: "graphite_pct", label: "Graphite %" },
                { key: "lead_pct", label: "Lead %" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={String(form[field.key as keyof ComponentFormData] ?? "")}
                    onChange={(e) => updateField(field.key as keyof ComponentFormData, e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Recycled Content */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recycled Content (EU Art 8)</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "recycled_cobalt_pct", label: "Recycled Co %" },
                { key: "recycled_lithium_pct", label: "Recycled Li %" },
                { key: "recycled_nickel_pct", label: "Recycled Ni %" },
                { key: "recycled_lead_pct", label: "Recycled Pb %" },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={String(form[field.key as keyof ComponentFormData] ?? "")}
                    onChange={(e) => updateField(field.key as keyof ComponentFormData, e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Physical & Compliance */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Physical & Compliance</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-weight">Weight (kg)</Label>
                <Input
                  id="comp-weight"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.weight_kg ?? ""}
                  onChange={(e) => updateField("weight_kg", e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-bis">BIS Number</Label>
                <Input
                  id="comp-bis"
                  value={form.bis_number || ""}
                  onChange={(e) => updateField("bis_number", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.ce_marking || false}
                  onCheckedChange={(v) => updateField("ce_marking", v === true)}
                />
                <Label className="text-sm">CE Marking</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Hazardous Substances</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.hazardous_lead || false}
                    onCheckedChange={(v) => updateField("hazardous_lead", v === true)}
                  />
                  <Label className="text-xs">Lead</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.hazardous_mercury || false}
                    onCheckedChange={(v) => updateField("hazardous_mercury", v === true)}
                  />
                  <Label className="text-xs">Mercury</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.hazardous_cadmium || false}
                    onCheckedChange={(v) => updateField("hazardous_cadmium", v === true)}
                  />
                  <Label className="text-xs">Cadmium</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update" : "Add Component"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
