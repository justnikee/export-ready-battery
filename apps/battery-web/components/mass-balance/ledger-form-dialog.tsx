"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  createLedger,
  updateLedger,
  type MassBalanceLedger,
  type MaterialType,
  MATERIAL_TYPE_LABELS,
} from "@/lib/api/mass-balance";

interface LedgerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  ledger: MassBalanceLedger | null;
  onSaved: () => void;
}

export default function LedgerFormDialog({
  open,
  onOpenChange,
  mode,
  ledger,
  onSaved,
}: LedgerFormDialogProps) {
  const [materialType, setMaterialType] = useState<MaterialType>("cobalt");
  const [incomingKg, setIncomingKg] = useState("");
  const [incomingSource, setIncomingSource] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Update mode fields
  const [incomingDelta, setIncomingDelta] = useState("");
  const [allocatedDelta, setAllocatedDelta] = useState("");

  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    if (mode === "create") {
      setMaterialType("cobalt");
      setIncomingKg("");
      setIncomingSource("");
      setCertificateUrl("");
      setNotes("");
    } else if (ledger) {
      setMaterialType(ledger.material_type);
      setIncomingSource(ledger.incoming_source);
      setCertificateUrl(ledger.certificate_url || "");
      setNotes(ledger.notes || "");
      setIncomingDelta("");
      setAllocatedDelta("");
    }
  }, [mode, ledger]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        const kg = parseFloat(incomingKg);
        if (!kg || kg <= 0) {
          toast.error("Incoming amount must be greater than 0");
          setSaving(false);
          return;
        }
        await createLedger({
          material_type: materialType,
          incoming_kg: kg,
          incoming_source: incomingSource || undefined,
          certificate_url: certificateUrl || undefined,
          notes: notes || undefined,
        });
        toast.success("Ledger created successfully");
      } else if (ledger) {
        const incDelta = parseFloat(incomingDelta) || 0;
        const allocDelta = parseFloat(allocatedDelta) || 0;
        if (incDelta === 0 && allocDelta === 0) {
          toast.error("At least one delta must be non-zero");
          setSaving(false);
          return;
        }
        await updateLedger(ledger.id, {
          incoming_delta: incDelta,
          allocated_delta: allocDelta,
        });
        toast.success("Ledger updated successfully");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to save ledger";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Mass Balance Ledger" : "Update Ledger"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record incoming recycled material stock."
              : `Adjust incoming or allocated amounts for ${MATERIAL_TYPE_LABELS[ledger?.material_type || "cobalt"]} ledger.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="material">Material Type</Label>
                <Select
                  value={materialType}
                  onValueChange={(v) => setMaterialType(v as MaterialType)}
                >
                  <SelectTrigger id="material">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]).map(
                      (mt) => (
                        <SelectItem key={mt} value={mt}>
                          {MATERIAL_TYPE_LABELS[mt]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incoming">Incoming Amount (kg)</Label>
                <Input
                  id="incoming"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 500.00"
                  value={incomingKg}
                  onChange={(e) => setIncomingKg(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Incoming Source</Label>
                <Input
                  id="source"
                  placeholder="e.g. Recycler EPR ID or ISCC certificate"
                  value={incomingSource}
                  onChange={(e) => setIncomingSource(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate">Certificate URL</Label>
                <Input
                  id="certificate"
                  type="url"
                  placeholder="https://..."
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional notes about this ledger entry..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Current incoming:</span>{" "}
                  <span className="font-medium">{ledger?.incoming_kg.toFixed(2)} kg</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Current allocated:</span>{" "}
                  <span className="font-medium">{ledger?.allocated_kg.toFixed(2)} kg</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Current balance:</span>{" "}
                  <span className="font-medium">{ledger?.balance_kg.toFixed(2)} kg</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incomingDelta">
                  Incoming Delta (kg)
                  <span className="text-muted-foreground font-normal ml-1">
                    — positive to add, negative to remove
                  </span>
                </Label>
                <Input
                  id="incomingDelta"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 100.00 or -50.00"
                  value={incomingDelta}
                  onChange={(e) => setIncomingDelta(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocatedDelta">
                  Allocated Delta (kg)
                  <span className="text-muted-foreground font-normal ml-1">
                    — positive to allocate, negative to de-allocate
                  </span>
                </Label>
                <Input
                  id="allocatedDelta"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25.00 or -10.00"
                  value={allocatedDelta}
                  onChange={(e) => setAllocatedDelta(e.target.value)}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {mode === "create" ? "Create Ledger" : "Update Ledger"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
