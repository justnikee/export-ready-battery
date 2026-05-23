"use client";

import { useState } from "react";
import { FileStack, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TEXTILE_CERTIFICATION_OPTIONS,
  TEXTILE_PRODUCTION_STAGE_OPTIONS,
  type TextileProductionStage,
} from "@/lib/textile-profile";

interface CreateTextileTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateCreated: () => void;
}

export function CreateTextileTemplateDialog({
  open,
  onOpenChange,
  onTemplateCreated,
}: CreateTextileTemplateDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [materialProfile, setMaterialProfile] = useState("");
  const [baseLotSize, setBaseLotSize] = useState("");
  const [productionStage, setProductionStage] =
    useState<TextileProductionStage>("finished_goods");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [certifications, setCertifications] = useState<string[]>(
    user?.textile_certifications || [],
  );

  const resetForm = () => {
    setName("");
    setMaterialProfile(user?.textile_default_fiber_types?.join(", ") || "");
    setBaseLotSize("");
    setProductionStage("finished_goods");
    setCountryOfOrigin("");
    setCertifications(user?.textile_certifications || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_id) {
      return;
    }
    if (!name.trim() || !materialProfile.trim() || !countryOfOrigin.trim()) {
      toast.error("Template name, material profile, and origin are required");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/templates", {
        tenant_id: user.tenant_id,
        name: name.trim(),
        product_type: "TEXTILE",
        market_region: "GLOBAL",
        specs: {
          chemistry: "",
          voltage: "",
          capacity: "",
          manufacturer: user.company_name,
          weight: "",
          carbon_footprint: "",
          country_of_origin: countryOfOrigin.trim(),
          material_profile: materialProfile.trim(),
          lot_size: baseLotSize.trim(),
          production_stage: productionStage,
          certifications,
        },
      });

      toast.success(`Template "${name}" created`);
      resetForm();
      onOpenChange(false);
      onTemplateCreated();
    } catch (error: unknown) {
      console.error("Failed to create textile template:", error);
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(
        apiError.response?.data?.error || "Failed to create textile template",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            Create textile template
          </DialogTitle>
          <DialogDescription>
            Build reusable textile presets without inheriting the battery SKU
            editor. The textile schema now stores material profile, lot size,
            and production stage as textile-native fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., GOTS Jersey Tee"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template-material">Material profile</Label>
              <Input
                id="template-material"
                value={materialProfile}
                onChange={(e) => setMaterialProfile(e.target.value)}
                placeholder="e.g., 100% organic cotton"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template-lot-size">Default lot size</Label>
              <Input
                id="template-lot-size"
                value={baseLotSize}
                onChange={(e) => setBaseLotSize(e.target.value)}
                placeholder="e.g., 2,000 units"
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="template-stage">Production stage</Label>
              <select
                id="template-stage"
                value={productionStage}
                onChange={(e) =>
                  setProductionStage(e.target.value as TextileProductionStage)
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {TEXTILE_PRODUCTION_STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="template-origin">Country of origin</Label>
              <Input
                id="template-origin"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="e.g., India"
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileStack className="h-4 w-4 text-cyan-600" />
              <p className="text-sm font-medium text-foreground">
                Certifications bundled into the preset
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {TEXTILE_CERTIFICATION_OPTIONS.map((option) => {
                const selected = certifications.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setCertifications((prev) =>
                        selected
                          ? prev.filter((item) => item !== option.value)
                          : [...prev, option.value],
                      )
                    }
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "border-cyan-500 bg-cyan-500/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
