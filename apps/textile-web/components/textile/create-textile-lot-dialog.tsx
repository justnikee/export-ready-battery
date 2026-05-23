"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Factory,
  Layers3,
  Globe,
  Flag,
  Leaf,
  Beaker,
  Droplets,
  Zap,
  Truck,
  ShieldCheck,
  Ruler,
  Palette,
  Package,
  Hash,
  Recycle,
  Timer,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TEXTILE_CERTIFICATION_OPTIONS,
  TEXTILE_PRODUCTION_STAGE_OPTIONS,
  type TextileProductionStage,
} from "@/lib/textile-profile";
import type { MarketRegion } from "@/lib/types";

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
      color?: string;
      dimensions?: string;
      packaging_type?: string;
      order_quantity?: number;
      gsm?: number;
      finish_type?: string[];
      dye_process?: string;
      water_usage_liters?: number;
      energy_usage_kwh?: number;
      biodegradable_pct?: number;
      expected_lifetime_washes?: number;
      recycled_content_pct?: number;
      fiber_origin?: string;
      fiber_composition?: Record<string, number>;
      supplier_tier?: Record<string, string>;
      labor_compliance?: Record<string, unknown>;
      chemical_compliance_zdhc?: Record<string, unknown>;
    };
  } | null;
}

const DYE_PROCESS_OPTIONS = [
  { value: "reactive", label: "Reactive" },
  { value: "vat", label: "Vat" },
  { value: "disperse", label: "Disperse" },
  { value: "acid", label: "Acid" },
  { value: "natural", label: "Natural" },
  { value: "pigment", label: "Pigment" },
  { value: "none", label: "None" },
  { value: "undyed", label: "Undyed" },
] as const;

const FINISH_TYPE_OPTIONS = [
  "mercerized",
  "brushed",
  "calendered",
  "peached",
  "sanforized",
  "bio-polished",
  "softened",
  "water_repellent",
  "anti_microbial",
  "uv_protected",
  "wrinkle_free",
] as const;

const CERTIFICATION_ALL_OPTIONS = [
  ...TEXTILE_CERTIFICATION_OPTIONS,
  { value: "FAIRTRADE", label: "Fairtrade" },
  { value: "SA8000", label: "SA8000" },
  { value: "ZDHC", label: "ZDHC" },
  { value: "CRADLE_TO_CRADLE", label: "Cradle to Cradle" },
  { value: "BLUESIGN", label: "bluesign" },
];

const FIBER_KEYS = [
  { key: "cotton_pct", label: "Cotton" },
  { key: "polyester_pct", label: "Polyester" },
  { key: "wool_pct", label: "Wool" },
  { key: "silk_pct", label: "Silk" },
  { key: "linen_pct", label: "Linen" },
  { key: "viscose_pct", label: "Viscose" },
  { key: "nylon_pct", label: "Nylon" },
  { key: "acrylic_pct", label: "Acrylic" },
  { key: "hemp_pct", label: "Hemp" },
  { key: "other_pct", label: "Other" },
] as const;

export function CreateTextileLotDialog({
  open,
  onOpenChange,
  onLotCreated,
  template,
}: CreateTextileLotDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Market region
  const [marketRegion, setMarketRegion] = useState<MarketRegion>("GLOBAL");

  // Basic Info
  const [lotName, setLotName] = useState("");
  const [styleName, setStyleName] = useState("");
  const [materialProfile, setMaterialProfile] = useState("");
  const [color, setColor] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [packagingType, setPackagingType] = useState("");

  // Fiber Composition
  const [fiberComp, setFiberComp] = useState<Record<string, string>>({});

  // Production
  const [productionStage, setProductionStage] =
    useState<TextileProductionStage>("finished_goods");
  const [gsm, setGsm] = useState("");
  const [finishTypes, setFinishTypes] = useState<string[]>([]);
  const [dyeProcess, setDyeProcess] = useState("");

  // Sustainability
  const [waterUsage, setWaterUsage] = useState("");
  const [energyUsage, setEnergyUsage] = useState("");
  const [biodegradablePct, setBiodegradablePct] = useState("");
  const [expectedLifetimeWashes, setExpectedLifetimeWashes] = useState("");
  const [recycledContentPct, setRecycledContentPct] = useState("");
  const [fiberOrigin, setFiberOrigin] = useState("");

  // Supply Chain
  const [fiberSupplier, setFiberSupplier] = useState("");
  const [spinningMill, setSpinningMill] = useState("");
  const [weavingKnittingMill, setWeavingKnittingMill] = useState("");
  const [dyeHouse, setDyeHouse] = useState("");
  const [finishingFacility, setFinishingFacility] = useState("");
  const [cutSewFacility, setCutSewFacility] = useState("");

  // Compliance
  const [certifications, setCertifications] = useState<string[]>([]);
  const [sa8000, setSa8000] = useState(false);
  const [bsci, setBsci] = useState(false);
  const [sedex, setSedex] = useState(false);
  const [fairTrade, setFairTrade] = useState(false);
  const [auditDate, setAuditDate] = useState("");
  const [auditScore, setAuditScore] = useState("");
  const [zdhcLevel, setZdhcLevel] = useState<"1" | "2" | "3" | "NA">("NA");
  const [mrslTested, setMrslTested] = useState(false);
  const [testReportUrl, setTestReportUrl] = useState("");

  // Origin
  const [countryOfOrigin, setCountryOfOrigin] = useState("");

  const resetForm = () => {
    setMarketRegion("GLOBAL");
    setLotName("");
    setStyleName("");
    setMaterialProfile(user?.textile_default_fiber_types?.join(", ") || "");
    setColor("");
    setDimensions("");
    setLotSize("");
    setOrderQuantity("");
    setPackagingType("");
    setFiberComp({});
    setProductionStage("finished_goods");
    setGsm("");
    setFinishTypes([]);
    setDyeProcess("");
    setWaterUsage("");
    setEnergyUsage("");
    setBiodegradablePct("");
    setExpectedLifetimeWashes("");
    setRecycledContentPct("");
    setFiberOrigin("");
    setFiberSupplier("");
    setSpinningMill("");
    setWeavingKnittingMill("");
    setDyeHouse("");
    setFinishingFacility("");
    setCutSewFacility("");
    setCertifications(user?.textile_certifications || []);
    setSa8000(false);
    setBsci(false);
    setSedex(false);
    setFairTrade(false);
    setAuditDate("");
    setAuditScore("");
    setZdhcLevel("NA");
    setMrslTested(false);
    setTestReportUrl("");
    setCountryOfOrigin("");
  };

  useEffect(() => {
    if (!open) return;

    if (!template) {
      resetForm();
      return;
    }

    setLotName(`${template.name} lot`);
    setStyleName(template.name);
    setMaterialProfile(
      template.specs?.material_profile || template.specs?.chemistry || "",
    );
    setColor(template.specs?.color || "");
    setDimensions(template.specs?.dimensions || "");
    setLotSize(template.specs?.lot_size || "");
    setOrderQuantity(template.specs?.order_quantity?.toString() || "");
    setPackagingType(template.specs?.packaging_type || "");
    setProductionStage(
      (template.specs?.production_stage as TextileProductionStage) ||
        "finished_goods",
    );
    setGsm(template.specs?.gsm?.toString() || "");
    setFinishTypes(template.specs?.finish_type || []);
    setDyeProcess(template.specs?.dye_process || "");
    setWaterUsage(template.specs?.water_usage_liters?.toString() || "");
    setEnergyUsage(template.specs?.energy_usage_kwh?.toString() || "");
    setBiodegradablePct(template.specs?.biodegradable_pct?.toString() || "");
    setExpectedLifetimeWashes(
      template.specs?.expected_lifetime_washes?.toString() || "",
    );
    setRecycledContentPct(
      template.specs?.recycled_content_pct?.toString() || "",
    );
    setFiberOrigin(template.specs?.fiber_origin || "");
    setCountryOfOrigin(template.specs?.country_of_origin || "");

    // Fiber composition
    if (template.specs?.fiber_composition) {
      const comp: Record<string, string> = {};
      for (const { key } of FIBER_KEYS) {
        const val = template.specs.fiber_composition[key];
        if (typeof val === "number") comp[key] = val.toString();
      }
      setFiberComp(comp);
    } else {
      setFiberComp({});
    }

    // Supplier tier
    if (template.specs?.supplier_tier) {
      const st = template.specs.supplier_tier;
      setFiberSupplier(st.fiber_supplier || "");
      setSpinningMill(st.spinning_mill || "");
      setWeavingKnittingMill(st.weaving_knitting_mill || "");
      setDyeHouse(st.dye_house || "");
      setFinishingFacility(st.finishing_facility || "");
      setCutSewFacility(st.cut_sew_facility || "");
    } else {
      setFiberSupplier("");
      setSpinningMill("");
      setWeavingKnittingMill("");
      setDyeHouse("");
      setFinishingFacility("");
      setCutSewFacility("");
    }

    // Labor compliance
    if (template.specs?.labor_compliance) {
      const lc = template.specs.labor_compliance;
      setSa8000(!!lc.sa8000_certified);
      setBsci(!!lc.bsci_audited);
      setSedex(!!lc.sedex_member);
      setFairTrade(!!lc.fair_trade_certified);
      setAuditDate(typeof lc.audit_date === "string" ? lc.audit_date : "");
      setAuditScore(
        typeof lc.audit_score === "number" ? lc.audit_score.toString() : "",
      );
    } else {
      setSa8000(false);
      setBsci(false);
      setSedex(false);
      setFairTrade(false);
      setAuditDate("");
      setAuditScore("");
    }

    // Chemical compliance
    if (template.specs?.chemical_compliance_zdhc) {
      const cc = template.specs.chemical_compliance_zdhc;
      setZdhcLevel(
        (cc.zdhc_level as "1" | "2" | "3" | "NA") || "NA",
      );
      setMrslTested(!!cc.mrsl_tested);
      setTestReportUrl(typeof cc.test_report_url === "string" ? cc.test_report_url : "");
    } else {
      setZdhcLevel("NA");
      setMrslTested(false);
      setTestReportUrl("");
    }

    setCertifications(
      template.specs?.certifications?.length
        ? template.specs.certifications
        : user?.textile_certifications || [],
    );
  }, [open, template, user]);

  const fiberTotal = useMemo(() => {
    return FIBER_KEYS.reduce(
      (sum, { key }) => sum + (parseFloat(fiberComp[key]) || 0),
      0,
    );
  }, [fiberComp]);

  const fiberTotalWarning =
    fiberTotal > 0 && fiberTotal !== 100
      ? `Total is ${fiberTotal.toFixed(1)}% — should be 0 or 100%`
      : null;

  const handleFiberChange = (key: string, value: string) => {
    setFiberComp((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCertification = (value: string) => {
    setCertifications((prev) =>
      prev.includes(value)
        ? prev.filter((c) => c !== value)
        : [...prev, value],
    );
  };

  const toggleFinishType = (value: string) => {
    setFinishTypes((prev) =>
      prev.includes(value)
        ? prev.filter((f) => f !== value)
        : [...prev, value],
    );
  };

  const validate = (): string | null => {
    if (!lotName.trim()) return "Lot name is required";
    if (fiberTotal > 0 && fiberTotal !== 100)
      return `Fiber composition total is ${fiberTotal.toFixed(1)}% — must be 0 or 100%`;
    if (gsm && (parseFloat(gsm) <= 0 || isNaN(parseFloat(gsm))))
      return "GSM must be a positive number";
    if (
      orderQuantity &&
      (parseInt(orderQuantity) <= 0 || isNaN(parseInt(orderQuantity)))
    )
      return "Order quantity must be a positive integer";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_id) return;

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);
    try {
      const fiber_composition: Record<string, number> = {};
      for (const { key } of FIBER_KEYS) {
        const val = parseFloat(fiberComp[key]);
        if (!isNaN(val) && val > 0) fiber_composition[key] = val;
      }

      const payload = {
        tenant_id: user.tenant_id,
        batch_name: lotName.trim(),
        model_name: styleName.trim(),
        product_type: "TEXTILE" as const,
        market_region: marketRegion,
        specs: {
          material_profile: materialProfile.trim(),
          color: color.trim() || undefined,
          dimensions: dimensions.trim() || undefined,
          lot_size: lotSize.trim() || undefined,
          order_quantity: parseInt(orderQuantity) || undefined,
          packaging_type: packagingType.trim() || undefined,
          fiber_composition:
            Object.keys(fiber_composition).length > 0
              ? fiber_composition
              : undefined,
          production_stage: productionStage,
          gsm: parseFloat(gsm) || undefined,
          finish_type: finishTypes.length > 0 ? finishTypes : undefined,
          dye_process: dyeProcess || undefined,
          water_usage_liters: parseFloat(waterUsage) || undefined,
          energy_usage_kwh: parseFloat(energyUsage) || undefined,
          biodegradable_pct: parseFloat(biodegradablePct) || undefined,
          expected_lifetime_washes:
            parseInt(expectedLifetimeWashes) || undefined,
          recycled_content_pct: parseFloat(recycledContentPct) || undefined,
          fiber_origin: fiberOrigin.trim() || undefined,
          supplier_tier: {
            fiber_supplier: fiberSupplier.trim() || undefined,
            spinning_mill: spinningMill.trim() || undefined,
            weaving_knitting_mill: weavingKnittingMill.trim() || undefined,
            dye_house: dyeHouse.trim() || undefined,
            finishing_facility: finishingFacility.trim() || undefined,
            cut_sew_facility: cutSewFacility.trim() || undefined,
          },
          certifications: certifications.length > 0 ? certifications : undefined,
          labor_compliance: {
            sa8000_certified: sa8000,
            bsci_audited: bsci,
            sedex_member: sedex,
            fair_trade_certified: fairTrade,
            audit_date: auditDate || undefined,
            audit_score: parseFloat(auditScore) || undefined,
          },
          chemical_compliance_zdhc: {
            zdhc_level: zdhcLevel,
            mrsl_tested: mrslTested,
            test_report_url: testReportUrl.trim() || undefined,
            restricted_substances_found: undefined,
          },
          manufacturer: user?.company_name || "",
          country_of_origin: countryOfOrigin.trim() || undefined,
          weight: "",
          carbon_footprint: "",
        },
      };

      await api.post("/batches", payload);

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

  const SectionCard = ({
    icon: Icon,
    title,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-600" />
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );

  const isIndia = marketRegion === "INDIA";
  const isEU = marketRegion === "EU";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-cyan-600" />
            Create textile lot
          </DialogTitle>
          <DialogDescription>
            Record a textile production lot with full schema compliance.
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
          {/* Market Region */}
          <SectionCard icon={Globe} title="Target Market">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMarketRegion("INDIA")}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  isIndia
                    ? "border-orange-500 bg-orange-500/10 text-orange-600"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flag className="mx-auto mb-1 h-5 w-5" />
                <div className="text-sm font-medium">India</div>
              </button>
              <button
                type="button"
                onClick={() => setMarketRegion("EU")}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  isEU
                    ? "border-blue-500 bg-blue-500/10 text-blue-600"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Leaf className="mx-auto mb-1 h-5 w-5" />
                <div className="text-sm font-medium">EU</div>
              </button>
              <button
                type="button"
                onClick={() => setMarketRegion("GLOBAL")}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  marketRegion === "GLOBAL"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="mx-auto mb-1 h-5 w-5" />
                <div className="text-sm font-medium">Global</div>
              </button>
            </div>
          </SectionCard>

          {/* Basic Info */}
          <SectionCard icon={Package} title="Basic Information">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="lot-name">
                  Lot name <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="material-profile">Material profile</Label>
                <Input
                  id="material-profile"
                  value={materialProfile}
                  onChange={(e) => setMaterialProfile(e.target.value)}
                  placeholder="e.g., Organic cotton / recycled polyester"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., Navy"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="e.g., 180cm x 120cm"
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

              <div className="grid gap-2">
                <Label htmlFor="order-quantity">Order quantity</Label>
                <Input
                  id="order-quantity"
                  type="number"
                  min={1}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  placeholder="e.g., 4500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="packaging-type">Packaging type</Label>
                <Input
                  id="packaging-type"
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                  placeholder="e.g., Polybag + carton"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="origin-country">Country of origin</Label>
                <Input
                  id="origin-country"
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  placeholder="e.g., India"
                />
              </div>
            </div>
          </SectionCard>

          {/* Fiber Composition */}
          <SectionCard icon={Recycle} title="Fiber Composition (%)">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {FIBER_KEYS.map(({ key, label }) => (
                <div key={key} className="grid gap-1.5">
                  <Label htmlFor={key} className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={fiberComp[key] || ""}
                    onChange={(e) => handleFiberChange(key, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <Badge
                  variant={fiberTotal === 100 || fiberTotal === 0 ? "default" : "destructive"}
                  className={
                    fiberTotal === 100 || fiberTotal === 0
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : ""
                  }
                >
                  {fiberTotal.toFixed(1)}%
                </Badge>
              </div>
              {fiberTotalWarning && (
                <span className="text-xs text-red-500">{fiberTotalWarning}</span>
              )}
            </div>
          </SectionCard>

          {/* Production */}
          <SectionCard icon={Factory} title="Production">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="production-stage">Production stage</Label>
                <Select
                  value={productionStage}
                  onValueChange={(v) =>
                    setProductionStage(v as TextileProductionStage)
                  }
                >
                  <SelectTrigger id="production-stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXTILE_PRODUCTION_STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gsm">GSM (g/m²)</Label>
                <Input
                  id="gsm"
                  type="number"
                  min={1}
                  step={0.1}
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value)}
                  placeholder="e.g., 180"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dye-process">Dye process</Label>
                <Select value={dyeProcess} onValueChange={setDyeProcess}>
                  <SelectTrigger id="dye-process">
                    <SelectValue placeholder="Select dye process" />
                  </SelectTrigger>
                  <SelectContent>
                    {DYE_PROCESS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label>Finish type</Label>
                <div className="flex flex-wrap gap-2">
                  {FINISH_TYPE_OPTIONS.map((ft) => {
                    const selected = finishTypes.includes(ft);
                    return (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => toggleFinishType(ft)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          selected
                            ? "border-cyan-500 bg-cyan-500/10 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {ft.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Sustainability */}
          <SectionCard icon={Droplets} title="Sustainability">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="water-usage">Water usage (liters)</Label>
                <Input
                  id="water-usage"
                  type="number"
                  min={0}
                  step={0.1}
                  value={waterUsage}
                  onChange={(e) => setWaterUsage(e.target.value)}
                  placeholder="e.g., 2500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="energy-usage">Energy usage (kWh)</Label>
                <Input
                  id="energy-usage"
                  type="number"
                  min={0}
                  step={0.1}
                  value={energyUsage}
                  onChange={(e) => setEnergyUsage(e.target.value)}
                  placeholder="e.g., 45"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="biodegradable">Biodegradable %</Label>
                <Input
                  id="biodegradable"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={biodegradablePct}
                  onChange={(e) => setBiodegradablePct(e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lifetime-washes">Expected lifetime (washes)</Label>
                <Input
                  id="lifetime-washes"
                  type="number"
                  min={1}
                  value={expectedLifetimeWashes}
                  onChange={(e) => setExpectedLifetimeWashes(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recycled-content">Recycled content %</Label>
                <Input
                  id="recycled-content"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={recycledContentPct}
                  onChange={(e) => setRecycledContentPct(e.target.value)}
                  placeholder="e.g., 25"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fiber-origin">Fiber origin</Label>
                <Input
                  id="fiber-origin"
                  value={fiberOrigin}
                  onChange={(e) => setFiberOrigin(e.target.value)}
                  placeholder="e.g., Turkey"
                />
              </div>
            </div>
          </SectionCard>

          {/* Supply Chain */}
          <SectionCard icon={Truck} title="Supply Chain">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fiber-supplier">Fiber supplier</Label>
                <Input
                  id="fiber-supplier"
                  value={fiberSupplier}
                  onChange={(e) => setFiberSupplier(e.target.value)}
                  placeholder="e.g., Lenzing AG"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="spinning-mill">Spinning mill</Label>
                <Input
                  id="spinning-mill"
                  value={spinningMill}
                  onChange={(e) => setSpinningMill(e.target.value)}
                  placeholder="e.g., Pacific Mills"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="weaving-mill">Weaving / knitting mill</Label>
                <Input
                  id="weaving-mill"
                  value={weavingKnittingMill}
                  onChange={(e) => setWeavingKnittingMill(e.target.value)}
                  placeholder="e.g., WeaveCraft Ltd"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dye-house">Dye house</Label>
                <Input
                  id="dye-house"
                  value={dyeHouse}
                  onChange={(e) => setDyeHouse(e.target.value)}
                  placeholder="e.g., ColorTech Dyeing"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="finishing-facility">Finishing facility</Label>
                <Input
                  id="finishing-facility"
                  value={finishingFacility}
                  onChange={(e) => setFinishingFacility(e.target.value)}
                  placeholder="e.g., FinishPro"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cut-sew">Cut & sew facility</Label>
                <Input
                  id="cut-sew"
                  value={cutSewFacility}
                  onChange={(e) => setCutSewFacility(e.target.value)}
                  placeholder="e.g., StitchWell Garments"
                />
              </div>
            </div>
          </SectionCard>

          {/* Compliance */}
          <SectionCard icon={ShieldCheck} title="Compliance">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Certifications</Label>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {CERTIFICATION_ALL_OPTIONS.map((option) => {
                    const selected = certifications.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleCertification(option.value)}
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

              <div className="rounded-xl border border-border bg-background p-3">
                <Label className="mb-2 block text-sm font-medium">
                  Labor compliance
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sa8000"
                      checked={sa8000}
                      onCheckedChange={(c) => setSa8000(!!c)}
                    />
                    <Label htmlFor="sa8000" className="text-sm font-normal">
                      SA8000 certified
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="bsci"
                      checked={bsci}
                      onCheckedChange={(c) => setBsci(!!c)}
                    />
                    <Label htmlFor="bsci" className="text-sm font-normal">
                      BSCI audited
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sedex"
                      checked={sedex}
                      onCheckedChange={(c) => setSedex(!!c)}
                    />
                    <Label htmlFor="sedex" className="text-sm font-normal">
                      SEDEX member
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="fair-trade"
                      checked={fairTrade}
                      onCheckedChange={(c) => setFairTrade(!!c)}
                    />
                    <Label htmlFor="fair-trade" className="text-sm font-normal">
                      Fair Trade certified
                    </Label>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="audit-date" className="text-xs text-muted-foreground">
                      Audit date
                    </Label>
                    <Input
                      id="audit-date"
                      type="date"
                      value={auditDate}
                      onChange={(e) => setAuditDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="audit-score" className="text-xs text-muted-foreground">
                      Audit score
                    </Label>
                    <Input
                      id="audit-score"
                      type="number"
                      min={0}
                      max={100}
                      value={auditScore}
                      onChange={(e) => setAuditScore(e.target.value)}
                      placeholder="e.g., 85"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-3">
                <Label className="mb-2 block text-sm font-medium">
                  Chemical compliance (ZDHC)
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="zdhc-level" className="text-xs text-muted-foreground">
                      ZDHC level
                    </Label>
                    <Select
                      value={zdhcLevel}
                      onValueChange={(v) =>
                        setZdhcLevel(v as "1" | "2" | "3" | "NA")
                      }
                    >
                      <SelectTrigger id="zdhc-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Level 1</SelectItem>
                        <SelectItem value="2">Level 2</SelectItem>
                        <SelectItem value="3">Level 3</SelectItem>
                        <SelectItem value="NA">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="mrsl"
                      checked={mrslTested}
                      onCheckedChange={(c) => setMrslTested(!!c)}
                    />
                    <Label htmlFor="mrsl" className="text-sm font-normal">
                      MRSL tested
                    </Label>
                  </div>
                </div>
                <div className="mt-3 grid gap-1.5">
                  <Label htmlFor="test-report-url" className="text-xs text-muted-foreground">
                    Test report URL
                  </Label>
                  <Input
                    id="test-report-url"
                    type="url"
                    value={testReportUrl}
                    onChange={(e) => setTestReportUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </SectionCard>

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
