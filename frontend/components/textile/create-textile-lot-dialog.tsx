"use client";

import { useEffect, useState } from "react";
import { Factory, Layers3 } from "lucide-react";
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

interface CreateTextileLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLotCreated: () => void;
  template?: {
    name: string;
    specs?: {
      material_profile?: string;
      chemistry?: string;
      lot_size?: string;
      production_stage?: string;
      country_of_origin?: string;
      certifications?: string[];
    };
  } | null;
}

export function CreateTextileLotDialog({
  open,
  onOpenChange,
  onLotCreated,
  template,
}: CreateTextileLotDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lotName, setLotName] = useState("");
  const [styleName, setStyleName] = useState("");
  const [materialProfile, setMaterialProfile] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [productionStage, setProductionStage] =
    useState<TextileProductionStage>("finished_goods");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [certifications, setCertifications] = useState<string[]>(
    user?.textile_certifications || [],
  );

  const resetForm = () => {
    setLotName("");
    setStyleName("");
    setMaterialProfile(user?.textile_default_fiber_types?.join(", ") || "");
    setLotSize("");
    setProductionStage("finished_goods");
    setCountryOfOrigin("");
    setCertifications(user?.textile_certifications || []);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!template) {
      resetForm();
      return;
    }

    setLotName(`${template.name} lot`);
    setStyleName(template.name);
    setMaterialProfile(
      template.specs?.material_profile || template.specs?.chemistry || "",
    );
    setLotSize(template.specs?.lot_size || "");
    setProductionStage(
      (template.specs?.production_stage as TextileProductionStage) ||
        "finished_goods",
    );
    setCountryOfOrigin(template.specs?.country_of_origin || "");
    setCertifications(
      template.specs?.certifications?.length
        ? template.specs.certifications
        : user?.textile_certifications || [],
    );
  }, [open, template, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_id) {
      return;
    }
    if (!lotName.trim() || !materialProfile.trim() || !countryOfOrigin.trim()) {
      toast.error("Lot name, material profile, and origin are required");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/batches", {
        tenant_id: user.tenant_id,
        batch_name: lotName.trim(),
        model_name: styleName.trim(),
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
          lot_size: lotSize.trim(),
          production_stage: productionStage,
          certifications,
        },
      });

      toast.success(`Lot "${lotName}" created`);
      resetForm();
      onOpenChange(false);
      onLotCreated();
    } catch (error: unknown) {
      console.error("Failed to create textile lot:", error);
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || "Failed to create lot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-cyan-600" />
            Create textile lot
          </DialogTitle>
          <DialogDescription>
            Record a textile production lot without falling back to battery
            batch language. The textile schema now stores material profile, lot
            size, and production stage as textile-native fields.
          </DialogDescription>
        </DialogHeader>

        {template ? (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-foreground">
            Prefilled from template{" "}
            <span className="font-medium">{template.name}</span>. Adjust the
            lot-specific details before saving.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="lot-name">Lot name</Label>
              <Input
                id="lot-name"
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                placeholder="e.g., AW26 Knitwear Lot 01"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="style-name">Style / SKU</Label>
              <Input
                id="style-name"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="e.g., Relaxed Tee"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lot-size">Lot size</Label>
              <Input
                id="lot-size"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="e.g., 4,500 units"
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="production-stage">Production stage</Label>
              <select
                id="production-stage"
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

            <div className="grid gap-2">
              <Label htmlFor="material-profile">Material profile</Label>
              <Input
                id="material-profile"
                value={materialProfile}
                onChange={(e) => setMaterialProfile(e.target.value)}
                placeholder="e.g., Organic cotton / recycled polyester"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="origin-country">Country of origin</Label>
              <Input
                id="origin-country"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="e.g., India"
                required
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Factory className="h-4 w-4 text-cyan-600" />
              <p className="text-sm font-medium text-foreground">
                Certifications carried into this lot
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
              {isLoading ? "Creating..." : "Create lot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
