"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import api from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle, Sparkles, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useTemplates, type Template } from "@/hooks/use-queries";
import {
  batchFormSchema,
  defaultBatchFormValues,
  type BatchFormData,
  type MarketRegion,
} from "@/components/batches/batch-form-schema";
import {
  scheduleDraftSave,
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/batch-draft";
import { StepIdentity } from "@/components/batches/batch-form-steps/step-identity";
import { StepSpecs } from "@/components/batches/batch-form-steps/step-specs";
import { StepCompliance } from "@/components/batches/batch-form-steps/step-compliance";
import { StepReview } from "@/components/batches/batch-form-steps/step-review";

interface CreateBatchWizardProps {
  onBatchCreated: () => void;
}

const STEPS = [
  { id: 0, label: "Identity", description: "Basic info & market" },
  { id: 1, label: "Specifications", description: "Chemistry & materials" },
  { id: 2, label: "Compliance", description: "Market-specific rules" },
  { id: 3, label: "Review", description: "Verify & submit" },
];

export function CreateBatchWizard({ onBatchCreated }: CreateBatchWizardProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // IEC validation
  const [iecError, setIecError] = useState(false);

  // Retry state
  const [retryPayload, setRetryPayload] = useState<BatchFormData | null>(null);

  const methods = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      ...defaultBatchFormValues,
      manufacturer: user?.company_name || "",
    },
    mode: "onBlur",
  });

  const {
    watch,
    setValue,
    reset,
    handleSubmit,
    trigger,
    formState: { errors, isDirty },
  } = methods;

  const marketRegion = watch("marketRegion");
  const cellSource = watch("cellSource");

  // Fetch templates via React Query (cached, deduped)
  const { data: templatesData } = useTemplates(user?.tenant_id, "BATTERY");

  // Sync React Query data to local state for template dropdown
  useEffect(() => {
    if (templatesData) {
      setTemplates(templatesData);
    }
  }, [templatesData]);

  // Auto-save draft on form changes (debounced)
  useEffect(() => {
    if (!open || !user) return;
    const subscription = watch((value) => {
      if (isDirty) {
        scheduleDraftSave(user.tenant_id, value as BatchFormData, step);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isDirty, user, open, step]);

  // Pre-fill EU rep from user profile when dialog opens + offer draft resume
  useEffect(() => {
    if (open && user) {
      if (user?.eu_authorized_representative_name) {
        setValue("euRepresentative", user.eu_authorized_representative_name);
      }
      if (user?.eu_contact_email) {
        setValue("euRepresentativeEmail", user.eu_contact_email);
      }
      if (user?.eu_authorized_representative_address) {
        setValue("euRepresentativeAddress", user.eu_authorized_representative_address);
      }

      // Offer to resume draft
      const draft = loadDraft(user.tenant_id);
      if (draft) {
        const savedAt = new Date(draft.savedAt);
        const timeAgo = Math.round((Date.now() - savedAt.getTime()) / 60000);
        const timeText = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`;
        toast.info(`Draft found from ${timeText}`, {
          action: {
            label: "Resume",
            onClick: () => {
              reset(draft.data);
              setStep(draft.step);
              toast.success("Draft resumed");
            },
          },
          duration: 10000,
        });
      }
    }
  }, [open, setValue, reset, user]);

  // Auto-disable PLI and validate IEC for imported cells
  useEffect(() => {
    if (cellSource === "IMPORTED") {
      setValue("pliCompliant", false);
      setIecError(!user?.iec_code);
    } else {
      setIecError(false);
    }
  }, [cellSource, setValue, user?.iec_code]);

  // Template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
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
    if (specs.hsn_code) updates.hsnCode = specs.hsn_code as string;
    if (specs.bis_number) updates.bisNumber = specs.bis_number as string;
    if (specs.epr_number) updates.eprNumber = specs.epr_number as string;
    if (specs.sale_price_inr) updates.salePrice = (specs.sale_price_inr as number).toString();
    if (specs.import_cost_inr) updates.importCost = (specs.import_cost_inr as number).toString();
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

    reset({ ...watch(), ...updates });
    toast.success(`Loaded "${template.name}" template (${template.market_region} market)`);
  };

  // File upload handlers
  const handleCertificateUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const timestamp = Date.now();
      const sanitized = watch("batchName").replace(/[^a-zA-Z0-9-]/g, "_") || "unnamed";
      const filePath = `certificates/${user.tenant_id}/${sanitized}_${timestamp}.pdf`;
      setUploadProgress(30);
      const { error } = await supabase.storage.from("compliance-docs").upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      setUploadProgress(70);
      const { data: { publicUrl } } = supabase.storage.from("compliance-docs").getPublicUrl(filePath);
      setUploadProgress(100);
      setValue("uploadedFileUrl", publicUrl);
      toast.success("Certificate uploaded successfully");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Upload failed");
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
      const timestamp = Date.now();
      const sanitized = watch("batchName").replace(/[^a-zA-Z0-9-]/g, "_") || "unnamed";
      const filePath = `declarations/${user.tenant_id}/${sanitized}_${timestamp}.pdf`;
      setUploadProgress(30);
      const { error } = await supabase.storage.from("compliance-docs").upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      setUploadProgress(70);
      const { data: { publicUrl } } = supabase.storage.from("compliance-docs").getPublicUrl(filePath);
      setUploadProgress(100);
      setValue("docUploadUrl", publicUrl);
      toast.success("Declaration of Conformity uploaded");
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Step navigation
  const canGoNext = async () => {
    const fieldsByStep: (keyof BatchFormData)[][] = [
      ["batchName", "modelName", "manufacturingStartDate", "manufacturingEndDate", "marketRegion", "manufacturer"],
      ["chemistry", "batteryCategory", "capacity", "voltage", "materialComposition"],
      ["carbonFootprint", "carbonPerformanceClass", "expectedLifetime", "warrantyMonths", "hsnCode", "cellSource", "billOfEntryNo", "cellCountryOfOrigin", "customsDate", "auditedDva", "uploadedFileUrl"],
      ["templateName"],
    ];
    const valid = await trigger(fieldsByStep[step]);
    return valid;
  };

  const goNext = async () => {
    const ok = await canGoNext();
    if (ok && step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Submit
  const onSubmit = async (data: BatchFormData) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        tenant_id: user.tenant_id,
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
        },
      };

      // EU / GLOBAL
      if (data.marketRegion === "EU" || data.marketRegion === "GLOBAL") {
        (payload.specs as Record<string, unknown>).carbon_footprint = data.carbonFootprint;
        (payload.specs as Record<string, unknown>).certifications = data.certifications;

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

        if (data.recycledContent !== "") {
          (payload.specs as Record<string, unknown>).recycled_content_pct = parseFloat(data.recycledContent);
        }

        (payload.specs as Record<string, unknown>).hazardous_substances = {
          lead_present: data.hazardousSubstances.lead,
          mercury_present: data.hazardousSubstances.mercury,
          cadmium_present: data.hazardousSubstances.cadmium,
          declaration: data.hazardousDeclaration,
        };

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
        payload.declaration_of_conformity_path = data.docUploadUrl ?? undefined;
        (payload.specs as Record<string, unknown>).iec_62133_test_date = data.iec62133TestDate || undefined;
        (payload.specs as Record<string, unknown>).msds_issue_date = data.msdsIssueDate || undefined;
        if (data.warrantyMonths !== "") {
          (payload.specs as Record<string, unknown>).warranty_months = parseInt(data.warrantyMonths);
        }
        (payload.specs as Record<string, unknown>).gtin = data.gtin || undefined;
      }

      // India
      if (data.marketRegion === "INDIA") {
        (payload.specs as Record<string, unknown>).certifications = data.certifications;
        (payload.specs as Record<string, unknown>).bis_certificate_issue_date = data.bisCertificateIssueDate || undefined;
        (payload.specs as Record<string, unknown>).un38_3_test_date = data.un383TestDate || undefined;
        payload.pli_compliant = data.pliCompliant;
        payload.hsn_code = data.hsnCode;
        payload.dva_source = data.dvaSource;

        if (data.dvaSource === "AUDITED") {
          payload.audited_domestic_value_add = parseFloat(data.auditedDva) || 0;
          payload.pli_certificate_url = data.uploadedFileUrl ?? undefined;
        } else {
          const sale = parseFloat(data.salePrice) || 0;
          const cost = parseFloat(data.importCost) || 0;
          (payload.specs as Record<string, unknown>).sale_price_inr = sale;
          (payload.specs as Record<string, unknown>).import_cost_inr = cost;
          payload.domestic_value_add = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        }

        payload.cell_source = data.cellSource || undefined;
        if (data.cellSource === "IMPORTED") {
          payload.bill_of_entry_no = data.billOfEntryNo;
          payload.country_of_origin = data.cellCountryOfOrigin;
          payload.customs_date = data.customsDate;
        }
        if (data.bisNumber) payload.bis_number = data.bisNumber;
        if (data.eprNumber) payload.epr_number = data.eprNumber;
        (payload.specs as Record<string, unknown>).gtin = data.gtin || undefined;
      }

      await api.post("/batches", payload);

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
      setOpen(false);
      onBatchCreated();
      reset({ ...defaultBatchFormValues, manufacturer: user?.company_name || "" });
      setStep(0);
      setSelectedTemplate("");
      clearDraft(user.tenant_id);
      setRetryPayload(null);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      const errMsg = apiError.response?.data?.error || "Failed to create batch";
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
            Step {step + 1} of {STEPS.length}: {STEPS[step].label}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      idx < step
                        ? "bg-emerald-500 text-white"
                        : idx === step
                          ? "bg-blue-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx < step ? <Check className="h-4 w-4" /> : s.id + 1}
                  </div>
                  <span className={`text-[10px] mt-1 ${idx === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < step ? "bg-emerald-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="grid gap-6 px-6 py-4 overflow-y-auto flex-1">
              {/* Template Selector */}
              {templates.length > 0 && step === 0 && (
                <div className="grid gap-2 pb-2 border-b border-border">
                  <Label htmlFor="template" className="flex items-center gap-2 text-foreground">
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
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step Content */}
              {step === 0 && <StepIdentity />}
              {step === 1 && <StepSpecs />}
              {step === 2 && (
                <StepCompliance
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  onDocUpload={handleDocUpload}
                  onCertificateUpload={handleCertificateUpload}
                  iecError={iecError}
                  user={user}
                />
              )}
              {step === 3 && <StepReview />}
            </div>

            <DialogFooter className="border-t border-border px-6 py-4 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={step === 0 || isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext} disabled={isLoading}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || iecError}>
                  {isLoading ? "Creating..." : "Create Batch"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
