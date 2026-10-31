"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/auth-context";
import { dashboardPathFromPathname } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { WizardStepRail } from "@/components/batches/wizard/wizard-step-rail";
import { WizardSummaryPanel } from "@/components/batches/wizard/wizard-summary-panel";
import api from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { uploadStagingComplianceDoc } from "@/lib/api/compliance-docs";
import { useTemplates, type Template } from "@/hooks/use-queries";
import { useBatchValidation } from "@/hooks/use-batch-validation";
import { mapBackendFieldToFormPath } from "@/lib/batch-error-mapper";
import {
  batchFormSchema,
  defaultBatchFormValues,
  type BatchFormData,
  type MarketRegion,
  type CellSource,
} from "@/components/batches/batch-form-schema";
import {
  scheduleDraftSave,
  saveDraftSlot,
  loadDraftSlot,
  deleteDraftSlot,
} from "@/lib/batch-draft";
import { BatchEntryModal, type EntryChoice } from "@/components/batches/batch-entry-modal";
import { useLocale } from "@/lib/i18n/locale-context";
import { StepIdentity } from "@/components/batches/batch-form-steps/step-identity";
import { StepSpecs } from "@/components/batches/batch-form-steps/step-specs";
import { StepCompliance } from "@/components/batches/batch-form-steps/step-compliance";
import { StepReview } from "@/components/batches/batch-form-steps/step-review";
import {
  isCarbonResultCurrent,
  isCarbonResultPayload,
  saveCarbonToBatch,
  type CarbonResult,
} from "@/lib/carbon";

interface CreateBatchWizardProps {
  onBatchCreated: () => void;
}

const STEPS = [
  { id: 0, label: "Core", description: "Identity & specs" },
  { id: 1, label: "Compliance", description: "Market-specific rules" },
  { id: 2, label: "Review", description: "Verify & submit" },
] as const;

const stepFieldCounts = [
  { total: 11, label: "11 required fields" },
  { total: 8, label: "8–11 fields depending on market" },
  { total: 0, label: "Review & submit" },
];

// Which wizard step a form field belongs to — used to scope backend
// validation errors to steps the user has already reached.
const CORE_FIELDS = [
  "batchName", "modelName", "lotSize", "marketRegion", "manufacturingStartDate", "manufacturingEndDate",
  "manufacturer", "manufacturerAddress", "manufacturerEmail", "chemistry",
  "weight", "capacity", "voltage", "materialComposition", "recycledContent", "countryOfOrigin", "recyclable",
  "batteryCategory",
];

function getStepForField(field: string): number {
  const root = field.split(".")[0];
  if (CORE_FIELDS.includes(root)) return 0;
  return 1;
}

// English step label/description → translation key, for STEPS below.
// Kept as a lookup (rather than translating STEPS itself) so STEPS can stay
// a plain module-level const — translation only happens at render time,
// inside the component, where the locale hook is available.
const STEP_LABEL_KEYS: Record<string, string> = {
  Core: "wizard_step_core",
  Compliance: "wizard_step_compliance",
  Review: "wizard_step_review",
};
const STEP_DESC_KEYS: Record<string, string> = {
  "Identity & specs": "wizard_step_core_desc",
  "Market-specific rules": "wizard_step_compliance_desc",
  "Verify & submit": "wizard_step_review_desc",
};

export function CreateBatchWizard({ onBatchCreated }: CreateBatchWizardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const translatedSteps = useMemo(
    () =>
      STEPS.map((s) => ({
        ...s,
        label: STEP_LABEL_KEYS[s.label] ? t(STEP_LABEL_KEYS[s.label]) : s.label,
        description: STEP_DESC_KEYS[s.description] ? t(STEP_DESC_KEYS[s.description]) : s.description,
      })),
    [t],
  );
  const [entryOpen, setEntryOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitReady, setIsSubmitReady] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string>("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  // Briefly true right after a draft write, to pulse the "Saved" indicator
  // once rather than animate it forever.
  const [saveFlash, setSaveFlash] = useState(false);
  const saveFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flagSaved = useCallback(() => {
    setLastSavedAt(new Date().toISOString());
    setSaveFlash(true);
    if (saveFlashTimer.current) clearTimeout(saveFlashTimer.current);
    saveFlashTimer.current = setTimeout(() => setSaveFlash(false), 1500);
  }, []);
  const [pendingAiMode, setPendingAiMode] = useState<"pdf" | "nl" | undefined>(undefined);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [settingsFilledFields, setSettingsFilledFields] = useState<Set<string>>(new Set());

  // Prevent double-click submission capture when morphing from Next -> Submit
  useEffect(() => {
    if (step === 2) {
      setIsSubmitReady(false);
      const timer = setTimeout(() => setIsSubmitReady(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsSubmitReady(false);
    }
  }, [step]);

  const handleAiFill = useCallback((fields: string[]) => {
    setAiFilledFields((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => next.add(f));
      return next;
    });
    // Fade the AI highlight after 60s so it reads as "spot-check this now",
    // not a permanent marker. Matches the redesign spec.
    setTimeout(() => {
      setAiFilledFields((prev) => {
        const next = new Set(prev);
        fields.forEach((f) => next.delete(f));
        return next;
      });
    }, 60_000);
  }, []);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // IEC validation
  const [iecError, setIecError] = useState(false);

  // Retry state
  const [retryPayload, setRetryPayload] = useState<BatchFormData | null>(null);

  // Real-time backend validation
  const batchValidation = useBatchValidation();
  const [backendValidationErrors, setBackendValidationErrors] = useState<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map user's onboarding primary_market to batch marketRegion default
  const getDefaultMarketRegion = (): MarketRegion => {
    const pm = user?.data_visibility?.primary_market
    if (pm === "eu") return "EU"
    if (pm === "india") return "INDIA"
    if (pm === "both") return "INDIA" // Default to India for "both" — user can switch per batch
    return "INDIA"
  }

  const methods = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      ...defaultBatchFormValues,
      manufacturer: user?.company_name || "",
      marketRegion: getDefaultMarketRegion(),
    },
    mode: "onBlur",
  });

  const {
    watch,
    getValues,
    setValue,
    reset,
    handleSubmit,
    trigger,
    setError,
    control,
    formState: { errors, isDirty },
  } = methods;

  const marketRegion = watch("marketRegion");
  const cellSource = watch("cellSource");
  const batteryCategory = watch("batteryCategory");

  // Default certifications: CE for EU/GLOBAL; AIS only for India traction (EV/LMT).
  useEffect(() => {
    if (!wizardOpen) return
    const currentCerts = watch("certifications")
    const isDefault =
      JSON.stringify(currentCerts) === JSON.stringify(["AIS-156", "AIS-038"]) ||
      JSON.stringify(currentCerts) === JSON.stringify(["CE"]) ||
      currentCerts.length === 0
    if (!isDefault) return

    const traction = batteryCategory === "EV" || batteryCategory === "LMT"
    if (marketRegion === "INDIA") {
      setValue("certifications", traction ? ["AIS-156", "AIS-038"] : [], { shouldValidate: false })
    } else if (marketRegion === "EU" || marketRegion === "GLOBAL") {
      setValue("certifications", ["CE"], { shouldValidate: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketRegion, batteryCategory, wizardOpen])

  // Fetch templates via React Query (cached, deduped)
  const { data: templatesData } = useTemplates(user?.tenant_id, "BATTERY");

  // Sync React Query data to local state for template dropdown
  useEffect(() => {
    if (templatesData) {
      setTemplates(templatesData);
    }
  }, [templatesData]);

  // Build API payload from form data (shared by submit and validation)
  const buildValidationPayload = useCallback((data: BatchFormData, userCtx: typeof user): Record<string, unknown> => {
    if (!userCtx) return {};
    const payload: Record<string, unknown> = {
      tenant_id: userCtx.tenant_id,
      batch_name: data.batchName,
      model_name: data.modelName,
      manufacturing_start_date: data.manufacturingStartDate || undefined,
      manufacturing_end_date: data.manufacturingEndDate || undefined,
      market_region: data.marketRegion,
      product_type: "BATTERY",
      specs: {
        manufacturer: data.manufacturer,
        manufacturer_address: data.manufacturerAddress,
        manufacturer_email: data.manufacturerEmail,
        weight: data.weight,
        country_of_origin: data.countryOfOrigin,
        recyclable: data.recyclable,
        capacity: data.capacity,
        voltage: data.voltage,
        chemistry: data.chemistry,
        battery_category: data.batteryCategory || undefined,
        lot_size: data.lotSize || undefined,
      },
    };

    if (data.recycledContent.trim()) {
      const recycled = parseFloat(data.recycledContent);
      if (!Number.isNaN(recycled)) {
        (payload.specs as Record<string, unknown>).recycled_content_pct = recycled;
      }
    }

    if (data.carbonFootprintResult && Object.keys(data.carbonFootprintResult).length > 0) {
      payload.carbon_footprint_result = data.carbonFootprintResult;
    }

    if (data.marketRegion === "EU" || data.marketRegion === "GLOBAL") {
      (payload.specs as Record<string, unknown>).carbon_footprint = data.carbonFootprint;
      (payload.specs as Record<string, unknown>).certifications = data.certifications;
      (payload.specs as Record<string, unknown>).eu_representative = data.euRepresentative;
      (payload.specs as Record<string, unknown>).eu_representative_email = data.euRepresentativeEmail;
      (payload.specs as Record<string, unknown>).eu_representative_address = data.euRepresentativeAddress;
      if (data.expectedLifetime !== "") {
        (payload.specs as Record<string, unknown>).expected_lifetime_cycles = parseInt(data.expectedLifetime);
      }
      payload.ce_marking = data.ceMarking;
      payload.carbon_performance_class = data.carbonPerformanceClass || undefined;
      payload.removable_and_replaceable = data.removableAndReplaceable;
      payload.notified_body_number = data.notifiedBodyNumber || undefined;
      if (data.warrantyMonths !== "") {
        (payload.specs as Record<string, unknown>).warranty_months = parseInt(data.warrantyMonths);
      }
    }

    if (data.marketRegion === "INDIA") {
      (payload.specs as Record<string, unknown>).certifications = data.certifications;
      payload.pli_compliant = data.pliCompliant;
      payload.hsn_code = data.hsnCode;
      payload.dva_source = data.dvaSource;
      if (data.dvaSource === "AUDITED") {
        payload.audited_domestic_value_add = parseFloat(data.auditedDva) || 0;
      } else {
        const specs = payload.specs as Record<string, unknown>;
        specs.sale_price_inr = parseFloat(data.salePrice) || 0;
        specs.cell_cost_imported_inr = parseFloat(data.cellCostImported) || 0;
        specs.cell_cost_domestic_inr = parseFloat(data.cellCostDomestic) || 0;
        specs.bms_cost_imported_inr = parseFloat(data.bmsCostImported) || 0;
        specs.bms_cost_domestic_inr = parseFloat(data.bmsCostDomestic) || 0;
        specs.casing_cost_imported_inr = parseFloat(data.casingCostImported) || 0;
        specs.casing_cost_domestic_inr = parseFloat(data.casingCostDomestic) || 0;
        specs.labour_overhead_cost_inr = parseFloat(data.labourOverheadCost) || 0;
        // The backend recomputes domestic_value_add from the breakdown above
        // server-side — never trust a client-computed % for a PLI-audit number.
        payload.domestic_value_add = 0;
      }
      payload.cell_source = data.cellSource || undefined;
      if (data.cellSource === "IMPORTED") {
        payload.bill_of_entry_no = data.billOfEntryNo;
        payload.country_of_origin = data.cellCountryOfOrigin;
        payload.customs_date = data.customsDate;
      }
    }

    return payload;
  }, []);

  // Auto-save draft on form changes (debounced)
  useEffect(() => {
    if (!wizardOpen || !user || !currentDraftId) return;
    const subscription = watch((value) => {
      if (isDirty) {
        scheduleDraftSave(user.tenant_id, currentDraftId, value as BatchFormData, step, flagSaved);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isDirty, user, wizardOpen, step, currentDraftId, flagSaved]);

  // Re-fills euRepresentative*/eprNumber/bisNumber from the org profile.
  // Only touches fields that are currently empty, so it's safe to call again
  // later from a manual "Fill from profile" action on the Compliance step.
  const fillComplianceFromSettings = useCallback(() => {
    if (!user) return [] as string[];
    const filled: string[] = [];

    if (user.eu_authorized_representative_name && !watch("euRepresentative")) {
      setValue("euRepresentative", user.eu_authorized_representative_name);
      filled.push("euRepresentative");
    }
    if (user.eu_contact_email && !watch("euRepresentativeEmail")) {
      setValue("euRepresentativeEmail", user.eu_contact_email);
      filled.push("euRepresentativeEmail");
    }
    if (user.eu_authorized_representative_address && !watch("euRepresentativeAddress")) {
      setValue("euRepresentativeAddress", user.eu_authorized_representative_address);
      filled.push("euRepresentativeAddress");
    }
    if (user.epr_registration_number && !watch("eprNumber")) {
      setValue("eprNumber", user.epr_registration_number);
      filled.push("eprNumber");
    }
    if (user.bis_r_number && !watch("bisNumber")) {
      setValue("bisNumber", user.bis_r_number);
      filled.push("bisNumber");
    }

    if (filled.length > 0) {
      setSettingsFilledFields((prev) => {
        const next = new Set(prev);
        filled.forEach((f) => next.add(f));
        return next;
      });
    }
    return filled;
  }, [user, watch, setValue]);

  // User-triggered version of fillComplianceFromSettings — same fields, but
  // with toast feedback since this one is an explicit click, not a silent
  // mount-time default.
  const handleFillComplianceFromProfile = useCallback(() => {
    const filled = fillComplianceFromSettings();
    if (filled.length > 0) {
      toast.success(`Filled ${filled.length} field${filled.length > 1 ? "s" : ""} from your organization profile`);
    } else {
      toast.info("Nothing to fill — these fields are already set, or missing from Organization Settings");
    }
  }, [fillComplianceFromSettings]);

  // Pre-fill static fields from user profile when the wizard opens. Fields
  // touched here are tracked in settingsFilledFields so the form can show a
  // "from Settings" badge — otherwise a silently pre-filled field looks no
  // different from one the user typed, and they won't know editing it here
  // is per-batch only (the permanent fix lives in Organization Settings).
  useEffect(() => {
    if (wizardOpen && user) {
      const filledFromSettings: string[] = [];

      // Core company info (only if field is currently empty)
      if (user.company_name && !watch("manufacturer")) {
        setValue("manufacturer", user.company_name);
        filledFromSettings.push("manufacturer");
      }
      if (user.address && !watch("manufacturerAddress")) {
        setValue("manufacturerAddress", user.address);
        filledFromSettings.push("manufacturerAddress");
      }
      if (user.support_email && !watch("manufacturerEmail")) {
        setValue("manufacturerEmail", user.support_email);
        filledFromSettings.push("manufacturerEmail");
      }

      filledFromSettings.push(...fillComplianceFromSettings());

      // Default country of origin based on tenant profile signals
      if (!watch("countryOfOrigin")) {
        if (user.epr_registration_number || user.bis_r_number || user.iec_code) {
          setValue("countryOfOrigin", "IN");
          filledFromSettings.push("countryOfOrigin");
        }
      }

      if (filledFromSettings.length > 0) {
        setSettingsFilledFields((prev) => {
          const next = new Set(prev);
          filledFromSettings.forEach((f) => next.add(f));
          return next;
        });
      }
    }
  }, [wizardOpen, setValue, reset, user, fillComplianceFromSettings]);

  // Auto-disable PLI and validate IEC for imported cells. DVA mode/audit
  // fields are India-DOMESTIC-only concepts — reset them so a stale AUDITED
  // selection from a prior DOMESTIC choice doesn't trip the backend's
  // "IMPORTED cells require DVA source to be ESTIMATED" check.
  useEffect(() => {
    if (cellSource === "IMPORTED") {
      setValue("pliCompliant", false);
      setValue("dvaSource", "ESTIMATED");
      setValue("auditedDva", "");
      setValue("uploadedFileUrl", null);
      setIecError(!user?.iec_code);
    } else {
      setIecError(false);
    }
  }, [cellSource, setValue, user?.iec_code]);

  // Real-time backend validation (debounced 500ms). Only watches the
  // specific fields the validator cares about — watching the whole form
  // here would re-render (and re-debounce) the entire multi-step wizard on
  // every keystroke in any step.
  const validationTriggerFields = useWatch({
    control,
    name: [
      "batchName", "marketRegion", "cellSource", "hsnCode", "billOfEntryNo",
      "cellCountryOfOrigin", "customsDate", "salePrice",
      "cellCostImported", "cellCostDomestic", "bmsCostImported", "bmsCostDomestic",
      "casingCostImported", "casingCostDomestic", "labourOverheadCost",
      "dvaSource", "auditedDva", "pliCompliant", "batteryCategory",
      "carbonFootprint", "expectedLifetime", "warrantyMonths",
      "manufacturingStartDate", "manufacturingEndDate",
    ],
  });
  useEffect(() => {
    if (!wizardOpen || !user) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Only validate if we have minimum required fields
      const currentValues = getValues();
      if (!currentValues.batchName || !currentValues.marketRegion) return;
      try {
        const payload = buildValidationPayload(currentValues, user);
        const result = await batchValidation.mutateAsync(payload);
        if (result.errors && result.errors.length > 0) {
          const mapped: Record<string, string> = {};
          result.errors.forEach((err) => {
            const formPath = mapBackendFieldToFormPath(err.field);
            mapped[formPath] = err.message;
          });
          setBackendValidationErrors(mapped);
        } else {
          setBackendValidationErrors({});
        }
      } catch {
        // Silently fail — backend validation is best-effort
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...validationTriggerFields, wizardOpen, user]);

  // Apply backend validation errors to react-hook-form, scoped to steps the
  // user has already reached — surfacing errors for fields on future steps
  // before the user has even seen them is just noise.
  useEffect(() => {
    Object.entries(backendValidationErrors).forEach(([path, message]) => {
      if (getStepForField(path) > step) return;
      methods.setError(path as keyof BatchFormData, { type: "backend", message });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendValidationErrors, step]);

  // Template selection
  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const specs = template.specs;
    const updates: Partial<BatchFormData> = {
      marketRegion: template.market_region as BatchFormData["marketRegion"],
      modelName: (specs.model_name as string) || watch("modelName") || "",
      capacity: (specs.capacity as string) || "",
      voltage: (specs.voltage as string) || "",
      chemistry: (specs.chemistry as BatchFormData["chemistry"]) || "LFP",
      batteryCategory: (specs.battery_category as string) || "",
      manufacturer: (specs.manufacturer as string) || user?.company_name || watch("manufacturer"),
      manufacturerEmail: (specs.manufacturer_email as string) || "",
      weight: (specs.weight as string) || "",
      carbonFootprint: (specs.carbon_footprint as string) || "",
      countryOfOrigin: (specs.country_of_origin as string) || "",
      recyclable: (specs.recyclable as boolean) || false,
      certifications: (specs.certifications as string[]) || ["CE"],
      ceMarking: (specs.ce_marking as boolean) || false,
      carbonPerformanceClass: (specs.carbon_performance_class as string) || "",
      removableAndReplaceable: (specs.removable_and_replaceable as boolean) || false,
      notifiedBodyNumber: (specs.notified_body_number as string) || "",
      bisCertificateIssueDate: (specs.bis_certificate_issue_date as string) || "",
      un383TestDate: (specs.un38_3_test_date as string) || "",
      iec62133TestDate: (specs.iec_62133_test_date as string) || "",
      msdsIssueDate: (specs.msds_issue_date as string) || "",
    };

    // Material composition
    if (specs.material_composition) {
      const mc = specs.material_composition as Record<string, number>;
      updates.materialComposition = {
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
      };
    }

    // India fields
    if (specs.cell_source) updates.cellSource = specs.cell_source as "IMPORTED" | "DOMESTIC";
    if (specs.lot_size) updates.lotSize = String(specs.lot_size);
    if (specs.hsn_code) updates.hsnCode = specs.hsn_code as string;
    if (specs.bis_number) updates.bisNumber = specs.bis_number as string;
    if (specs.epr_number) updates.eprNumber = specs.epr_number as string;
    if (specs.sale_price_inr) updates.salePrice = (specs.sale_price_inr as number).toString();
    if (specs.cell_cost_imported_inr) updates.cellCostImported = (specs.cell_cost_imported_inr as number).toString();
    if (specs.cell_cost_domestic_inr) updates.cellCostDomestic = (specs.cell_cost_domestic_inr as number).toString();
    if (specs.bms_cost_imported_inr) updates.bmsCostImported = (specs.bms_cost_imported_inr as number).toString();
    if (specs.bms_cost_domestic_inr) updates.bmsCostDomestic = (specs.bms_cost_domestic_inr as number).toString();
    if (specs.casing_cost_imported_inr) updates.casingCostImported = (specs.casing_cost_imported_inr as number).toString();
    if (specs.casing_cost_domestic_inr) updates.casingCostDomestic = (specs.casing_cost_domestic_inr as number).toString();
    if (specs.labour_overhead_cost_inr) updates.labourOverheadCost = (specs.labour_overhead_cost_inr as number).toString();
    if (specs.pli_compliant !== undefined) updates.pliCompliant = specs.pli_compliant as boolean;
    if (specs.dva_source) updates.dvaSource = specs.dva_source as "ESTIMATED" | "AUDITED";
    if (specs.audited_domestic_value_add !== undefined) updates.auditedDva = (specs.audited_domestic_value_add as number).toString();
    if (specs.gtin) updates.gtin = specs.gtin as string;

    // EU fields
    if (specs.manufacturer_address) updates.manufacturerAddress = specs.manufacturer_address as string;
    if (specs.eu_representative) updates.euRepresentative = specs.eu_representative as string;
    if (specs.eu_representative_email) updates.euRepresentativeEmail = specs.eu_representative_email as string;
    if (specs.eu_representative_address) updates.euRepresentativeAddress = specs.eu_representative_address as string;
    if (specs.expected_lifetime_cycles) updates.expectedLifetime = (specs.expected_lifetime_cycles as number).toString();
    if (specs.warranty_months) updates.warrantyMonths = (specs.warranty_months as number).toString();
    if (specs.recycled_content_pct) updates.recycledContent = (specs.recycled_content_pct as number).toString();
    if (specs.hazardous_substances) {
      const hs = specs.hazardous_substances as Record<string, boolean>;
      updates.hazardousSubstances = {
        lead: hs.lead_present || false,
        mercury: hs.mercury_present || false,
        cadmium: hs.cadmium_present || false,
      };
    }

    // Reset to a clean baseline first so stale values from a previously-opened
    // (but un-submitted) wizard session can't bleed into the new batch.
    reset({
      ...defaultBatchFormValues,
      manufacturer: user?.company_name || "",
      ...updates,
    });
    toast.success(`Loaded "${template.name}" template (${template.market_region} market)`);
  };

  // Resume a saved draft slot, selected from the entry modal
  const handleResumeDraftSlot = (draftId: string) => {
    if (!user) return;
    const slot = loadDraftSlot(user.tenant_id, draftId);
    if (!slot) {
      toast.error("Draft is no longer available.");
      return;
    }
    try {
      reset({
        ...defaultBatchFormValues,
        ...slot.data,
        // Ensure nested objects are preserved even if the draft predates new fields
        materialComposition: {
          ...defaultBatchFormValues.materialComposition,
          ...(slot.data.materialComposition || {}),
        },
        hazardousSubstances: {
          ...defaultBatchFormValues.hazardousSubstances,
          ...(slot.data.hazardousSubstances || {}),
        },
      });
      setCurrentDraftId(draftId);
      setLastSavedAt(slot.savedAt);
      setPendingAiMode(undefined);
      setAiFilledFields(new Set());
      setSettingsFilledFields(new Set());
      setStep(Math.min(slot.step, STEPS.length - 1));
      setEntryOpen(false);
      setWizardOpen(true);
      toast.success("Draft resumed");
    } catch {
      toast.error("Draft is corrupted or outdated.");
      deleteDraftSlot(user.tenant_id, draftId);
    }
  };

  // Entry modal selection — seed the wizard's form state and open it
  const handleEntryChoice = (choice: EntryChoice) => {
    if (choice.type === "resume-draft") {
      handleResumeDraftSlot(choice.draftId);
      return;
    }
    if (choice.type === "template") {
      handleTemplateSelect(choice.templateId);
      setCurrentDraftId(crypto.randomUUID());
      setLastSavedAt(null);
      setPendingAiMode(undefined);
      setAiFilledFields(new Set());
      setSettingsFilledFields(new Set());
      setStep(0);
      setEntryOpen(false);
      setWizardOpen(true);
      return;
    }

    reset({
      ...defaultBatchFormValues,
      manufacturer: user?.company_name || "",
      marketRegion: choice.market,
    });
    setCurrentDraftId(crypto.randomUUID());
    setLastSavedAt(null);
    setPendingAiMode(choice.type === "ai-pdf" ? "pdf" : choice.type === "ai-nl" ? "nl" : undefined);
    setAiFilledFields(new Set());
    setSettingsFilledFields(new Set());
    setStep(0);
    setEntryOpen(false);
    setWizardOpen(true);
  };

  // File upload handlers — API path only (S-10/S-11). Persist canonical
  // `path`, never a signed URL (those expire in ~1h).
  const handleCertificateUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadStagingComplianceDoc(file, "pli", setUploadProgress);
      if (!result.path) throw new Error("Upload did not return a storage path");
      setValue("uploadedFileUrl", result.path, { shouldValidate: true, shouldDirty: true });
      toast.success("Certificate uploaded successfully");
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadStagingComplianceDoc(file, "doc", setUploadProgress);
      if (!result.path) throw new Error("Upload did not return a storage path");
      setValue("docUploadUrl", result.path, { shouldValidate: true, shouldDirty: true });
      toast.success("Declaration of Conformity uploaded");
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Market-aware required fields per step
  const getRequiredFieldsForStep = useCallback((stepIdx: number, market: MarketRegion, source: CellSource, dvaSource: BatchFormData["dvaSource"]): (keyof BatchFormData)[] => {
    const base: (keyof BatchFormData)[][] = [
      ["batchName", "modelName", "lotSize", "manufacturingStartDate", "manufacturingEndDate", "marketRegion", "manufacturer", "chemistry", "capacity", "voltage"],
      [], // Compliance step varies by market
      [], // Review step has no step-gating fields; templateName is validated by zod only when saveAsTemplate is checked
    ];
    const fields = [...base[stepIdx]];

    if (stepIdx === 0) {
      if (market === "EU") {
        fields.push("batteryCategory");
      }
    }

    if (stepIdx === 1) {
      if (market === "INDIA") {
        fields.push("cellSource");
        if (source === "DOMESTIC" && dvaSource === "AUDITED") {
          fields.push("auditedDva", "uploadedFileUrl");
        }
      }
    }

    return fields;
  }, []);

  // Step navigation
  const canGoNext = async () => {
    const fields = getRequiredFieldsForStep(step, marketRegion, cellSource, watch("dvaSource"));
    const valid = await trigger(fields);
    return valid;
  };

  const goNext = async () => {
    if (isValidating) return;
    setIsValidating(true);
    try {
      const ok = await canGoNext();
      if (ok && step < STEPS.length - 1) {
        setStep((s) => s + 1);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Explicit "Save & Exit" — flushes the draft immediately instead of
  // relying on the 5s-debounced autosave, so closing right after a quick
  // edit can't silently drop it.
  const handleSaveAndExit = () => {
    if (!user || !currentDraftId) {
      setWizardOpen(false);
      return;
    }
    saveDraftSlot(user.tenant_id, currentDraftId, watch(), step);
    flagSaved();
    setWizardOpen(false);
    toast.success("Draft saved — resume it anytime from Create Batch");
  };

  // Submit
  const onSubmit = async (data: BatchFormData) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const payload = buildValidationPayload(data, user);

      // Add material composition
      const materialPayload: Record<string, number | undefined> = {
        cobalt_pct: data.materialComposition.cobalt ? parseFloat(data.materialComposition.cobalt) : undefined,
        lithium_pct: data.materialComposition.lithium ? parseFloat(data.materialComposition.lithium) : undefined,
        nickel_pct: data.materialComposition.nickel ? parseFloat(data.materialComposition.nickel) : undefined,
        manganese_pct: data.materialComposition.manganese ? parseFloat(data.materialComposition.manganese) : undefined,
        graphite_pct: data.materialComposition.graphite ? parseFloat(data.materialComposition.graphite) : undefined,
        lead_pct: data.materialComposition.lead ? parseFloat(data.materialComposition.lead) : undefined,
        recycled_cobalt_pct: data.materialComposition.recycled_cobalt ? parseFloat(data.materialComposition.recycled_cobalt) : undefined,
        recycled_lithium_pct: data.materialComposition.recycled_lithium ? parseFloat(data.materialComposition.recycled_lithium) : undefined,
        recycled_nickel_pct: data.materialComposition.recycled_nickel ? parseFloat(data.materialComposition.recycled_nickel) : undefined,
        recycled_lead_pct: data.materialComposition.recycled_lead ? parseFloat(data.materialComposition.recycled_lead) : undefined,
      };
      const hasMaterial = Object.values(materialPayload).some((v) => typeof v === "number" && v > 0);
      if (hasMaterial) {
        (payload.specs as Record<string, unknown>).material_composition = materialPayload;
      }

      // Add hazardous substances
      (payload.specs as Record<string, unknown>).hazardous_substances = {
        lead_present: data.hazardousSubstances.lead,
        mercury_present: data.hazardousSubstances.mercury,
        cadmium_present: data.hazardousSubstances.cadmium,
        declaration: data.hazardousDeclaration,
      };

      // Add certificate dates
      (payload.specs as Record<string, unknown>).bis_certificate_issue_date = data.bisCertificateIssueDate || undefined;
      (payload.specs as Record<string, unknown>).un38_3_test_date = data.un383TestDate || undefined;
      (payload.specs as Record<string, unknown>).iec_62133_test_date = data.iec62133TestDate || undefined;
      (payload.specs as Record<string, unknown>).msds_issue_date = data.msdsIssueDate || undefined;
      (payload.specs as Record<string, unknown>).gtin = data.gtin || undefined;

      // Add India-specific extras
      if (data.marketRegion === "INDIA") {
        if (data.bisNumber) payload.bis_number = data.bisNumber;
        if (data.eprNumber) payload.epr_number = data.eprNumber;
        // CA Certificate for audited DVA mode
        if (data.uploadedFileUrl) payload.pli_certificate_url = data.uploadedFileUrl;
      }

      // Declaration of Conformity (EU/Global)
      if ((data.marketRegion === "EU" || data.marketRegion === "GLOBAL") && data.docUploadUrl) {
        payload.declaration_of_conformity_path = data.docUploadUrl;
      }

      const createRes = await api.post<{ batch?: { id?: string } }>(
        "/batches",
        payload,
      );
      const newBatchId = createRes.data?.batch?.id;

      // Persist the calculator payload after create (screening estimate). Free-text
      // carbonFootprint is already on specs; the gate only reads this JSON.
      if (
        newBatchId &&
        isCarbonResultCurrent(data) &&
        isCarbonResultPayload(data.carbonFootprintResult)
      ) {
        try {
          await saveCarbonToBatch(
            newBatchId,
            data.carbonFootprintResult as unknown as CarbonResult,
          );
        } catch {
          toast.warning(
            "Batch created, but the carbon calculator result did not save. Open the Carbon tab on the batch to retry.",
          );
        }
      }

      // Save template
      if (data.saveAsTemplate && data.templateName.trim()) {
        try {
          const templateSpecs: Record<string, unknown> = {
            ...(payload.specs as Record<string, unknown>),
            cell_source: data.cellSource || undefined,
            hsn_code: data.hsnCode || undefined,
            bis_number: data.bisNumber || undefined,
            epr_number: data.eprNumber || undefined,
          };
          await api.post("/templates", {
            tenant_id: user.tenant_id,
            name: data.templateName.trim(),
            market_region: data.marketRegion,
            product_type: "BATTERY",
            specs: {
              ...templateSpecs,
              bis_certificate_issue_date: data.bisCertificateIssueDate || undefined,
              un38_3_test_date: data.un383TestDate || undefined,
              iec_62133_test_date: data.iec62133TestDate || undefined,
              msds_issue_date: data.msdsIssueDate || undefined,
              gtin: data.gtin || undefined,
            },
          });
          toast.success(`Template "${data.templateName}" saved for ${data.marketRegion} market`);
        } catch {
          // silent fail for template save
        }
      }

      toast.success("Batch created successfully");
      setWizardOpen(false);
      onBatchCreated();
      reset({ ...defaultBatchFormValues, manufacturer: user?.company_name || "" });
      setStep(0);
      if (currentDraftId) deleteDraftSlot(user.tenant_id, currentDraftId);
      setCurrentDraftId("");
      setLastSavedAt(null);
      setAiFilledFields(new Set());
      setSettingsFilledFields(new Set());
      setRetryPayload(null);

      // Take the user straight to the new batch — the activation checklist,
      // compliance gaps, and passport tools all live on the detail page.
      if (newBatchId) {
        router.push(
          `${dashboardPathFromPathname(pathname, "batches")}/${newBatchId}`,
        );
      }
    } catch (error: unknown) {
      const apiError = error as {
        message?: string;
        response?: {
          status?: number;
          statusText?: string;
          data?: { error?: string; fields?: Array<{ field: string; message: string }> };
        };
      };

      let errMsg = "Failed to create batch";
      if (apiError.response?.data?.error) {
        errMsg = apiError.response.data.error;
      } else if (apiError.response?.data?.fields && apiError.response.data.fields.length > 0) {
        // Map backend validation errors to form fields
        const backendFields = apiError.response.data.fields;
        const formPathErrors: Array<{ field: string; message: string }> = [];
        backendFields.forEach((bf) => {
          const formPath = mapBackendFieldToFormPath(bf.field);
          if (formPath) {
            setError(formPath as keyof BatchFormData, { type: "manual", message: bf.message });
            formPathErrors.push({ field: formPath, message: bf.message });
          }
        });
        // Auto-navigate to first error's step
        if (formPathErrors.length > 0) {
          setStep(getStepForField(formPathErrors[0].field));
        }
        errMsg = `Please fix the highlighted ${formPathErrors.length} field(s) before submitting.`;
      } else if (apiError.response?.statusText) {
        errMsg = `Server error (${apiError.response.status}): ${apiError.response.statusText}`;
      } else if (apiError.message && apiError.message !== "Failed to create batch") {
        errMsg = apiError.message;
      }

      setRetryPayload(data);
      toast.error(errMsg, {
        action: {
          label: "Retry",
          onClick: () => {
            if (retryPayload || data) {
              handleSubmit(onSubmit)();
            }
          },
        },
        duration: 15000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setEntryOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Batch
      </Button>
      <BatchEntryModal
        open={entryOpen}
        onOpenChange={setEntryOpen}
        tenantId={user?.tenant_id}
        templates={templates}
        onChoice={handleEntryChoice}
      />
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="flex flex-col w-screen h-screen max-w-none sm:max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none border-0 p-0 gap-0 bg-background text-foreground">
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                // Only the Review step may submit. On earlier steps, swallow
                // Enter so a keystroke in a field can't create the batch before
                // the user reaches Review. Textareas keep their newline behavior.
                if (
                  e.key === "Enter" &&
                  step < STEPS.length - 1 &&
                  (e.target as HTMLElement).tagName !== "TEXTAREA"
                ) {
                  e.preventDefault();
                }
              }}
              className="flex flex-col h-full min-h-0"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-6 h-14 shrink-0">
                <div className="flex flex-col">
                  <DialogTitle className="text-base">{t("wizard_title")}</DialogTitle>
                  <DialogDescription className="text-xs">
                    Step {step + 1} of {STEPS.length}: {translatedSteps[step].label} — {translatedSteps[step].description}
                  </DialogDescription>
                </div>
              </div>

              {/* Body: rail · center · summary */}
              <div className="flex flex-1 min-h-0">
                {/* Left step rail (md+) */}
                <div className="hidden md:block w-56 shrink-0 overflow-y-auto border-r border-border">
                  <WizardStepRail steps={translatedSteps} current={step} onSelect={setStep} />
                </div>

                {/* Center column */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                  {/* Compact stepper (mobile) */}
                  <div className="md:hidden flex items-center gap-2 overflow-x-auto border-b border-border px-4 py-3">
                    {translatedSteps.map((s, idx) => (
                      <div key={s.id} className="flex shrink-0 items-center gap-2">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                            idx < step
                              ? "bg-foreground text-background"
                              : idx === step
                                ? "bg-background text-foreground ring-2 ring-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx < step ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </span>
                        <span className={`text-xs ${idx === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {s.label}
                        </span>
                        {idx < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
                      </div>
                    ))}
                  </div>

                  <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
                    {step === 0 && (
                      <div className="space-y-8">
                        <StepIdentity
                          initialAiMode={pendingAiMode}
                          aiFilledFields={aiFilledFields}
                          onAiFill={handleAiFill}
                          settingsFilledFields={settingsFilledFields}
                        />
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-t border-border pt-6">
                          Battery Specs
                        </div>
                        <StepSpecs aiFilledFields={aiFilledFields} settingsFilledFields={settingsFilledFields} />
                      </div>
                    )}
                    {step === 1 && (
                      <StepCompliance
                        isUploading={isUploading}
                        uploadProgress={uploadProgress}
                        onDocUpload={handleDocUpload}
                        onCertificateUpload={handleCertificateUpload}
                        iecError={iecError}
                        user={user}
                        aiFilledFields={aiFilledFields}
                        settingsFilledFields={settingsFilledFields}
                        primaryMarket={user?.data_visibility?.primary_market}
                        onFillFromProfile={handleFillComplianceFromProfile}
                      />
                    )}
                    {step === 2 && <StepReview onJumpToStep={setStep} aiFilledFields={aiFilledFields} iecError={iecError} />}
                  </div>
                </div>

                {/* Right summary panel (lg+) */}
                <div className="hidden lg:block">
                  <WizardSummaryPanel user={user} onJumpToStep={setStep} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || isLoading}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("wizard_back")}
                  </Button>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {stepFieldCounts[step].label}
                  </span>
                  {lastSavedAt && (
                    <span className="text-[10px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${saveFlash ? "animate-pulse" : ""}`} />
                      {saveFlash ? "Saving…" : "Saved"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="ghost" onClick={handleSaveAndExit} disabled={isLoading}>
                    {t("wizard_save_exit")}
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button type="button" onClick={goNext} disabled={isLoading || isValidating}>
                      {t("wizard_next")}: {translatedSteps[step + 1].label}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading || !isSubmitReady}>
                      {isLoading ? t("wizard_creating") : t("wizard_create_batch")}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
