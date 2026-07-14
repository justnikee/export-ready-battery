"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Leaf,
  Activity,
  Users,
  Shield,
  FileText,
  Calculator,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useFileDropzone } from "@/hooks/use-file-dropzone";
import { AiBadge, aiFieldClass } from "@/components/batches/batch-form-steps/ai-badge";
import { SettingsBadge } from "@/components/batches/batch-form-steps/settings-badge";
import { calculateEstimatedDVA, calculateImportedCostTotal, type BatchFormData } from "@/components/batches/batch-form-schema";

interface StepComplianceProps {
  isUploading: boolean;
  uploadProgress: number;
  onDocUpload: (file: File) => Promise<void>;
  onCertificateUpload: (file: File) => Promise<void>;
  iecError: boolean;
  user?: { company_name?: string; iec_code?: string } | null;
  aiFilledFields?: Set<string>;
  settingsFilledFields?: Set<string>;
  /** Tenant's onboarding primary market ("eu" | "india" | "both") — used to order GLOBAL compliance blocks. */
  primaryMarket?: string;
  /** Re-runs the Organization Settings pre-fill for EU rep / EPR / BIS fields. Omitted if the wizard has no profile to pull from. */
  onFillFromProfile?: () => void;
}

function sectionCompletion(filled: number, total: number, optional?: boolean) {
  if (optional) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded">
        Optional
      </span>
    );
  }
  const complete = total > 0 && filled >= total;
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 border rounded ${
        complete ? "bg-green-500/10 border-green-500/30 text-green-600" : "bg-muted text-muted-foreground border-border"
      }`}
    >
      {filled} / {total} complete
    </span>
  );
}

export function StepCompliance({
  isUploading,
  uploadProgress,
  onDocUpload,
  onCertificateUpload,
  iecError,
  user,
  aiFilledFields,
  settingsFilledFields,
  primaryMarket,
  onFillFromProfile,
}: StepComplianceProps) {
  const filledByAi = aiFilledFields ?? new Set<string>();
  const filledBySettings = settingsFilledFields ?? new Set<string>();
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();

  const marketRegion = watch("marketRegion");
  const isEUMode = marketRegion === "EU";
  const isIndiaMode = marketRegion === "INDIA";
  const showEU = isEUMode || marketRegion === "GLOBAL";
  const showIndia = isIndiaMode || marketRegion === "GLOBAL";
  const indiaFirst = marketRegion === "GLOBAL" && primaryMarket === "india";
  const cellSource = watch("cellSource");
  const dvaSource = watch("dvaSource");
  const salePrice = watch("salePrice");
  const cellCostImported = watch("cellCostImported");
  const cellCostDomestic = watch("cellCostDomestic");
  const bmsCostImported = watch("bmsCostImported");
  const bmsCostDomestic = watch("bmsCostDomestic");
  const casingCostImported = watch("casingCostImported");
  const casingCostDomestic = watch("casingCostDomestic");
  const labourOverheadCost = watch("labourOverheadCost");
  const docUploadUrl = watch("docUploadUrl");
  const uploadedFileUrl = watch("uploadedFileUrl");
  const pliCompliant = watch("pliCompliant");

  // Watched purely to drive the section-completion badges below
  const carbonFootprint = watch("carbonFootprint");
  const materialComposition = watch("materialComposition");
  const euRepresentative = watch("euRepresentative");
  const euRepresentativeEmail = watch("euRepresentativeEmail");
  const euRepresentativeAddress = watch("euRepresentativeAddress");
  const expectedLifetime = watch("expectedLifetime");
  const warrantyMonths = watch("warrantyMonths");
  const hazardousDeclaration = watch("hazardousDeclaration");
  const carbonPerformanceClass = watch("carbonPerformanceClass");
  const notifiedBodyNumber = watch("notifiedBodyNumber");
  const ceMarking = watch("ceMarking");
  const removableAndReplaceable = watch("removableAndReplaceable");
  const iec62133TestDate = watch("iec62133TestDate");
  const msdsIssueDate = watch("msdsIssueDate");
  const hsnCode = watch("hsnCode");
  const bisNumber = watch("bisNumber");
  const eprNumber = watch("eprNumber");
  const bisCertificateIssueDate = watch("bisCertificateIssueDate");
  const un383TestDate = watch("un383TestDate");
  const auditedDva = watch("auditedDva");
  const billOfEntryNo = watch("billOfEntryNo");
  const cellCountryOfOrigin = watch("cellCountryOfOrigin");
  const customsDate = watch("customsDate");

  const validateAndUpload = (
    file: File,
    uploadFn: (file: File) => Promise<void>
  ): Promise<void> | void => {
    if (file.size > 5242880) {
      toast.error("File size must be less than 5MB");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    return uploadFn(file);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    uploadFn: (file: File) => Promise<void>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateAndUpload(file, uploadFn);
    if (result) {
      result.finally(() => {
        e.target.value = "";
      });
    } else {
      e.target.value = "";
    }
  };

  const { isDragActive: isDocDragActive, dropHandlers: docDropHandlers } = useFileDropzone(
    (file) => validateAndUpload(file, onDocUpload),
    isUploading
  );
  const { isDragActive: isCertDragActive, dropHandlers: certDropHandlers } = useFileDropzone(
    (file) => validateAndUpload(file, onCertificateUpload),
    isUploading
  );

  const carbonSectionFilled = [
    carbonFootprint,
    materialComposition?.recycled_cobalt,
    materialComposition?.recycled_lithium,
    materialComposition?.recycled_nickel,
    materialComposition?.recycled_lead,
  ].filter(Boolean).length;

  const supplyChainFilled = [euRepresentative, euRepresentativeEmail, euRepresentativeAddress].filter(Boolean).length;

  const safetyArt7Filled = [
    expectedLifetime,
    warrantyMonths,
    hazardousDeclaration,
    carbonPerformanceClass,
    notifiedBodyNumber,
    ceMarking,
    removableAndReplaceable,
    iec62133TestDate,
    msdsIssueDate,
  ].filter(Boolean).length;

  const classificationFilled = [hsnCode, cellSource].filter(Boolean).length;
  const bisEprFilled = [bisNumber, eprNumber, bisCertificateIssueDate, un383TestDate].filter(Boolean).length;
  const dvaFilled =
    dvaSource === "AUDITED"
      ? [auditedDva, uploadedFileUrl].filter(Boolean).length
      : [
          salePrice,
          [cellCostImported, cellCostDomestic, bmsCostImported, bmsCostDomestic, casingCostImported, casingCostDomestic, labourOverheadCost].some(Boolean),
        ].filter(Boolean).length;
  const customsFilled = [billOfEntryNo, cellCountryOfOrigin, customsDate].filter(Boolean).length;

  const euBlock = showEU && (
        <div className="space-y-3" key="eu-compliance">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <Leaf className="h-4 w-4 text-muted-foreground" />
            EU Compliance Fields
            {isEUMode && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded border border-border">Required</span>
            )}
          </div>

          <Accordion>
            {/* Carbon & Sustainability */}
            <AccordionItem value="eu-carbon">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                  Carbon & Sustainability
                </span>
                {sectionCompletion(carbonSectionFilled, 5)}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2">
                  <Label htmlFor="carbonFootprint" className="text-foreground flex items-center gap-1.5">
                    Carbon Footprint
                    {isEUMode && <span className="text-red-500">*</span>}
                    {filledByAi.has("carbonFootprint") && <AiBadge />}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="carbonFootprint"
                      {...register("carbonFootprint")}
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 10"
                      className={`bg-transparent text-foreground ${errors.carbonFootprint ? "border-red-500" : "border-border"} ${aiFieldClass(filledByAi.has("carbonFootprint"))}`}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">kg CO₂e</span>
                  </div>
                  {errors.carbonFootprint && <p className="text-xs text-red-500 mt-0.5">{errors.carbonFootprint.message}</p>}
                </div>

                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-2 text-foreground text-xs border-b border-border pb-1">
                    <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                    Recycled Content per Material (%)
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">EU Art. 8</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "recycled_cobalt" as const, label: "Cobalt", target: "16% by 2030" },
                      { key: "recycled_lithium" as const, label: "Lithium", target: "6% by 2030" },
                      { key: "recycled_nickel" as const, label: "Nickel", target: "6% by 2030" },
                      { key: "recycled_lead" as const, label: "Lead", target: "85% by 2030" },
                    ]).map(({ key, label, target }) => (
                      <div key={key} className="grid gap-1">
                        <Label htmlFor={key} className="text-xs text-muted-foreground">
                          {label} <span className="text-[10px] text-muted-foreground">({target})</span>
                        </Label>
                        <Input
                          id={key}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          {...register(`materialComposition.${key}` as const)}
                          placeholder="0.0"
                          className="h-8 text-xs bg-transparent border-border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Responsible Supply Chain */}
            <AccordionItem value="eu-supply-chain">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Responsible Supply Chain
                </span>
                {sectionCompletion(supplyChainFilled, 3)}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="euRepresentative" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      EU Representative
                      {filledByAi.has("euRepresentative") && <AiBadge />}
                      {filledBySettings.has("euRepresentative") && <SettingsBadge />}
                    </Label>
                    <Input id="euRepresentative" {...register("euRepresentative")} placeholder="Company Name" className={`h-8 text-xs bg-transparent border-border ${aiFieldClass(filledByAi.has("euRepresentative"))}`} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="euRepresentativeEmail" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Rep Email
                      {filledByAi.has("euRepresentativeEmail") && <AiBadge />}
                      {filledBySettings.has("euRepresentativeEmail") && <SettingsBadge />}
                    </Label>
                    <Input id="euRepresentativeEmail" {...register("euRepresentativeEmail")} placeholder="email@eu-rep.com" className={`h-8 text-xs bg-transparent border-border ${aiFieldClass(filledByAi.has("euRepresentativeEmail"))}`} />
                  </div>
                  <div className="grid gap-1 col-span-2">
                    <Label htmlFor="euRepresentativeAddress" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      EU Representative Address
                      {filledByAi.has("euRepresentativeAddress") && <AiBadge />}
                      {filledBySettings.has("euRepresentativeAddress") && <SettingsBadge />}
                    </Label>
                    <Input id="euRepresentativeAddress" {...register("euRepresentativeAddress")} placeholder="Street, City, Postal Code, Country" className={`h-8 text-xs bg-transparent border-border ${aiFieldClass(filledByAi.has("euRepresentativeAddress"))}`} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sustainability & Safety + Art. 7+ */}
            <AccordionItem value="eu-safety-art7">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Sustainability & Safety + Art. 7+
                </span>
                {sectionCompletion(safetyArt7Filled, 9)}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="expectedLifetime" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Lifetime (Cycles)
                      {filledByAi.has("expectedLifetime") && <AiBadge />}
                    </Label>
                    <Input id="expectedLifetime" type="number" {...register("expectedLifetime")} placeholder="e.g. 1000" className={`h-8 text-xs bg-transparent ${errors.expectedLifetime ? "border-red-500" : "border-border"} ${aiFieldClass(filledByAi.has("expectedLifetime"))}`} />
                    {errors.expectedLifetime && <p className="text-xs text-red-500 mt-0.5">{errors.expectedLifetime.message}</p>}
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="warrantyMonths" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Warranty (Months)
                      {filledByAi.has("warrantyMonths") && <AiBadge />}
                    </Label>
                    <Input id="warrantyMonths" type="number" {...register("warrantyMonths")} placeholder="e.g. 24" className={`h-8 text-xs bg-transparent ${errors.warrantyMonths ? "border-red-500" : "border-border"} ${aiFieldClass(filledByAi.has("warrantyMonths"))}`} />
                    {errors.warrantyMonths && <p className="text-xs text-red-500 mt-0.5">{errors.warrantyMonths.message}</p>}
                  </div>
                </div>

                <div className="grid gap-2 pt-3">
                  <Label className="text-xs text-muted-foreground">Hazardous Substances (Check if present)</Label>
                  <div className="flex gap-4">
                    {(["lead", "mercury", "cadmium"] as const).map((key) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`haz-${key}`}
                          {...register(`hazardousSubstances.${key}`)}
                          className="h-3.5 w-3.5 rounded border-border bg-transparent text-foreground focus:ring-foreground"
                        />
                        <Label htmlFor={`haz-${key}`} className="text-xs capitalize font-normal cursor-pointer text-foreground">
                          {key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 pt-3">
                  <Label htmlFor="hazardousDeclaration" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Hazardous Substances Declaration
                    {filledByAi.has("hazardousDeclaration") && <AiBadge />}
                  </Label>
                  <Input id="hazardousDeclaration" {...register("hazardousDeclaration")} placeholder="Declaration statement required for EU compliance" className={`h-8 text-xs bg-transparent border-border ${aiFieldClass(filledByAi.has("hazardousDeclaration"))}`} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="grid gap-1">
                    <Label htmlFor="carbonPerformanceClass" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Carbon Performance Class
                      {filledByAi.has("carbonPerformanceClass") && <AiBadge />}
                    </Label>
                    <Select value={watch("carbonPerformanceClass")} onValueChange={(v) => setValue("carbonPerformanceClass", v, { shouldValidate: true, shouldDirty: true })}>
                      <SelectTrigger id="carbonPerformanceClass" className={`h-8 text-xs bg-transparent ${errors.carbonPerformanceClass ? "border-red-500" : "border-border"} ${aiFieldClass(filledByAi.has("carbonPerformanceClass"))}`}>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A","B","C","D","E"].map((c) => (
                          <SelectItem key={c} value={c}>{c} {c === "A" ? "— Best" : c === "E" ? "— Worst" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.carbonPerformanceClass && <p className="text-xs text-red-500 mt-0.5">{errors.carbonPerformanceClass.message}</p>}
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="notifiedBodyNumber" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Notified Body No.
                      {filledByAi.has("notifiedBodyNumber") && <AiBadge />}
                    </Label>
                    <Input id="notifiedBodyNumber" {...register("notifiedBodyNumber")} placeholder="e.g. 0123" className={`h-8 text-xs bg-transparent border-border ${aiFieldClass(filledByAi.has("notifiedBodyNumber"))}`} />
                  </div>
                </div>

                <div className="flex gap-4 pt-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="ceMarking" {...register("ceMarking")} className="h-3.5 w-3.5 rounded border-border bg-transparent text-foreground focus:ring-foreground" />
                    <Label htmlFor="ceMarking" className="text-xs font-normal cursor-pointer text-foreground">CE Marking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="removableReplaceable" {...register("removableAndReplaceable")} className="h-3.5 w-3.5 rounded border-border bg-transparent text-foreground focus:ring-foreground" />
                    <Label htmlFor="removableReplaceable" className="text-xs font-normal cursor-pointer text-foreground">Removable & Replaceable</Label>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-2 text-foreground text-xs border-b border-border pb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Certificate Dates
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="iec62133TestDate" className="text-xs text-muted-foreground">IEC 62133 Test Date</Label>
                      <Input id="iec62133TestDate" type="date" {...register("iec62133TestDate")} className="h-8 text-xs bg-transparent border-border" />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="msdsIssueDate" className="text-xs text-muted-foreground">MSDS Issue Date</Label>
                      <Input id="msdsIssueDate" type="date" {...register("msdsIssueDate")} className="h-8 text-xs bg-transparent border-border" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Declaration of Conformity (optional) */}
            <AccordionItem value="eu-doc">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Declaration of Conformity
                </span>
                {sectionCompletion(docUploadUrl ? 1 : 0, 1, !docUploadUrl)}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Declaration of Conformity (PDF)</Label>
                  {!docUploadUrl ? (
                    <label
                      {...docDropHandlers}
                      className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed cursor-pointer transition-colors ${isUploading ? "border-foreground bg-muted/50" : isDocDragActive ? "border-foreground bg-accent" : "border-border bg-background hover:bg-accent"}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        {isUploading ? (
                          <>
                            <div className="w-full px-8 mb-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-foreground h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Uploading... ({uploadProgress}%)</p>
                          </>
                        ) : (
                          <>
                            <FileText className="w-6 h-6 mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {isDocDragActive ? "Drop your PDF here" : (<><span className="">Click to upload</span> or drag and drop</>)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">PDF only (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input type="file" className="hidden" accept=".pdf" disabled={isUploading} onChange={(e) => handleFileChange(e, onDocUpload)} />
                    </label>
                  ) : (
                    <div className="p-3 bg-muted/50 border border-border rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> DoC uploaded</span>
                        <div className="flex gap-2">
                          <a href={docUploadUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-accent transition-colors border border-border">View</a>
                          <button type="button" onClick={() => setValue("docUploadUrl", null, { shouldValidate: true, shouldDirty: true })} className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted transition-colors">Remove</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      );

  const indiaBlock = showIndia && (
        <div className="space-y-3" key="india-compliance">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            India Compliance Fields
            <span className="text-xs bg-muted px-2 py-0.5 rounded border border-border">Required</span>
          </div>

          <Accordion>
            {/* Classification & Cell Source */}
            <AccordionItem value="in-classification">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Classification & Cell Source
                </span>
                {sectionCompletion(classificationFilled, 2)}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2">
                  <Label htmlFor="hsnCode" className="text-foreground flex items-center gap-1.5">
                    HSN Code <span className="text-red-500">*</span>
                    {filledByAi.has("hsnCode") && <AiBadge />}
                  </Label>
                  <Input
                    id="hsnCode"
                    {...register("hsnCode")}
                    placeholder='e.g. 85076000'
                    className={`bg-transparent text-foreground ${errors.hsnCode ? "border-red-500" : "border-border"} ${aiFieldClass(filledByAi.has("hsnCode"))}`}
                  />
                  {errors.hsnCode && <p className="text-xs text-red-500 mt-1">{errors.hsnCode.message}</p>}
                </div>

                <div className="grid gap-2 pt-3">
                  <Label htmlFor="cellSource" className="text-foreground">
                    Cell Source <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={cellSource || undefined}
                    onValueChange={(v) => {
                      setValue("cellSource", v as "IMPORTED" | "DOMESTIC", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      if (v === "IMPORTED") {
                        setValue("pliCompliant", false, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      id="cellSource"
                      className={`h-10 text-sm bg-transparent ${
                        errors.cellSource ? "border-red-500" : "border-border"
                      }`}
                    >
                      <SelectValue placeholder="-- Select Cell Source --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOMESTIC">🏭 Domestic (Enables DVA Calculator)</SelectItem>
                      <SelectItem value="IMPORTED">📦 Imported (Requires IEC Code)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.cellSource ? (
                    <p className="text-[10px] text-red-500">{errors.cellSource.message}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Required for India compliance. Determines customs and PLI eligibility.</p>
                  )}
                </div>

                {iecError && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-200 rounded text-red-400 text-xs">
                    ⚠️ IEC Code is required for imported cells — add it in Organization Settings
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* BIS / EPR & Certificate Dates */}
            <AccordionItem value="in-bis-epr">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  BIS / EPR & Certificate Dates
                </span>
                {sectionCompletion(bisEprFilled, 4)}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bisNumber" className="text-foreground flex items-center gap-1.5">
                      BIS Number
                      {filledByAi.has("bisNumber") && <AiBadge />}
                      {filledBySettings.has("bisNumber") && <SettingsBadge />}
                    </Label>
                    <Input id="bisNumber" {...register("bisNumber")} placeholder="e.g. R-12345678" className={`bg-transparent text-foreground border-border ${aiFieldClass(filledByAi.has("bisNumber"))}`} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="eprNumber" className="text-foreground flex items-center gap-1.5">
                      EPR Number
                      {filledByAi.has("eprNumber") && <AiBadge />}
                      {filledBySettings.has("eprNumber") && <SettingsBadge />}
                    </Label>
                    <Input id="eprNumber" {...register("eprNumber")} placeholder="e.g. EPR-12345" className={`bg-transparent text-foreground border-border ${aiFieldClass(filledByAi.has("eprNumber"))}`} />
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-2 text-foreground text-xs border-b border-border pb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Certificate Dates
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="bisCertificateIssueDate" className="text-xs text-muted-foreground">BIS Certificate Issue Date</Label>
                      <Input id="bisCertificateIssueDate" type="date" {...register("bisCertificateIssueDate")} className="h-8 text-xs bg-transparent border-border" />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="un383TestDate" className="text-xs text-muted-foreground">UN38.3 Test Date</Label>
                      <Input id="un383TestDate" type="date" {...register("un383TestDate")} className="h-8 text-xs bg-transparent border-border" />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Domestic Value Add */}
            <AccordionItem value="in-dva">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  Domestic Value Add
                </span>
                {cellSource === "IMPORTED" ? sectionCompletion(0, 0, true) : sectionCompletion(dvaFilled, 2)}
              </AccordionTrigger>
              <AccordionContent>
                {cellSource !== "IMPORTED" && (
                  <>
                    <div className="grid gap-2">
                      <Label className="text-foreground">Domestic Value Add (DVA) Mode</Label>
                      <div className="flex gap-2">
                        {(["ESTIMATED", "AUDITED"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setValue("dvaSource", mode, { shouldValidate: true, shouldDirty: true })}
                            className={`flex-1 p-2 text-xs border transition-colors ${
                              dvaSource === mode
                                ? "border-foreground bg-accent text-foreground"
                                : "border-border text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {mode === "ESTIMATED" ? "📊 Indicative Estimator" : "📋 Audited (CA Certified)"}
                          </button>
                        ))}
                      </div>
                      {errors.dvaSource && <p className="text-xs text-red-500 mt-0.5">{errors.dvaSource.message}</p>}
                    </div>

                    {dvaSource === "AUDITED" ? (
                      <div className="space-y-4 pt-3">
                        <div className="grid gap-2">
                          <Label htmlFor="auditedDva" className="text-foreground">
                            Audited DVA % <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="auditedDva"
                            type="number"
                            min="0"
                            max="100"
                            {...register("auditedDva")}
                            placeholder="e.g. 65"
                            className={`bg-transparent text-foreground ${errors.auditedDva ? "border-red-500" : "border-border"}`}
                          />
                          {errors.auditedDva && <p className="text-xs text-red-500 mt-1">{errors.auditedDva.message}</p>}
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-foreground">
                            CA Certificate (PDF) <span className="text-red-500">*</span>
                          </Label>
                          {!uploadedFileUrl ? (
                            <label
                              {...certDropHandlers}
                              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed cursor-pointer transition-colors ${errors.uploadedFileUrl ? "border-red-500 bg-red-500/10" : isUploading ? "border-foreground bg-muted/50" : isCertDragActive ? "border-foreground bg-accent" : "border-border bg-background hover:bg-accent"}`}
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {isUploading ? (
                                  <>
                                    <div className="w-full px-8 mb-3">
                                      <div className="w-full bg-muted rounded-full h-2">
                                        <div className="bg-foreground h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Uploading... ({uploadProgress}%)</p>
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      {isCertDragActive ? "Drop your PDF here" : (<><span className="">Click to upload</span> or drag and drop</>)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                                  </>
                                )}
                              </div>
                              <input type="file" className="hidden" accept=".pdf" disabled={isUploading} onChange={(e) => handleFileChange(e, onCertificateUpload)} />
                            </label>
                          ) : (
                            <div className="p-4 bg-muted/50 border border-border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">Certificate Uploaded</p>
                                    <p className="text-xs text-muted-foreground">Ready for submission</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-accent transition-colors border border-border">View File</a>
                                  <button type="button" onClick={() => setValue("uploadedFileUrl", null, { shouldValidate: true, shouldDirty: true })} className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted transition-colors">Replace</button>
                                </div>
                              </div>
                            </div>
                          )}
                          {errors.uploadedFileUrl && <p className="text-xs text-red-500 mt-1">{errors.uploadedFileUrl.message}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calculator className="h-4 w-4 text-muted-foreground" />
                          DVA Cost Breakdown Estimator
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="salePrice" className="text-foreground">Ex-Factory Sale Price (₹)</Label>
                          <Input id="salePrice" type="number" min="0" {...register("salePrice")} placeholder="0.00" className={`bg-transparent text-foreground max-w-xs ${errors.salePrice ? "border-red-500" : "border-border"}`} />
                          {errors.salePrice && <p className="text-xs text-red-500 mt-0.5">{errors.salePrice.message}</p>}
                        </div>

                        {/* Component cost breakdown: imported vs domestic per the MHI PLI-ACC formula */}
                        <div className="border border-border rounded">
                          <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                            <span>Component</span>
                            <span>Imported (₹)</span>
                            <span>Domestic (₹)</span>
                          </div>
                          {(
                            [
                              { label: "Cell", importedField: "cellCostImported", domesticField: "cellCostDomestic" },
                              { label: "BMS", importedField: "bmsCostImported", domesticField: "bmsCostDomestic" },
                              { label: "Casing / Structural", importedField: "casingCostImported", domesticField: "casingCostDomestic" },
                            ] as const
                          ).map((row) => (
                            <div key={row.label} className="grid grid-cols-3 gap-2 px-3 py-2 border-t border-border items-center">
                              <span className="text-xs text-foreground">{row.label}</span>
                              <Input
                                type="number"
                                min="0"
                                {...register(row.importedField)}
                                placeholder="0.00"
                                className={`h-8 text-xs bg-transparent text-foreground ${errors[row.importedField] ? "border-red-500" : "border-border"}`}
                              />
                              <Input
                                type="number"
                                min="0"
                                {...register(row.domesticField)}
                                placeholder="0.00"
                                className={`h-8 text-xs bg-transparent text-foreground ${errors[row.domesticField] ? "border-red-500" : "border-border"}`}
                              />
                            </div>
                          ))}
                          <div className="grid grid-cols-3 gap-2 px-3 py-2 border-t border-border items-center">
                            <span className="text-xs text-foreground">Labour &amp; Overhead</span>
                            <span className="text-xs text-muted-foreground">— (domestic)</span>
                            <Input
                              type="number"
                              min="0"
                              {...register("labourOverheadCost")}
                              placeholder="0.00"
                              className={`h-8 text-xs bg-transparent text-foreground ${errors.labourOverheadCost ? "border-red-500" : "border-border"}`}
                            />
                          </div>
                        </div>

                        {salePrice && (
                          <div className="space-y-2">
                            {(() => {
                              const breakdown = {
                                salePrice, cellCostImported, cellCostDomestic,
                                bmsCostImported, bmsCostDomestic,
                                casingCostImported, casingCostDomestic, labourOverheadCost,
                              };
                              const dva = calculateEstimatedDVA(breakdown);
                              const importedTotal = calculateImportedCostTotal(breakdown);
                              return (
                                <div className={`p-3 rounded border text-center text-sm ${
                                  dva >= 50
                                    ? "bg-muted/50 border-foreground/30 text-foreground"
                                    : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}>
                                  Estimated DVA: {dva.toFixed(1)}%
                                  <span className="ml-1 opacity-80">
                                    {dva >= 50 ? "(Potentially Eligible)" : "(Ineligible)"}
                                  </span>
                                  <div className="mt-1 text-[10px] font-mono opacity-70">
                                    Domestic (cell+BMS+casing+labour) ÷ Sale Price = {dva.toFixed(1)}%
                                    {importedTotal > 0 && ` · ₹${importedTotal.toLocaleString()} imported`}
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="p-3 bg-muted/30 border border-border text-muted-foreground text-xs flex gap-2 items-start">
                              <Activity className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <span><strong className="text-foreground">Note:</strong> This estimate is based on the cost breakdown above and is recalculated server-side from the same numbers. Final PLI eligibility requires certification by a Chartered Accountant.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2 pt-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pliCompliant"
                      {...register("pliCompliant")}
                      disabled={cellSource === "IMPORTED"}
                      className={`h-4 w-4 rounded border-border bg-transparent text-foreground focus:ring-foreground ${cellSource === "IMPORTED" ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                    <Label htmlFor="pliCompliant" className={`font-normal cursor-pointer text-foreground ${cellSource === "IMPORTED" ? "opacity-50" : ""}`}>
                      PLI Subsidy Eligible
                    </Label>
                  </div>
                  {errors.pliCompliant && <p className="text-xs text-red-500">{errors.pliCompliant.message}</p>}
                  {cellSource === "IMPORTED" && (
                    <div className="p-2 bg-muted/30 border border-border rounded text-muted-foreground text-xs flex gap-2 items-start">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <span>⚠️ Imported cells typically constitute &gt;60% of cost, making the batch ineligible for PLI (Requires ≥50% Local Value Add).</span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Customs Declaration — only for imported cells */}
            {cellSource === "IMPORTED" && (
              <AccordionItem value="in-customs">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Customs Declaration
                  </span>
                  {sectionCompletion(customsFilled, 3)}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="billOfEntryNo" className="text-foreground">Bill of Entry No. <span className="text-red-500">*</span></Label>
                      <Input id="billOfEntryNo" {...register("billOfEntryNo")} placeholder="e.g. 1234567" className={`bg-transparent text-foreground ${errors.billOfEntryNo ? "border-red-500" : "border-border"}`} />
                      {errors.billOfEntryNo && <p className="text-xs text-red-500 mt-1">{errors.billOfEntryNo.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cellCountryOfOrigin" className="text-foreground">Cell Country of Origin <span className="text-red-500">*</span></Label>
                      <Input
                        id="cellCountryOfOrigin"
                        {...register("cellCountryOfOrigin")}
                        maxLength={2}
                        placeholder="e.g. CN, KR"
                        className={`bg-transparent text-foreground ${errors.cellCountryOfOrigin ? "border-red-500" : "border-border"}`}
                      />
                      {errors.cellCountryOfOrigin && <p className="text-xs text-red-500 mt-1">{errors.cellCountryOfOrigin.message}</p>}
                    </div>
                  </div>
                  <div className="grid gap-2 pt-3">
                    <Label htmlFor="customsDate" className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Import Date <span className="text-red-500">*</span>
                    </Label>
                    <Input id="customsDate" type="date" {...register("customsDate")} className={`max-w-50 bg-transparent text-foreground ${errors.customsDate ? "border-red-500" : "border-border"}`} />
                    {errors.customsDate && <p className="text-xs text-red-500 mt-1">{errors.customsDate.message}</p>}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      );

  return (
    <div className="space-y-6">
      {onFillFromProfile && (
        <div className="border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">AI Assistant</span>
            <span className="text-xs text-muted-foreground">Pull EU representative & India registration numbers from your profile</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onFillFromProfile}>
            Fill from profile
          </Button>
        </div>
      )}
      {marketRegion === "GLOBAL" && (
        <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded px-3 py-2">
          Showing both EU and India requirements because this batch targets the Global market.
        </p>
      )}
      {indiaFirst ? (
        <>
          {indiaBlock}
          {euBlock}
        </>
      ) : (
        <>
          {euBlock}
          {indiaBlock}
        </>
      )}
    </div>
  );
}
