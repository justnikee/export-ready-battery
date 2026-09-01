"use client";

import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseSoHPercent, updateStateOfHealth } from "@/lib/api/lifecycle";

interface ManualSoHEntryProps {
  passportUuid: string;
  currentSoH: number | null;
  onUpdated?: () => void;
  onCancel?: () => void;
}

export function ManualSoHEntry({
  passportUuid,
  currentSoH,
  onUpdated,
  onCancel,
}: ManualSoHEntryProps) {
  const [soh, setSoh] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const sohVal = parseSoHPercent(soh);
    if (sohVal === null) {
      toast.error("SoH must be between 0 and 100");
      return;
    }

    setSubmitting(true);
    try {
      await updateStateOfHealth(passportUuid, sohVal);
      toast.success("State of health updated");
      setSoh("");
      onUpdated?.();
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { error?: string } } };
      toast.error(apiErr?.response?.data?.error || "Failed to update SoH");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Declared SoH on this passport (0–100%). This is not a live BMS reading.
        {currentSoH != null ? ` Current: ${currentSoH}%.` : " No value set yet."}
      </p>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          State of health %
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="e.g. 92.5"
          value={soh}
          onChange={(e) => setSoh(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !soh}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          Save SoH
        </button>
      </div>
    </div>
  );
}
