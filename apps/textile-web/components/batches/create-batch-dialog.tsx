// TODO: big-bang split - battery branches were hardcoded to true; dead code should be removed in follow-up
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet as Dialog,
  SheetContent as DialogContent,
  SheetDescription as DialogDescription,
  SheetFooter as DialogFooter,
  SheetHeader as DialogHeader,
  SheetTitle as DialogTitle,
  SheetTrigger as DialogTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  PlusCircle,
  Sparkles,
  Save,
  Globe,
  Leaf,
  Flag,
  FileText,
  Calendar,
  Calculator,
  Shield,
  Activity,
  Users,
  FileCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import { dashboardPathFromPathname } from "@/lib/routes";

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL";
type CellSource = "IMPORTED" | "DOMESTIC" | "";
type DvaSource = "ESTIMATED" | "AUDITED";

type MaterialCompositionInput = {
  cobalt: string;
  lithium: string;
  nickel: string;
  manganese: string;
  graphite: string;
  lead: string;
  // Per-material recycled content (EU 2023/1542 Art. 8)
  recycled_cobalt: string;
  recycled_lithium: string;
  recycled_nickel: string;
  recycled_lead: string;
};

type HazardousSubstancesInput = {
  lead: boolean;
  mercury: boolean;
  cadmium: boolean;
};

type BatchPayload = {
  tenant_id: string;
  batch_name: string;
  model_name: string;
  manufacturing_start_date?: string;
  manufacturing_end_date?: string;
  market_region: MarketRegion;
  product_type?: string;
  specs: Record<string, unknown>;
  pli_compliant?: boolean;
  hsn_code?: string;
  dva_source?: DvaSource;
  audited_domestic_value_add?: number;
  pli_certificate_url?: string;
  domestic_value_add?: number;
  cell_source?: CellSource;
  bill_of_entry_no?: string;
  country_of_origin?: string;
  customs_date?: string;
  bis_number?: string;
  epr_number?: string;
};

interface Template {
  id: string;
  name: string;
  market_region: MarketRegion; // Product SKU: includes target market
  specs: {
    // Core specifications
    capacity: string;
    voltage: string;
    chemistry: string;
    battery_category?: string;
    manufacturer: string;
    weight: string;
    carbon_footprint: string;
    country_of_origin: string;
    recyclable?: boolean;

    // India PLI/Compliance Fields
    cell_source?: "IMPORTED" | "DOMESTIC" | "";
    domestic_value_add?: number;
    hsn_code?: string;
    bis_number?: string;
    epr_number?: string;
    sale_price_inr?: number;
    import_cost_inr?: number;

    // EU Battery Regulation Fields
    material_composition?: {
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
    };
    certifications?: string[];
    manufacturer_address?: string;
    eu_representative?: string;
    eu_representative_email?: string;
    expected_lifetime_cycles?: number;
    warranty_months?: number;
    recycled_content_pct?: number;
    hazardous_substances?: {
      lead_present?: boolean;
      mercury_present?: boolean;
      cadmium_present?: boolean;
    };
  };
}

interface CreateBatchDialogProps {
  onBatchCreated: () => void;
}

export function CreateBatchDialog({ onBatchCreated }: CreateBatchDialogProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isTextile = true;
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [fieldsAnimating, setFieldsAnimating] = useState(false);

  // ===== DUAL-MODE: Market Region =====
  const [marketRegion, setMarketRegion] = useState<MarketRegion>("INDIA");

  // Form states - Common
  const [batchName, setBatchName] = useState("");
  const [modelName, setModelName] = useState("");
  const [manufacturingStartDate, setManufacturingStartDate] = useState("");
  const [manufacturingEndDate, setManufacturingEndDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [voltage, setVoltage] = useState("");
  const [chemistry, setChemistry] = useState("LFP");
  const [batteryCategory, setBatteryCategory] = useState("");
    const [manufacturer, setManufacturer] = useState(user?.company_name || "");
  const [manufacturerAddress, setManufacturerAddress] = useState("");
  const [manufacturerEmail, setManufacturerEmail] = useState("");
  const [weight, setWeight] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [recyclable, setRecyclable] = useState(false);

  // Form states - EU Specific
  const [carbonFootprint, setCarbonFootprint] = useState("");
  const [certifications, setCertifications] = useState<string[]>(["CE"]);
  // New EU Compliance Fields
  const [materialComposition, setMaterialComposition] =
    useState<MaterialCompositionInput>({
      cobalt: "",
      lithium: "",
      nickel: "",
      manganese: "",
      graphite: "",
      lead: "",
      recycled_cobalt: "",
      recycled_lithium: "",
      recycled_nickel: "",
      recycled_lead: "",
    });
  const [recycledContent, setRecycledContent] = useState("");
  const [hazardousSubstances, setHazardousSubstances] =
    useState<HazardousSubstancesInput>({
      lead: false,
      mercury: false,
      cadmium: false,
    });
  const [hazardousDeclaration, setHazardousDeclaration] = useState("");
  const [euRepresentative, setEuRepresentative] = useState("");
  const [euRepresentativeEmail, setEuRepresentativeEmail] = useState("");
  const [expectedLifetime, setExpectedLifetime] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");

  // Form states - India Specific
  const [pliCompliant, setPliCompliant] = useState(false);
  // New Enterprise Fields for India
  const [hsnCode, setHsnCode] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [importCost, setImportCost] = useState("");

  const [cellSource, setCellSource] = useState<CellSource>("");
  // Form states - India Import/Customs Declaration
  const [billOfEntryNo, setBillOfEntryNo] = useState("");
  const [cellCountryOfOrigin, setCellCountryOfOrigin] = useState("");
  const [customsDate, setCustomsDate] = useState("");

  // DVA Audit Compliance
  const [dvaSource, setDvaSource] = useState<DvaSource>("ESTIMATED");
  const [auditedDva, setAuditedDva] = useState("");

  // File Upload State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // IEC Validation State
  const [iecError, setIecError] = useState(false);

  // Form states - Textile Specific
  const [materialProfile, setMaterialProfile] = useState("");
  const [gsm, setGsm] = useState("");
  const [dyeProcess, setDyeProcess] = useState("");
  const [color, setColor] = useState("");
  const [textileCertifications, setTextileCertifications] = useState<string[]>([]);
  const [waterUsage, setWaterUsage] = useState("");
  const [energyUsage, setEnergyUsage] = useState("");
  const [biodegradableContent, setBiodegradableContent] = useState("");

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Batch-level India Compliance Fields
  const [bisNumber, setBisNumber] = useState("");
  const [eprNumber, setEprNumber] = useState("");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get(`/templates?tenant_id=${user.tenant_id}`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  }, [user]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  // Set default certifications when market region changes
  useEffect(() => {
    if (marketRegion === "INDIA") {
      setCertifications((prev) => {
        const indiaCerts = ["AIS-156", "AIS-038"];
        const merged = Array.from(
          new Set([...prev.filter((c) => !["CE"].includes(c)), ...indiaCerts]),
        );
        return merged;
      });
    } else if (marketRegion === "EU") {
      setCertifications((prev) => {
        if (!prev.includes("CE")) return ["CE"];
        return prev;
      });
    } else if (marketRegion === "GLOBAL") {
      setCertifications((prev) =>
        prev.filter((c) => !["AIS-156", "AIS-038", "BIS", "CE"].includes(c)),
      );
    }
  }, [marketRegion]);

  // Auto-disable PLI and validate IEC for IMPORTED cells
  useEffect(() => {
    if (cellSource === "IMPORTED") {
      // Auto-disable PLI compliance for imported cells
      setPliCompliant(false);

      // Check IEC code
      if (!user?.iec_code) {
        setIecError(true);
      } else {
        setIecError(false);
      }
    } else {
      setIecError(false);
    }
  }, [cellSource, user?.iec_code]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);

    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFieldsAnimating(true);
      setTimeout(() => setFieldsAnimating(false), 300);

      // Auto-switch market region based on template (Product SKU feature)
      if (template.market_region) {
        setMarketRegion(template.market_region);
      }

      // Core specifications
      setCapacity(template.specs.capacity || "");
      setVoltage(template.specs.voltage || "");
      setChemistry(template.specs.chemistry || "LFP");
      setBatteryCategory(template.specs.battery_category || "");
      setManufacturer(template.specs.manufacturer || user?.company_name || "");
      setWeight(template.specs.weight || "");
      setCarbonFootprint(template.specs.carbon_footprint || "");
      setCountryOfOrigin(template.specs.country_of_origin || "");
      setRecyclable(template.specs.recyclable || false);

      // India PLI/Compliance Fields
      if (template.specs.cell_source) {
        setCellSource(template.specs.cell_source);
      }
      if (template.specs.domestic_value_add) {
        // DVA is stored as estimated, allow user to override
        setDvaSource("ESTIMATED");
      }
      if (template.specs.hsn_code) {
        setHsnCode(template.specs.hsn_code);
      }
      if (template.specs.bis_number) {
        setBisNumber(template.specs.bis_number);
      }
      if (template.specs.epr_number) {
        setEprNumber(template.specs.epr_number);
      }
      if (template.specs.sale_price_inr) {
        setSalePrice(template.specs.sale_price_inr.toString());
      }
      if (template.specs.import_cost_inr) {
        setImportCost(template.specs.import_cost_inr.toString());
      }
      // NOTE: billOfEntryNo is NOT loaded - it's dynamic per shipment

      // EU Battery Regulation Fields
      if (template.specs.material_composition) {
        const mc = template.specs.material_composition;
        setMaterialComposition({
          cobalt: mc.cobalt_pct?.toString() || "",
          lithium: mc.lithium_pct?.toString() || "",
          nickel: mc.nickel_pct?.toString() || "",
          manganese: mc.manganese_pct?.toString() || "",
          graphite: mc.graphite_pct?.toString() || "",
          lead: mc.lead_pct?.toString() || "",
          recycled_cobalt: mc.recycled_cobalt_pct?.toString() || "",
          recycled_lithium: mc.recycled_lithium_pct?.toString() || "",
          recycled_nickel: mc.recycled_nickel_pct?.toString() || "",
          recycled_lead: mc.recycled_lead_pct?.toString() || "",
        });
      }
      if (template.specs.certifications) {
        setCertifications(template.specs.certifications);
      }
      if (template.specs.manufacturer_address) {
        setManufacturerAddress(template.specs.manufacturer_address);
      }
      if (template.specs.eu_representative) {
        setEuRepresentative(template.specs.eu_representative);
      }
      if (template.specs.eu_representative_email) {
        setEuRepresentativeEmail(template.specs.eu_representative_email);
      }
      if (template.specs.expected_lifetime_cycles) {
        setExpectedLifetime(template.specs.expected_lifetime_cycles.toString());
      }
      if (template.specs.warranty_months) {
        setWarrantyMonths(template.specs.warranty_months.toString());
      }
      if (template.specs.recycled_content_pct) {
        setRecycledContent(template.specs.recycled_content_pct.toString());
      }
      if (template.specs.hazardous_substances) {
        const hs = template.specs.hazardous_substances;
        setHazardousSubstances({
          lead: hs.lead_present || false,
          mercury: hs.mercury_present || false,
          cadmium: hs.cadmium_present || false,
        });
      }

      toast.success(
        `Loaded "${template.name}" template (${template.market_region || "GLOBAL"} market)`,
      );
    }
  };

  const handleCertificateUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedBatchName =
        batchName.replace(/[^a-zA-Z0-9-]/g, "_") || "unnamed";
      const filePath = `certificates/${user.tenant_id}/${sanitizedBatchName}_${timestamp}.pdf`;

      // Simulate progress (Supabase doesn't provide real-time progress)
      setUploadProgress(30);

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("compliance-docs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false, // Prevent overwriting
        });

      if (error) throw error;

      setUploadProgress(70);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("compliance-docs").getPublicUrl(filePath);

      setUploadProgress(100);
      setUploadedFileUrl(publicUrl);
      clearFieldError("certificate");
      toast.success("Certificate uploaded successfully");
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const uploadError = error as { message?: string };
      toast.error(uploadError.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!batchName.trim()) errors.name = isTextile ? "Lot name is required" : "Batch name is required";
    if (!modelName.trim()) errors.modelName = "Model name is required";
    if (!manufacturingStartDate)
      errors.mfgStart = "Manufacturing start date is required";
    if (!manufacturingEndDate)
      errors.mfgEnd = "Manufacturing end date is required";
    if (
      manufacturingStartDate &&
      manufacturingEndDate &&
      new Date(manufacturingEndDate) < new Date(manufacturingStartDate)
    ) {
      errors.mfgEnd = "End date must be on or after start date";
    }
    if (!manufacturer.trim()) errors.manufacturer = "Manufacturer is required";

    if (!isTextile) {
      if (!capacity.trim()) errors.capacity = "Capacity is required";
      if (!voltage.trim()) errors.voltage = "Voltage is required";

      if (marketRegion === "EU" || marketRegion === "GLOBAL") {
        if (!batteryCategory)
          errors.batteryCategory =
            "Battery category is required for EU compliance (Art. 3)";
      }

      if (marketRegion === "INDIA") {
        if (!cellSource)
          errors.cellSource = "Cell source is required for India compliance";
        if (!hsnCode.trim()) {
          errors.hsnCode = "HSN Code is required for India";
        } else if (!hsnCode.startsWith("8507")) {
          errors.hsnCode =
            'HSN Code must start with "8507" (Li-ion accumulators)';
        }
        if (cellSource === "IMPORTED") {
          if (!user?.iec_code)
            errors.iecBanner =
              "IEC Code is required for imported cells — add it in Organization Settings";
          if (!billOfEntryNo.trim())
            errors.billOfEntry =
              "Bill of Entry No. is required for imported cells";
          if (!cellCountryOfOrigin.trim() || cellCountryOfOrigin.length < 2)
            errors.cellCountryOfOrigin =
              "Cell country of origin required (2-letter ISO code)";
          if (!customsDate)
            errors.customsDate = "Import date is required for imported cells";
        }
        if (cellSource !== "IMPORTED" && dvaSource === "AUDITED") {
          if (!auditedDva.trim()) {
            errors.auditedDva = "Audited DVA % is required";
          } else {
            const dva = parseFloat(auditedDva);
            if (isNaN(dva) || dva < 0 || dva > 100) {
              errors.auditedDva = "Audited DVA must be between 0 and 100";
            }
          }
          if (!uploadedFileUrl)
            errors.certificate =
              "CA Certificate upload is required for audited mode";
        }
      }

      const matTotal = (
        ["cobalt", "lithium", "nickel", "manganese", "graphite", "lead"] as const
      ).reduce(
        (sum, key) => sum + (parseFloat(materialComposition[key]) || 0),
        0,
      );
      if (matTotal > 100) {
        errors.materialTotal = `Material composition total is ${matTotal.toFixed(1)}% — cannot exceed 100%`;
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all fields at once with inline errors
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const idMap: Record<string, string> = {
        name: "name",
        modelName: "modelName",
        mfgStart: "mfgStart",
        mfgEnd: "mfgEnd",
        manufacturer: "manufacturer",
        capacity: "capacity",
        voltage: "voltage",
        batteryCategory: "batteryCategory",
        cellSource: "cellSource",
        hsnCode: "hsnCode",
        billOfEntry: "billOfEntry",
        cellCountryOfOrigin: "cellCountryOfOrigin",
        customsDate: "customsDate",
        auditedDva: "auditedDva",
      };
      const firstKey = Object.keys(errors)[0];
      const elementId = idMap[firstKey];
      if (elementId) {
        setTimeout(
          () =>
            document
              .getElementById(elementId)
              ?.scrollIntoView({ behavior: "smooth", block: "center" }),
          50,
        );
      }
      return;
    }

    setIsLoading(true);
    try {
      // Build the request payload
      const payload: BatchPayload = {
        tenant_id: user.tenant_id,
        batch_name: batchName,
        model_name: modelName,
        manufacturing_start_date: manufacturingStartDate || undefined,
        manufacturing_end_date: manufacturingEndDate || undefined,
        market_region: marketRegion,
        product_type: user?.product_type || "TEXTILE",
        specs: {
          manufacturer,
          manufacturer_address: manufacturerAddress,
          manufacturer_email: manufacturerEmail,
          weight,
          country_of_origin: countryOfOrigin,
          recyclable,
        },
      };

      if (!isTextile) {
        payload.specs.capacity = capacity;
        payload.specs.voltage = voltage;
        payload.specs.chemistry = chemistry;
        payload.specs.battery_category = batteryCategory || undefined;

        // Add EU specific fields
        if (marketRegion === "EU" || marketRegion === "GLOBAL") {
          payload.specs.carbon_footprint = carbonFootprint;
          payload.specs.certifications = certifications;

          // Add new EU fields
          const materialPayload: {
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
          } = {
            cobalt_pct: materialComposition.cobalt
              ? parseFloat(materialComposition.cobalt)
              : undefined,
            lithium_pct: materialComposition.lithium
              ? parseFloat(materialComposition.lithium)
              : undefined,
            nickel_pct: materialComposition.nickel
              ? parseFloat(materialComposition.nickel)
              : undefined,
            manganese_pct: materialComposition.manganese
              ? parseFloat(materialComposition.manganese)
              : undefined,
            graphite_pct: materialComposition.graphite
              ? parseFloat(materialComposition.graphite)
              : undefined,
            lead_pct: materialComposition.lead
              ? parseFloat(materialComposition.lead)
              : undefined,
            recycled_cobalt_pct: materialComposition.recycled_cobalt
              ? parseFloat(materialComposition.recycled_cobalt)
              : undefined,
            recycled_lithium_pct: materialComposition.recycled_lithium
              ? parseFloat(materialComposition.recycled_lithium)
              : undefined,
            recycled_nickel_pct: materialComposition.recycled_nickel
              ? parseFloat(materialComposition.recycled_nickel)
              : undefined,
            recycled_lead_pct: materialComposition.recycled_lead
              ? parseFloat(materialComposition.recycled_lead)
              : undefined,
          };
          const hasMaterial = Object.values(materialPayload).some(
            (v) => typeof v === "number" && v > 0,
          );
          if (hasMaterial) {
            payload.specs.material_composition = materialPayload;
          }

          if (recycledContent !== "") {
            payload.specs.recycled_content_pct = parseFloat(recycledContent);
          }

          payload.specs.hazardous_substances = {
            lead_present: hazardousSubstances.lead,
            mercury_present: hazardousSubstances.mercury,
            cadmium_present: hazardousSubstances.cadmium,
            declaration: hazardousDeclaration,
          };

          payload.specs.eu_representative = euRepresentative;
          payload.specs.eu_representative_email = euRepresentativeEmail;
          if (expectedLifetime !== "") {
            payload.specs.expected_lifetime_cycles = parseInt(expectedLifetime);
          }
          if (warrantyMonths !== "") {
            payload.specs.warranty_months = parseInt(warrantyMonths);
          }
        }

        // Add India-specific fields
        if (marketRegion === "INDIA") {
          payload.specs.certifications = certifications;
          payload.pli_compliant = pliCompliant;
          payload.hsn_code = hsnCode;
          payload.dva_source = dvaSource;

          if (dvaSource === "AUDITED") {
            const auditedVal = parseFloat(auditedDva) || 0;
            payload.audited_domestic_value_add = auditedVal;
            payload.pli_certificate_url = uploadedFileUrl ?? undefined;
          } else {
            const sale = parseFloat(salePrice) || 0;
            const cost = parseFloat(importCost) || 0;
            payload.specs.sale_price_inr = sale;
            payload.specs.import_cost_inr = cost;
            const calculatedDva = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
            payload.domestic_value_add = Math.max(0, calculatedDva);
          }

          payload.cell_source = cellSource || undefined;
          if (cellSource === "IMPORTED") {
            payload.bill_of_entry_no = billOfEntryNo;
            payload.country_of_origin = cellCountryOfOrigin;
            payload.customs_date = customsDate;
          }

          if (bisNumber) payload.bis_number = bisNumber;
          if (eprNumber) payload.epr_number = eprNumber;
        }
      } else {
        // Textile-specific payload
        payload.specs.material_profile = materialProfile || undefined;
        payload.specs.gsm = gsm ? parseFloat(gsm) : undefined;
        payload.specs.dye_process = dyeProcess || undefined;
        payload.specs.color = color || undefined;
        payload.specs.certifications = textileCertifications;
        if (waterUsage !== "") {
          payload.specs.water_usage_liters = parseFloat(waterUsage);
        }
        if (energyUsage !== "") {
          payload.specs.energy_usage_kwh = parseFloat(energyUsage);
        }
        if (recycledContent !== "") {
          payload.specs.recycled_content_pct = parseFloat(recycledContent);
        }
        if (biodegradableContent !== "") {
          payload.specs.biodegradable_pct = parseFloat(biodegradableContent);
        }
      }

      await api.post("/batches", payload);

      // Save as template if checkbox is checked (Product SKU feature)
      if (saveAsTemplate && templateName.trim()) {
        try {
          // Build enhanced specs with all compliance fields
          const templateSpecs: Record<string, unknown> = {
            ...payload.specs,
            // Add India compliance fields to specs for template
            cell_source: cellSource || undefined,
            hsn_code: hsnCode || undefined,
            bis_number: bisNumber || undefined,
            epr_number: eprNumber || undefined,
          };

          // EU fields are already in payload.specs from batch creation
          // Note: We intentionally do NOT save billOfEntryNo - it's dynamic per shipment

          await api.post("/templates", {
            tenant_id: user.tenant_id,
            name: templateName.trim(),
            market_region: marketRegion,
            specs: templateSpecs,
          });
          toast.success(
            `Template "${templateName}" saved for ${marketRegion} market`,
          );
        } catch (error) {
          console.error("Failed to save template:", error);
        }
      }

      toast.success("Batch created successfully");
      setOpen(false);
      onBatchCreated();
      resetForm();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || "Failed to create batch");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFieldErrors({});
    setBatchName("");
    setModelName("");
    setManufacturingStartDate("");
    setManufacturingEndDate("");
    setCapacity("");
    setVoltage("");
    setChemistry("LFP");
    setBatteryCategory("");
    setWeight("");
    setCarbonFootprint("");
    setCountryOfOrigin("");
    setRecyclable(false);
    setSelectedTemplate("");
    setSaveAsTemplate(false);
    setTemplateName("");
    setMarketRegion("INDIA");
    setPliCompliant(false);
    // Reset India Enterprise Fields
    setHsnCode("");
    setSalePrice("");
    setImportCost("");
    setCellSource("");
    setCertifications(["AIS-156", "AIS-038"]);
    setMaterialComposition({
      cobalt: "",
      lithium: "",
      nickel: "",
      manganese: "",
      graphite: "",
      lead: "",
      recycled_cobalt: "",
      recycled_lithium: "",
      recycled_nickel: "",
      recycled_lead: "",
    });
    setHazardousSubstances({
      lead: false,
      mercury: false,
      cadmium: false,
    });
    setHazardousDeclaration("");
    setExpectedLifetime("");
    setWarrantyMonths("");
    setRecycledContent("");
    setManufacturerAddress("");
    setManufacturerEmail("");
    // Reset customs fields
    setBillOfEntryNo("");
    setCellCountryOfOrigin("");
    setCustomsDate("");
    // Reset Audit fields
    setDvaSource("ESTIMATED");
    setAuditedDva("");
    setUploadedFileUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Check if this is EU mode
  const isEUMode = marketRegion === "EU";
  const isIndiaMode = marketRegion === "INDIA";
  const materialKeys = [
    "lithium",
    "cobalt",
    "graphite",
    "nickel",
    "manganese",
  ] as const;
  const materialKeyLabels: Array<{
    key: (typeof materialKeys)[number];
    label: string;
  }> = [
    { key: "lithium", label: "Lithium" },
    { key: "graphite", label: "Graphite" },
    { key: "cobalt", label: "Cobalt" },
    { key: "nickel", label: "Nickel" },
    { key: "manganese", label: "Manganese" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-160 w-full h-full overflow-y-auto bg-background border-border text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Enter the specifications for this batch of batteries.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-6 px-6 py-4 overflow-y-auto flex-1">
            {/* ===== MARKET REGION TOGGLE ===== */}
            <div className="grid gap-3 pb-4 border-b border-border">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Target Market <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMarketRegion("INDIA")}
                  className={`p-3 border-2 text-center transition-all ${
                    isIndiaMode
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-border hover:border-border text-muted-foreground"
                  }`}
                >
                  <Flag className="h-5 w-5 mx-auto mb-1" />
                  <div className=" text-sm">India</div>
                  <div className="text-xs opacity-70">{"India QCO"}</div>
                  <div className="text-[10px] opacity-50 mt-0.5">
                    {isTextile
                      ? "India BIS textile standards (IS 17243, IS 16322)"
                      : "Includes BIS IS 16046, EPR, and PLI compliance tracking"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMarketRegion("EU")}
                  className={`p-3 border-2 text-center transition-all ${
                    isEUMode
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-border hover:border-border text-muted-foreground"
                  }`}
                >
                  <Leaf className="h-5 w-5 mx-auto mb-1" />
                  <div className=" text-sm">EU Export</div>
                  <div className="text-xs opacity-70">{"Digital Product Passport"}</div>
                  <div className="text-[10px] opacity-50 mt-0.5">
                    {isTextile
                      ? "EU ESPR (Ecodesign for Sustainable Products) compliance"
                      : "EU Battery Regulation 2023/1542 compliance"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMarketRegion("GLOBAL")}
                  className={`p-3 border-2 text-center transition-all ${
                    marketRegion === "GLOBAL"
                      ? "border-teal-500 bg-teal-500/10 text-teal-400"
                      : "border-border hover:border-border text-muted-foreground"
                  }`}
                >
                  <Globe className="h-5 w-5 mx-auto mb-1" />
                  <div className=" text-sm">Global</div>
                  <div className="text-xs opacity-70">Both Markets</div>
                </button>
              </div>

              {/* Product Type */}
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-background border border-border">
                <span className="text-lg">{"👕"}</span>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {"Textile"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Product Type
                  </span>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            {templates.length > 0 && (
              <div className="grid gap-2 pb-2 border-b border-border">
                <Label
                  htmlFor="template"
                  className="flex items-center gap-2 text-foreground"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Load Template
                </Label>
                <select
                  id="template"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="">-- Select a template --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Row 1: Batch Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Batch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={batchName}
                onChange={(e) => {
                  setBatchName(e.target.value);
                  clearFieldError("name");
                }}
                placeholder="e.g. Q1-2024-Pro"
                className={
                  fieldErrors.name
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Row 1b: Model Name */}
            <div className="grid gap-2">
              <Label htmlFor="modelName">
                Model Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="modelName"
                value={modelName}
                onChange={(e) => {
                  setModelName(e.target.value);
                  clearFieldError("modelName");
                }}
                placeholder="e.g. ER-52V-20Ah"
                className={
                  fieldErrors.modelName
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {fieldErrors.modelName && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.modelName}
                </p>
              )}
            </div>

            {/* Form fields with animation */}
            <div
              className={`space-y-6 transition-all duration-300 ${fieldsAnimating ? "bg-teal-500/10 p-4 -m-4" : ""}`}
            >
              {/* Row 2: Manufacturing Window */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mfgStart">
                    Manufacturing Start Date{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mfgStart"
                    type="date"
                    value={manufacturingStartDate}
                    onChange={(e) => {
                      setManufacturingStartDate(e.target.value);
                      clearFieldError("mfgStart");
                      clearFieldError("mfgEnd");
                    }}
                    className={
                      fieldErrors.mfgStart
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {fieldErrors.mfgStart && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.mfgStart}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mfgEnd">
                    Manufacturing End Date{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mfgEnd"
                    type="date"
                    value={manufacturingEndDate}
                    onChange={(e) => {
                      setManufacturingEndDate(e.target.value);
                      clearFieldError("mfgEnd");
                    }}
                    className={
                      fieldErrors.mfgEnd
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {fieldErrors.mfgEnd && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.mfgEnd}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Manufacturer & Chemistry / Material Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufacturer">
                    Manufacturer <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manufacturer"
                    value={manufacturer}
                    onChange={(e) => {
                      setManufacturer(e.target.value);
                      clearFieldError("manufacturer");
                    }}
                    className={
                      fieldErrors.manufacturer
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {fieldErrors.manufacturer && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.manufacturer}
                    </p>
                  )}
                </div>
                {!isTextile ? (
                  <div className="grid gap-2">
                    <Label htmlFor="chemistry">
                      Chemistry <span className="text-red-500">*</span>
                    </Label>
                    <Select value={chemistry} onValueChange={setChemistry}>
                      <SelectTrigger id="chemistry">
                        <SelectValue placeholder="Select chemistry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LFP">
                          LFP — Lithium Iron Phosphate
                        </SelectItem>
                        <SelectItem value="NMC">
                          NMC — Nickel Manganese Cobalt
                        </SelectItem>
                        <SelectItem value="NMC811">NMC811</SelectItem>
                        <SelectItem value="NMC622">NMC622</SelectItem>
                        <SelectItem value="NCA">
                          NCA — Nickel Cobalt Aluminium
                        </SelectItem>
                        <SelectItem value="LCO">
                          LCO — Lithium Cobalt Oxide
                        </SelectItem>
                        <SelectItem value="LTO">
                          LTO — Lithium Titanate
                        </SelectItem>
                        <SelectItem value="LMO">
                          LMO — Lithium Manganese Oxide
                        </SelectItem>
                        <SelectItem value="Sodium-ion">Sodium-ion</SelectItem>
                        <SelectItem value="Li-ion">Li-ion (generic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="materialProfile">
                      Material Profile <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="materialProfile"
                      value={materialProfile}
                      onChange={(e) => setMaterialProfile(e.target.value)}
                      placeholder="e.g. 100% organic cotton"
                    />
                  </div>
                )}
              </div>

              {/* Row 3a: Battery Category (EU required) */}
              {!isTextile && (marketRegion === "EU" || marketRegion === "GLOBAL") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="batteryCategory">
                      Battery Category <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        (EU Reg. Art 2)
                      </span>
                    </Label>
                    <Select
                      value={batteryCategory}
                      onValueChange={(v) => {
                        setBatteryCategory(v);
                        clearFieldError("batteryCategory");
                      }}
                    >
                      <SelectTrigger
                        id="batteryCategory"
                        className={
                          fieldErrors.batteryCategory ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select EU battery category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EV">
                          EV — Electric Vehicle Battery
                        </SelectItem>
                        <SelectItem value="LMT">
                          LMT — Light Means of Transport
                        </SelectItem>
                        <SelectItem value="INDUSTRIAL">
                          Industrial Battery (&gt;2 kWh)
                        </SelectItem>
                        <SelectItem value="PORTABLE">
                          Portable Battery
                        </SelectItem>
                        <SelectItem value="SLI">
                          SLI — Starting, Lighting, Ignition
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.batteryCategory && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors.batteryCategory}
                      </p>
                    )}
                  </div>
                  <div />
                </div>
              )}

              {/* Row 3b: Manufacturer Address & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufacturerAddress">
                    Manufacturer Address
                  </Label>
                  <Input
                    id="manufacturerAddress"
                    value={manufacturerAddress}
                    onChange={(e) => setManufacturerAddress(e.target.value)}
                    placeholder="e.g. Industrial Area, New Delhi"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manufacturerEmail">Compliance Email</Label>
                  <Input
                    id="manufacturerEmail"
                    type="email"
                    value={manufacturerEmail}
                    onChange={(e) => setManufacturerEmail(e.target.value)}
                    placeholder="e.g. compliance@company.com"
                  />
                </div>
              </div>

              {!isTextile && (
                <>
                  {/* Row 4: Capacity & Voltage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">
                        Rated Capacity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="capacity"
                        value={capacity}
                        onChange={(e) => {
                          setCapacity(e.target.value);
                          clearFieldError("capacity");
                        }}
                        placeholder="e.g. 5000mAh"
                        className={
                          fieldErrors.capacity
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />
                      {fieldErrors.capacity && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.capacity}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="voltage">
                        Voltage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="voltage"
                        value={voltage}
                        onChange={(e) => {
                          setVoltage(e.target.value);
                          clearFieldError("voltage");
                        }}
                        placeholder="e.g. 3.7V"
                        className={
                          fieldErrors.voltage
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />
                      {fieldErrors.voltage && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.voltage}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {isTextile && (
                <>
                  {/* Row 4t: GSM & Dye Process */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="gsm">GSM (grams per m²)</Label>
                      <Input
                        id="gsm"
                        value={gsm}
                        onChange={(e) => setGsm(e.target.value)}
                        placeholder="e.g. 180"
                        type="number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dyeProcess">Dye Process</Label>
                      <Select value={dyeProcess} onValueChange={setDyeProcess}>
                        <SelectTrigger id="dyeProcess">
                          <SelectValue placeholder="Select dye process" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reactive">Reactive</SelectItem>
                          <SelectItem value="vat">Vat</SelectItem>
                          <SelectItem value="disperse">Disperse</SelectItem>
                          <SelectItem value="acid">Acid</SelectItem>
                          <SelectItem value="natural">Natural</SelectItem>
                          <SelectItem value="pigment">Pigment</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="undyed">Undyed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Row 4t-b: Color & Country of Origin */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. navy heather"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="countryOfOrigin">
                        Country of Origin <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="countryOfOrigin"
                        value={countryOfOrigin}
                        onChange={(e) => setCountryOfOrigin(e.target.value)}
                        placeholder="e.g. IN"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Row 5: Weight & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 500g"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country of Origin</Label>
                  <Input
                    id="country"
                    value={countryOfOrigin}
                    onChange={(e) =>
                      setCountryOfOrigin(
                        e.target.value.slice(0, 2).toUpperCase(),
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key !== "Backspace" &&
                        e.key !== "Delete" &&
                        e.key !== "ArrowLeft" &&
                        e.key !== "ArrowRight" &&
                        e.key !== "Tab" &&
                        countryOfOrigin.length >= 2
                      ) {
                        e.preventDefault();
                      }
                    }}
                    maxLength={2}
                    placeholder={isIndiaMode ? "IN" : "e.g. DE"}
                    title="ISO 3166-1 alpha-2 country code (2 characters)"
                  />
                </div>
              </div>

              {/* ===== EU-SPECIFIC FIELDS ===== */}
              {!isTextile && (isEUMode || marketRegion === "GLOBAL") && (
                <div className="p-4 border border-blue-500/30 bg-blue-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Leaf className="h-4 w-4" />
                    EU Compliance Fields
                    {isEUMode && (
                      <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="carbon" className="text-foreground">
                      Carbon Footprint (kg CO₂e)
                      {isEUMode && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="carbon"
                      value={carbonFootprint}
                      onChange={(e) => setCarbonFootprint(e.target.value)}
                      placeholder="e.g. 10 kg CO2e"
                      required={isEUMode}
                      className="bg-transparent border-border text-foreground"
                    />
                  </div>

                  {/* Material Composition */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-blue-400 text-xs border-b border-blue-500/20 pb-1">
                      <Activity className="h-3.5 w-3.5" />
                      Chemistry Breakdown (%)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {materialKeys.map((key) => (
                        <div key={key} className="grid gap-1">
                          <Label
                            htmlFor={key}
                            className="text-xs capitalize text-muted-foreground"
                          >
                            {key} %
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={materialComposition[key]}
                            onChange={(e) => {
                              setMaterialComposition((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }));
                              clearFieldError("materialTotal");
                            }}
                            placeholder="0.0"
                            className="h-8 text-xs bg-transparent border-border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-Material Recycled Content (EU 2023/1542 Art. 8) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs border-b border-emerald-500/20 pb-1">
                      <Leaf className="h-3.5 w-3.5" />
                      Recycled Content per Material (%)
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">
                        EU Art. 8
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          key: "recycled_cobalt" as const,
                          label: "Cobalt",
                          target: "16% by 2030",
                        },
                        {
                          key: "recycled_lithium" as const,
                          label: "Lithium",
                          target: "6% by 2030",
                        },
                        {
                          key: "recycled_nickel" as const,
                          label: "Nickel",
                          target: "6% by 2030",
                        },
                        {
                          key: "recycled_lead" as const,
                          label: "Lead",
                          target: "85% by 2030",
                        },
                      ].map(({ key, label, target }) => (
                        <div key={key} className="grid gap-1">
                          <Label
                            htmlFor={key}
                            className="text-xs text-muted-foreground"
                          >
                            {label}{" "}
                            <span className="text-[10px] text-emerald-500">
                              ({target})
                            </span>
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={materialComposition[key]}
                            onChange={(e) =>
                              setMaterialComposition((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder="0.0"
                            className="h-8 text-xs bg-transparent border-border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Responsible Supply Chain */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-blue-400 text-xs border-b border-blue-500/20 pb-1">
                      <Users className="h-3.5 w-3.5" />
                      Responsible Supply Chain
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label
                          htmlFor="euRep"
                          className="text-xs text-muted-foreground"
                        >
                          EU Representative
                        </Label>
                        <Input
                          id="euRep"
                          value={euRepresentative}
                          onChange={(e) => setEuRepresentative(e.target.value)}
                          placeholder="Company Name"
                          className="h-8 text-xs bg-transparent border-border"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label
                          htmlFor="euRepEmail"
                          className="text-xs text-muted-foreground"
                        >
                          Rep Email
                        </Label>
                        <Input
                          id="euRepEmail"
                          value={euRepresentativeEmail}
                          onChange={(e) =>
                            setEuRepresentativeEmail(e.target.value)
                          }
                          placeholder="email@eu-rep.com"
                          className="h-8 text-xs bg-transparent border-border"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label
                          htmlFor="recycled"
                          className="text-xs text-muted-foreground"
                        >
                          Recycled Content (%)
                        </Label>
                        <Input
                          id="recycled"
                          type="number"
                          value={recycledContent}
                          onChange={(e) => setRecycledContent(e.target.value)}
                          placeholder="0.0"
                          className="h-8 text-xs bg-transparent border-border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sustainability & Safety */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-blue-400 text-xs border-b border-blue-500/20 pb-1">
                      <Shield className="h-3.5 w-3.5" />
                      Sustainability & Safety
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label
                          htmlFor="lifecycle"
                          className="text-xs text-muted-foreground"
                        >
                          Lifetime (Cycles)
                        </Label>
                        <Input
                          id="lifecycle"
                          type="number"
                          value={expectedLifetime}
                          onChange={(e) => setExpectedLifetime(e.target.value)}
                          placeholder="e.g. 1000"
                          className="h-8 text-xs bg-transparent border-border"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label
                          htmlFor="warranty"
                          className="text-xs text-muted-foreground"
                        >
                          Warranty (Months)
                        </Label>
                        <Input
                          id="warranty"
                          type="number"
                          value={warrantyMonths}
                          onChange={(e) => setWarrantyMonths(e.target.value)}
                          placeholder="e.g. 24"
                          className="h-8 text-xs bg-transparent border-border"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 pt-1">
                      <Label className="text-xs text-muted-foreground">
                        Hazardous Substances (Check if present)
                      </Label>
                      <div className="flex gap-4">
                        {Object.entries(hazardousSubstances).map(
                          ([key, checked]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                id={`haz-${key}`}
                                checked={checked}
                                onChange={(e) =>
                                  setHazardousSubstances((prev) => ({
                                    ...prev,
                                    [key]: e.target.checked,
                                  }))
                                }
                                className="h-3.5 w-3.5 rounded border-border bg-transparent text-blue-500 focus:ring-blue-500"
                              />
                              <Label
                                htmlFor={`haz-${key}`}
                                className="text-xs capitalize font-normal cursor-pointer text-foreground"
                              >
                                {key}
                              </Label>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label
                        htmlFor="hazardDeclaration"
                        className="text-xs text-muted-foreground"
                      >
                        Hazardous Substances Declaration
                      </Label>
                      <Input
                        id="hazardDeclaration"
                        value={hazardousDeclaration}
                        onChange={(e) =>
                          setHazardousDeclaration(e.target.value)
                        }
                        placeholder="Declaration statement required for EU compliance"
                        className="h-8 text-xs bg-transparent border-border"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-blue-500/20">
                    <input
                      type="checkbox"
                      id="recyclable"
                      checked={recyclable}
                      onChange={(e) => setRecyclable(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-transparent text-blue-500 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="recyclable"
                      className="font-normal cursor-pointer text-foreground"
                    >
                      Recyclable materials
                    </Label>
                  </div>
                </div>
              )}

              {/* ===== INDIA-SPECIFIC FIELDS ===== */}
              {!isTextile && isIndiaMode && (
                <div className="p-4 border border-orange-500/30 bg-orange-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-orange-400 text-sm">
                    <Flag className="h-4 w-4" />
                    India Compliance Fields
                  </div>

                  {/* IEC ERROR BANNER for IMPORTED cells */}
                  {iecError && cellSource === "IMPORTED" && (
                    <div className="p-3 border-2 border-red-500/50 bg-red-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <Shield className="h-5 w-5" />⛔ IEC Code Required
                      </div>
                      <p className="text-xs text-red-300">
                        Your Organization is missing an IEC Code. You cannot
                        create IMPORTED batches until you add it in Settings.
                      </p>
                      <a
                        href={settingsHref}
                        target="_blank"
                        className="inline-block text-xs px-3 py-1.5 bg-red-500/30 text-red-200 rounded hover:bg-red-500/40 transition-colors font-medium"
                      >
                        → Go to Organization Settings
                      </a>
                    </div>
                  )}

                  {/* Compliance Details */}
                  <div className="grid gap-2 mb-4">
                    <Label htmlFor="hsnCode" className="text-foreground">
                      HSN Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hsnCode"
                      value={hsnCode}
                      onChange={(e) => {
                        setHsnCode(e.target.value);
                        clearFieldError("hsnCode");
                      }}
                      placeholder="e.g. 85076000"
                      className={`bg-transparent text-foreground ${fieldErrors.hsnCode ? "border-red-500" : "border-border"}`}
                      maxLength={8}
                    />
                    {fieldErrors.hsnCode ? (
                      <p className="text-[10px] text-red-500">
                        {fieldErrors.hsnCode}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        Must start with 8507 (Li-ion accumulators)
                      </p>
                    )}
                  </div>

                  {/* Batch-Level Compliance Fields (Optional) */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="bisNumber"
                        className="text-foreground flex items-center gap-1"
                      >
                        BIS R-Number
                        <span className="text-[10px] text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="bisNumber"
                        value={bisNumber}
                        onChange={(e) => setBisNumber(e.target.value)}
                        placeholder="e.g. R-12345678"
                        className="bg-transparent border-border text-foreground"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Override tenant default for this batch
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="eprNumber"
                        className="text-foreground flex items-center gap-1"
                      >
                        EPR Number
                        <span className="text-[10px] text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="eprNumber"
                        value={eprNumber}
                        onChange={(e) => setEprNumber(e.target.value)}
                        placeholder="e.g. EPR/E-Waste/2024/00001"
                        className="bg-transparent border-border text-foreground"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Override tenant default for this batch
                      </p>
                    </div>
                  </div>

                  {/* Safety Certifications — Required for India activation */}
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-1">
                      Safety Certifications
                      <span className="text-red-500">*</span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        Required for activation
                      </span>
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          value: "AIS-156",
                          label: "AIS-156",
                          desc: "MoRTH traction battery type-approval (required)",
                        },
                        {
                          value: "AIS-038",
                          label: "AIS-038 Rev.2",
                          desc: "Battery safety for EVs (required)",
                        },
                        {
                          value: "BIS",
                          label: "BIS CRS",
                          desc: "IS 16046 (recommended)",
                        },
                      ].map(({ value, label, desc }) => (
                        <div
                          key={value}
                          className="flex items-start space-x-2 p-2 bg-white/60 border border-border"
                        >
                          <input
                            type="checkbox"
                            id={`cert-${value}`}
                            checked={certifications.includes(value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCertifications((prev) => [...prev, value]);
                              } else {
                                setCertifications((prev) =>
                                  prev.filter((c) => c !== value),
                                );
                              }
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                          />
                          <Label
                            htmlFor={`cert-${value}`}
                            className="cursor-pointer leading-tight"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {label}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {desc}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    {(!certifications.includes("AIS-156") ||
                      !certifications.includes("AIS-038")) && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1">
                        ⚠ AIS-156 and AIS-038 are required to activate this
                        batch
                      </p>
                    )}
                  </div>

                  {/* DVA Calculation Section - HIDE for IMPORTED cells */}
                  {cellSource !== "IMPORTED" && (
                    <>
                      {/* DVA Calculation Method Selection */}
                      <div className="flex items-center justify-between mb-4 bg-white/50 p-3 border border-border">
                        <Label
                          htmlFor="auditedMode"
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Shield
                            className={`h-4 w-4 ${dvaSource === "AUDITED" ? "text-emerald-400" : "text-muted-foreground"}`}
                          />
                          <span>I have an Audited CA Certificate</span>
                        </Label>
                        <input
                          type="checkbox"
                          id="auditedMode"
                          checked={dvaSource === "AUDITED"}
                          onChange={(e) =>
                            setDvaSource(
                              e.target.checked ? "AUDITED" : "ESTIMATED",
                            )
                          }
                          className="h-4 w-4 rounded border-border bg-transparent text-emerald-500 focus:ring-emerald-500"
                        />
                      </div>

                      {dvaSource === "AUDITED" ? (
                        // AUDITED Mode UI
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="p-4 border border-emerald-200 bg-emerald-500/10 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-500 text-sm">
                              <Shield className="h-4 w-4" />
                              Audited Compliance Mode
                            </div>
                            <p className="text-xs text-emerald-500">
                              Enter the final DVA percentage certified by your
                              Chartered Accountant. This value overrides
                              estimated calculations.
                            </p>
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor="auditedDva"
                              className="text-foreground"
                            >
                              Audited DVA %{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="auditedDva"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={auditedDva}
                              onChange={(e) => {
                                setAuditedDva(e.target.value);
                                clearFieldError("auditedDva");
                              }}
                              placeholder="e.g. 55.5"
                              className={`bg-transparent text-foreground ${fieldErrors.auditedDva ? "border-red-500" : "border-border"}`}
                            />
                            {fieldErrors.auditedDva && (
                              <p className="text-xs text-red-500 mt-1">
                                {fieldErrors.auditedDva}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-2">
                            <Label className="text-foreground">
                              Upload CA Certificate (PDF){" "}
                              <span className="text-red-500">*</span>
                            </Label>

                            {/* Upload Zone */}
                            {!uploadedFileUrl ? (
                              <div className="flex items-center justify-center w-full">
                                <label
                                  id="certificate"
                                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed cursor-pointer transition-colors ${
                                    fieldErrors.certificate
                                      ? "border-red-500 bg-red-500/10"
                                      : isUploading
                                        ? "border-emerald-500 bg-emerald-500/10"
                                        : "border-border bg-background hover:bg-accent"
                                  }`}
                                >
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {isUploading ? (
                                      <>
                                        <div className="w-full px-8 mb-3">
                                          <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                              style={{
                                                width: `${uploadProgress}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                        <p className="text-sm text-emerald-400">
                                          Uploading... ({uploadProgress}%)
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-8 h-8 mb-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                          <span className="">
                                            Click to upload
                                          </span>{" "}
                                          or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          PDF only (MAX. 5MB)
                                        </p>
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        if (file.size > 5242880) {
                                          toast.error(
                                            "File size must be less than 5MB",
                                          );
                                          return;
                                        }
                                        if (file.type !== "application/pdf") {
                                          toast.error(
                                            "Only PDF files are allowed",
                                          );
                                          return;
                                        }
                                        handleCertificateUpload(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            ) : (
                              /* Uploaded State */
                              <div className="p-4 bg-emerald-500/10 border border-emerald-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileCheck className="h-5 w-5 text-emerald-500" />
                                    <div>
                                      <p className="text-sm font-medium text-emerald-500">
                                        Certificate Uploaded
                                      </p>
                                      <p className="text-xs text-emerald-500">
                                        Ready for submission
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <a
                                      href={uploadedFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-3 py-1 bg-emerald-100 text-emerald-500 rounded hover:bg-emerald-200 transition-colors"
                                    >
                                      View File
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setUploadedFileUrl(null)}
                                      className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted transition-colors"
                                    >
                                      Replace
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {fieldErrors.certificate && (
                              <p className="text-xs text-red-500 mt-1">
                                {fieldErrors.certificate}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        // ESTIMATED Mode UI (Original Calculator)
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Calculator className="h-4 w-4 text-indigo-400" />
                            Indicative DVA Estimator
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label
                                htmlFor="salePrice"
                                className="text-foreground"
                              >
                                Sale Price (₹)
                              </Label>
                              <Input
                                id="salePrice"
                                type="number"
                                min="0"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent border-border text-foreground"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label
                                htmlFor="importCost"
                                className="text-foreground"
                              >
                                Imp. Material Cost (₹)
                              </Label>
                              <Input
                                id="importCost"
                                type="number"
                                min="0"
                                value={importCost}
                                onChange={(e) => setImportCost(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent border-border text-foreground"
                              />
                            </div>
                          </div>

                          {/* Calculated DVA Display */}
                          {salePrice && importCost && (
                            <div className="space-y-2">
                              <div
                                className={`p-3 rounded border text-center text-sm ${
                                  ((parseFloat(salePrice) -
                                    parseFloat(importCost)) /
                                    parseFloat(salePrice)) *
                                    100 >=
                                  50
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}
                              >
                                Estimated DVA:{" "}
                                {Math.max(
                                  0,
                                  ((parseFloat(salePrice) -
                                    parseFloat(importCost)) /
                                    parseFloat(salePrice)) *
                                    100,
                                ).toFixed(1)}
                                %
                                <span className="ml-1 opacity-80">
                                  {((parseFloat(salePrice) -
                                    parseFloat(importCost)) /
                                    parseFloat(salePrice)) *
                                    100 >=
                                  50
                                    ? "(Potentially Eligible)"
                                    : "(Ineligible)"}
                                </span>
                              </div>

                              {/* Legal Warning Banner */}
                              <div className="p-3 bg-amber-500/10 border border-amber-200 text-amber-800 text-xs flex gap-2 items-start">
                                <Activity className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <span>
                                  <strong>Note:</strong> This is an estimated
                                  value based on raw material costs. Final PLI
                                  eligibility requires certification by a
                                  Chartered Accountant.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Cell Source Selection */}
                  <div className="grid gap-2 pt-2">
                    <Label htmlFor="cellSource" className="text-foreground">
                      Cell Source <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="cellSource"
                      value={cellSource}
                      onChange={(e) => {
                        setCellSource(e.target.value as CellSource);
                        clearFieldError("cellSource");
                      }}
                      className={`flex h-10 w-full border px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 ${
                        fieldErrors.cellSource
                          ? "border-red-500 bg-transparent"
                          : !cellSource && marketRegion === "INDIA"
                            ? "border-red-500/50 bg-transparent"
                            : "border-border bg-transparent"
                      }`}
                    >
                      <option value="">-- Select Cell Source --</option>
                      <option value="DOMESTIC">
                        🏭 Domestic (Enables DVA Calculator)
                      </option>
                      <option value="IMPORTED">
                        📦 Imported (Requires IEC Code)
                      </option>
                    </select>
                    {fieldErrors.cellSource ? (
                      <p className="text-[10px] text-red-500">
                        {fieldErrors.cellSource}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        Required for India compliance. Determines customs and
                        PLI eligibility.
                      </p>
                    )}
                  </div>

                  {/* PLI Checkbox with Auto-Disable for IMPORTED */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pliCompliant"
                        checked={pliCompliant}
                        onChange={(e) => setPliCompliant(e.target.checked)}
                        disabled={cellSource === "IMPORTED"}
                        className={`h-4 w-4 rounded border-border bg-transparent text-orange-500 focus:ring-orange-500 ${
                          cellSource === "IMPORTED"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      />
                      <Label
                        htmlFor="pliCompliant"
                        className={`font-normal cursor-pointer text-foreground ${
                          cellSource === "IMPORTED" ? "opacity-50" : ""
                        }`}
                      >
                        PLI Subsidy Eligible
                      </Label>
                    </div>

                    {/* Warning for IMPORTED cells */}
                    {cellSource === "IMPORTED" && (
                      <div className="p-2 bg-amber-500/10 border border-amber-200 rounded text-amber-800 text-xs flex gap-2 items-start">
                        <Activity className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span>
                          ⚠️ Imported cells typically constitute &gt;60% of
                          cost, making the batch ineligible for PLI (Requires
                          ≥50% Local Value Add).
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Customs Declaration for Imported Cells */}
                  {cellSource === "IMPORTED" && (
                    <div className="mt-4 p-4 border border-amber-200 bg-amber-500/10 space-y-4">
                      <div className="flex items-center gap-2 text-amber-500 text-sm">
                        <FileText className="h-4 w-4" />
                        Customs Declaration
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                          Required
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label
                            htmlFor="billOfEntry"
                            className="text-foreground"
                          >
                            Bill of Entry No.{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="billOfEntry"
                            value={billOfEntryNo}
                            onChange={(e) => {
                              setBillOfEntryNo(e.target.value);
                              clearFieldError("billOfEntry");
                            }}
                            placeholder="e.g. 1234567"
                            className={`bg-transparent text-foreground ${fieldErrors.billOfEntry ? "border-red-500" : "border-border"}`}
                          />
                          {fieldErrors.billOfEntry && (
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.billOfEntry}
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label
                            htmlFor="cellCountryOfOrigin"
                            className="text-foreground"
                          >
                            Cell Country of Origin{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cellCountryOfOrigin"
                            value={cellCountryOfOrigin}
                            onChange={(e) => {
                              setCellCountryOfOrigin(
                                e.target.value.slice(0, 2).toUpperCase(),
                              );
                              clearFieldError("cellCountryOfOrigin");
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key !== "Backspace" &&
                                e.key !== "Delete" &&
                                e.key !== "ArrowLeft" &&
                                e.key !== "ArrowRight" &&
                                e.key !== "Tab" &&
                                cellCountryOfOrigin.length >= 2
                              ) {
                                e.preventDefault();
                              }
                            }}
                            maxLength={2}
                            placeholder="e.g. CN, KR"
                            title="ISO 3166-1 alpha-2 country code (2 characters)"
                            className={`bg-transparent text-foreground ${fieldErrors.cellCountryOfOrigin ? "border-red-500" : "border-border"}`}
                          />
                          {fieldErrors.cellCountryOfOrigin && (
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.cellCountryOfOrigin}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="customsDate"
                          className="flex items-center gap-2 text-foreground"
                        >
                          <Calendar className="h-4 w-4 text-amber-400" />
                          Import Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="customsDate"
                          type="date"
                          value={customsDate}
                          onChange={(e) => {
                            setCustomsDate(e.target.value);
                            clearFieldError("customsDate");
                          }}
                          className={`max-w-50 bg-transparent text-foreground ${fieldErrors.customsDate ? "border-red-500" : "border-border"}`}
                        />
                        {fieldErrors.customsDate && (
                          <p className="text-xs text-red-500 mt-1">
                            {fieldErrors.customsDate}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== CHEMISTRY BREAKDOWN (Global) ===== */}
              <div className="p-4 border border-teal-200 bg-teal-50 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                  <div className="flex items-center gap-2 text-teal-700 text-sm">
                    <Activity className="h-4 w-4" />
                    🧪 Material Composition (Chemistry Breakdown)
                  </div>
                  <div
                    className={`text-xs font-mono ${
                      Object.values(materialComposition).reduce(
                        (a, b) => a + (parseFloat(b) || 0),
                        0,
                      ) > 100
                        ? "text-red-500"
                        : "text-teal-600"
                    }`}
                  >
                    Total:{" "}
                    {Object.values(materialComposition)
                      .reduce((a, b) => a + (parseFloat(b) || 0), 0)
                      .toFixed(1)}
                    %
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {materialKeyLabels.map(({ key, label }) => (
                    <div key={key} className="grid gap-1">
                      <Label
                        htmlFor={key}
                        className="text-[10px] uppercase text-muted-foreground truncate"
                        title={label}
                      >
                        {label} %
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={materialComposition[key]}
                        onChange={(e) => {
                          setMaterialComposition((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                          clearFieldError("materialTotal");
                        }}
                        placeholder="0.0"
                        className="h-8 text-xs bg-transparent border-border px-2"
                      />
                    </div>
                  ))}
                </div>
                {Object.values(materialComposition).reduce(
                  (a, b) => a + (parseFloat(b) || 0),
                  0,
                ) > 100 && (
                  <p className="text-[10px] text-red-500 mt-1">
                    ⚠️ Total percentage cannot exceed 100%. Please adjust
                    values.
                  </p>
                )}
                {fieldErrors.materialTotal && (
                  <p
                    id="materialTotal"
                    className="text-[10px] text-red-500 mt-1"
                  >
                    {fieldErrors.materialTotal}
                  </p>
                )}
              </div>
            </div>

            {/* Save as Template Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveTemplate"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-transparent text-teal-500 focus:ring-teal-500"
                />
                <Label
                  htmlFor="saveTemplate"
                  className="font-normal cursor-pointer flex items-center gap-2 text-foreground"
                >
                  <Save className="h-4 w-4 text-muted-foreground" />
                  Save these settings as a new template
                </Label>
              </div>
              {saveAsTemplate && (
                <div className="pl-6">
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name (e.g. E-Bike Standard Pack)"
                    className="max-w-sm bg-transparent border-border text-foreground"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="submit" disabled={isLoading || iecError}>
              {isLoading ? "Creating..." : "Create Lot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
