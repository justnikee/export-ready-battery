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
import api from "@/lib/api";
import { Loader2, Calculator, PackageSearch } from "lucide-react";

interface SchemeConfig {
  scheme_type: string;
  name: string;
  description: string;
  required_documents: string[];
  calculation_method: string;
  default_rate: number;
  help_url?: string;
}

import type { Batch } from "@/lib/types";

interface DGFTClaimFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function DGFTClaimFormDialog({
  open,
  onOpenChange,
  onSaved,
}: DGFTClaimFormDialogProps) {
  const [schemes, setSchemes] = useState<SchemeConfig[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [schemeType, setSchemeType] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [exportValue, setExportValue] = useState("");
  const [exportQuantity, setExportQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState<number | null>(null);

  // Batch auto-population
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const resetForm = useCallback(() => {
    setStep(1);
    setSchemeType("");
    setPeriodStart("");
    setPeriodEnd("");
    setHsnCode("");
    setDestinationCountry("");
    setExportValue("");
    setExportQuantity("");
    setNotes("");
    setEstimatedAmount(null);
    setSelectedBatchId("");
  }, []);

  useEffect(() => {
    if (open) {
      setLoadingSchemes(true);
      api.get("/dgft-claims/schemes")
        .then((res) => setSchemes(res.data.schemes || []))
        .catch(() => toast.error("Failed to load schemes"))
        .finally(() => setLoadingSchemes(false));

      // Fetch batches for auto-population
      setLoadingBatches(true);
      api.get("/batches")
        .then((res) => setBatches(res.data.batches || []))
        .catch(() => { /* silent — batch selector is optional */ })
        .finally(() => setLoadingBatches(false));

      resetForm();
    }
  }, [open, resetForm]);

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    // Auto-populate from batch specs
    if (batch.specs?.hsn_code) {
      setHsnCode(batch.specs.hsn_code);
    }
    if (batch.specs?.country_of_origin) {
      setDestinationCountry(batch.specs.country_of_origin);
    }
    if (batch.specs?.sale_price_inr && batch.specs.sale_price_inr > 0) {
      setExportValue(String(batch.specs.sale_price_inr));
    }
    if (batch.total_passports > 0) {
      setExportQuantity(String(batch.total_passports));
    }
  };

  const selectedScheme = schemes.find((s) => s.scheme_type === schemeType);

  const calculateEstimate = async () => {
    if (!schemeType || !exportValue) {
      toast.error("Select a scheme and enter export value");
      return;
    }
    try {
      const value = parseFloat(exportValue) || 0;
      const qty = parseFloat(exportQuantity) || 0;
      const rate = selectedScheme?.default_rate || 0;

      // Client-side estimate using the same logic as backend
      let amount = 0;
      switch (schemeType) {
        case "RODTEP":
        case "DUTY_DRAWBACK":
          amount = value * (rate / 100);
          break;
        case "INTEREST_EQUALIZATION":
          amount = value * (rate / 100) * 0.5;
          break;
      }
      setEstimatedAmount(Math.round(amount * 100) / 100);
    } catch {
      toast.error("Calculation failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeType || !periodStart || !periodEnd) {
      toast.error("Scheme and claim period are required");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        scheme_type: schemeType,
        claim_period_start: periodStart,
        claim_period_end: periodEnd,
        hsn_code: hsnCode,
        destination_country: destinationCountry,
        export_value_inr: parseFloat(exportValue) || 0,
        export_quantity: parseFloat(exportQuantity) || 0,
        notes,
      };
      if (selectedBatchId) {
        payload.batch_id = selectedBatchId;
      }
      await api.post("/dgft-claims", payload);
      toast.success("Claim draft created");
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create claim");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return schemeType !== "";
    if (step === 2) return periodStart !== "" && periodEnd !== "";
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New DGFT Claim</DialogTitle>
          <DialogDescription>
            Create an export incentive claim draft. You can submit it to DGFT after uploading supporting documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            {["Scheme", "Period", "Details", "Review"].map((label, idx) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                    step >= idx + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className={step >= idx + 1 ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
                {idx < 3 && <span className="text-muted-foreground mx-1">→</span>}
              </div>
            ))}
          </div>

          {/* Step 1: Select Scheme */}
          {step === 1 && (
            <div className="space-y-3">
              <Label>Export Incentive Scheme</Label>
              {loadingSchemes ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Loading schemes...</div>
              ) : (
                <div className="space-y-2">
                  {schemes.map((scheme) => (
                    <button
                      key={scheme.scheme_type}
                      type="button"
                      onClick={() => setSchemeType(scheme.scheme_type)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        schemeType === scheme.scheme_type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium text-sm">{scheme.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{scheme.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Rate: {scheme.default_rate}% · Method: {scheme.calculation_method.replace(/_/g, " ")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Claim Period */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="period-start">Period Start *</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="period-end">Period End *</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              {selectedScheme && (
                <div className="rounded-lg border border-border p-3 bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Required Documents
                  </div>
                  <ul className="mt-2 space-y-1">
                    {selectedScheme.required_documents.map((doc) => (
                      <li key={doc} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {doc.replace(/_/g, " ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Export Details */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Batch auto-population selector */}
              <div className="space-y-1.5">
                <Label htmlFor="batch-select">Link to Batch (optional)</Label>
                <Select value={selectedBatchId} onValueChange={handleBatchSelect}>
                  <SelectTrigger id="batch-select">
                    <SelectValue placeholder={loadingBatches ? "Loading batches..." : "Select a batch to auto-fill details"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None — manual entry</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batch_name} {batch.model_name ? `(${batch.model_name})` : ""}
                        {batch.specs?.hsn_code ? ` · HSN ${batch.specs.hsn_code}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBatchId && (
                  <p className="text-xs text-muted-foreground">
                    HSN, destination & export value auto-populated from batch.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hsn-code">HSN Code</Label>
                  <Input
                    id="hsn-code"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g. 8507.60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="destination">Destination Country</Label>
                  <Input
                    id="destination"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. DE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="export-value">Export Value (INR) *</Label>
                  <Input
                    id="export-value"
                    type="number"
                    min={0}
                    value={exportValue}
                    onChange={(e) => setExportValue(e.target.value)}
                    placeholder="FOB value in INR"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="export-qty">Export Quantity</Label>
                  <Input
                    id="export-qty"
                    type="number"
                    min={0}
                    value={exportQuantity}
                    onChange={(e) => setExportQuantity(e.target.value)}
                    placeholder="Units"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes for this claim..."
                />
              </div>

              <Button type="button" variant="outline" onClick={calculateEstimate} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Estimated Claim
              </Button>

              {estimatedAmount !== null && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Estimated Claim Amount</div>
                  <div className="text-lg font-semibold text-primary">
                    ₹{estimatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h4 className="text-sm font-medium">Claim Summary</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Scheme</div>
                  <div>{selectedScheme?.name || schemeType}</div>
                  <div className="text-muted-foreground">Period</div>
                  <div>{periodStart} → {periodEnd}</div>
                  <div className="text-muted-foreground">Linked Batch</div>
                  <div>{selectedBatchId ? batches.find((b) => b.id === selectedBatchId)?.batch_name || selectedBatchId.slice(0, 8) : "—"}</div>
                  <div className="text-muted-foreground">HSN Code</div>
                  <div>{hsnCode || "—"}</div>
                  <div className="text-muted-foreground">Destination</div>
                  <div>{destinationCountry || "—"}</div>
                  <div className="text-muted-foreground">Export Value</div>
                  <div>₹{parseFloat(exportValue || "0").toLocaleString("en-IN")}</div>
                  <div className="text-muted-foreground">Estimated Claim</div>
                  <div className="font-medium text-primary">
                    ₹{(estimatedAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                This creates a DRAFT claim. You must upload supporting documents before submitting to DGFT.
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Draft
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parseFloat(v: string): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
