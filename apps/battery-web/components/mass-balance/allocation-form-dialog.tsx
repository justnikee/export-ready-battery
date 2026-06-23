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
import { toast } from "sonner";
import { Loader2, PackageSearch } from "lucide-react";
import api from "@/lib/api";
import type { Batch } from "@/lib/types";
import {
  createAllocation,
  type MassBalanceLedger,
  MATERIAL_TYPE_LABELS,
} from "@/lib/api/mass-balance";

interface AllocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ledger: MassBalanceLedger | null;
  onSaved: () => void;
}

export default function AllocationFormDialog({
  open,
  onOpenChange,
  ledger,
  onSaved,
}: AllocationFormDialogProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [allocatedKg, setAllocatedKg] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setBatchId("");
    setAllocatedKg("");
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
      setLoadingBatches(true);
      api
        .get("/batches")
        .then((res) => {
          const list: Batch[] = res.data.batches || [];
          setBatches(list);
        })
        .catch(() => toast.error("Failed to load batches"))
        .finally(() => setLoadingBatches(false));
    }
  }, [open, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledger) return;

    const kg = parseFloat(allocatedKg);
    if (!kg || kg <= 0) {
      toast.error("Allocation amount must be greater than 0");
      return;
    }
    if (kg > ledger.balance_kg) {
      toast.error(
        `Cannot allocate more than available balance (${ledger.balance_kg.toFixed(2)} kg)`
      );
      return;
    }
    if (!batchId) {
      toast.error("Please select a batch");
      return;
    }

    setSaving(true);
    try {
      await createAllocation({
        ledger_id: ledger.id,
        batch_id: batchId,
        material_type: ledger.material_type,
        allocated_kg: kg,
      });
      toast.success("Allocation created successfully");
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Failed to create allocation";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Allocate Material to Batch</DialogTitle>
          <DialogDescription>
            Allocate mass from{" "}
            <span className="font-medium">
              {MATERIAL_TYPE_LABELS[ledger?.material_type || "cobalt"]}
            </span>{" "}
            ledger to a product batch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {ledger && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Available balance:</span>{" "}
                <span className="font-semibold text-emerald-600">
                  {ledger.balance_kg.toFixed(2)} kg
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Source:</span>{" "}
                <span className="font-medium">{ledger.incoming_source}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger id="batch">
                <SelectValue placeholder="Select a batch..." />
              </SelectTrigger>
              <SelectContent>
                {loadingBatches ? (
                  <SelectItem value="__loading__" disabled>
                    Loading batches...
                  </SelectItem>
                ) : batches.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    No batches found
                  </SelectItem>
                ) : (
                  batches.map((b) => (
                    <SelectItem key={b.id} value={b.id} textValue={b.batch_name}>
                      <span className="flex items-center gap-2">
                        <PackageSearch className="w-3 h-3" />
                        {b.batch_name}
                        {b.model_name && (
                          <span className="text-muted-foreground">
                            ({b.model_name})
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Allocation Amount (kg)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={ledger?.balance_kg}
              placeholder={`Max ${ledger?.balance_kg.toFixed(2)} kg`}
              value={allocatedKg}
              onChange={(e) => setAllocatedKg(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount of recycled material to allocate to this batch.
            </p>
          </div>

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
              Allocate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
