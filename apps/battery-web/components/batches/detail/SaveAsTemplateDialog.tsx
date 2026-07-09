"use client";

import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
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
import type { Batch } from "@/lib/types";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: Batch;
}

export function SaveAsTemplateDialog({ open, onOpenChange, batch }: SaveAsTemplateDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState(batch.batch_name ? `${batch.batch_name} Template` : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/templates", {
        tenant_id: user?.tenant_id,
        name: name.trim(),
        market_region: batch.market_region,
        product_type: batch.product_type || "BATTERY",
        specs: batch.specs,
      });
      toast.success(`Template "${name.trim()}" saved`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Saves this batch&apos;s specs ({batch.market_region} market) as a reusable template for future batches.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. LFP 50Ah EU Export"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
