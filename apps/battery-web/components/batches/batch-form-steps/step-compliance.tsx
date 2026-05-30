"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  Activity,
  Users,
  Shield,
  FileText,
  Calculator,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

interface StepComplianceProps {
  isUploading: boolean;
  uploadProgress: number;
  onDocUpload: (file: File) => Promise<void>;
  onCertificateUpload: (file: File) => Promise<void>;
  iecError: boolean;
  user?: { company_name?: string; iec_code?: string } | null;
}

export function StepCompliance({
  isUploading,
  uploadProgress,
  onDocUpload,
  onCertificateUpload,
  iecError,
  user,
}: StepComplianceProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();

  const marketRegion = watch("marketRegion");
  const isEUMode = marketRegion === "EU";
  const isIndiaMode = marketRegion === "INDIA";
  const cellSource = watch("cellSource");
  const dvaSource = watch("dvaSource");
  const salePrice = watch("salePrice");
  const importCost = watch("importCost");
  const docUploadUrl = watch("docUploadUrl");
  const uploadedFileUrl = watch("uploadedFileUrl");
  const pliCompliant = watch("pliCompliant");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    uploadFn: (file: File) => Promise<void>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5242880) {
      toast.error("File size must be less than 5MB");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    uploadFn(file);
  };

  return (
    <div className="space-y-6">
      {/* ===== EU COMPLIANCE ===== */}
      {(isEUMode || marketRegion === "GLOBAL") && (
        <div className="p-4 border border-blue-500/30 bg-blue-500/10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Leaf className="h-4 w-4" />
            EU Compliance Fields
            {isEUMode && (
              <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded">Required</span>
            )}
          </div>

          {/* Carbon Footprint */}
          <div className="grid gap-2">
            <Label htmlFor="carbonFootprint" className="text-foreground">
              Carbon Footprint (kg CO₂e)
              {isEUMode && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="carbonFootprint"
              {...register("carbonFootprint")}
              placeholder="e.g. 10 kg CO2e"
              className="bg-transparent border-border text-foreground"
            />
          </div>

          {/* Recycled Content per Material */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-emerald-500 text-xs border-b border-emerald-500/20 pb-1">
              <Leaf className="h-3.5 w-3.5" />
              Recycled Content per Material (%)
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">EU Art. 8</span>
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
                    {label} <span className="text-[10px] text-emerald-500">({target})</span>
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

          {/* EU Representative */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-blue-400 text-xs border-b border-blue-500/20 pb-1">
              <Users className="h-3.5 w-3.5" />
              Responsible Supply Chain
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="euRepresentative" className="text-xs text-muted-foreground">EU Representative</Label>
                <Input id="euRepresentative" {...register("euRepresentative")} placeholder="Company Name" className="h-8 text-xs bg-transparent border-border" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="euRepresentativeEmail" className="text-xs text-muted-foreground">Rep Email</Label>
                <Input id="euRepresentativeEmail" {...register("euRepresentativeEmail")} placeholder="email@eu-rep.com" className="h-8 text-xs bg-transparent border-border" />
              </div>
              <div className="grid gap-1 col-span-2">
                <Label htmlFor="euRepresentativeAddress" className="text-xs text-muted-foreground">EU Representative Address</Label>
                <Input id="euRepresentativeAddress" {...register("euRepresentativeAddress")} placeholder="Street, City, Postal Code, Country" className="h-8 text-xs bg-transparent border-border" />
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
                <Label htmlFor="expectedLifetime" className="text-xs text-muted-foreground">Lifetime (Cycles)</Label>
                <Input id="expectedLifetime" type="number" {...register("expectedLifetime")} placeholder="e.g. 1000" className={`h-8 text-xs bg-transparent ${errors.expectedLifetime ? "border-red-500" : "border-border"}`} />
                {errors.expectedLifetime && <p className="text-xs text-red-500 mt-0.5">{errors.expectedLifetime.message}</p>}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="warrantyMonths" className="text-xs text-muted-foreground">Warranty (Months)</Label>
                <Input id="warrantyMonths" type="number" {...register("warrantyMonths")} placeholder="e.g. 24" className={`h-8 text-xs bg-transparent ${errors.warrantyMonths ? "border-red-500" : "border-border"}`} />
                {errors.warrantyMonths && <p className="text-xs text-red-500 mt-0.5">{errors.warrantyMonths.message}</p>}
              </div>
            </div>

            <div className="grid gap-2 pt-1">
              <Label className="text-xs text-muted-foreground">Hazardous Substances (Check if present)</Label>
              <div className="flex gap-4">
                {(["lead", "mercury", "cadmium"] as const).map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`haz-${key}`}
                      {...register(`hazardousSubstances.${key}`)}
                      className="h-3.5 w-3.5 rounded border-border bg-transparent text-blue-500 focus:ring-blue-500"
                    />
                    <Label htmlFor={`haz-${key}`} className="text-xs capitalize font-normal cursor-pointer text-foreground">
                      {key}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hazardousDeclaration" className="text-xs text-muted-foreground">Hazardous Substances Declaration</Label>
              <Input id="hazardousDeclaration" {...register("hazardousDeclaration")} placeholder="Declaration statement required for EU compliance" className="h-8 text-xs bg-transparent border-border" />
            </div>
          </div>

          {/* EU Battery Regulation Art. 7+ */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-blue-400 text-xs border-b border-blue-500/20 pb-1">
              <Shield className="h-3.5 w-3.5" />
              EU Battery Regulation Art. 7+
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="carbonPerformanceClass" className="text-xs text-muted-foreground">Carbon Performance Class</Label>
                <Select value={watch("carbonPerformanceClass")} onValueChange={(v) => setValue("carbonPerformanceClass", v)}>
                  <SelectTrigger id="carbonPerformanceClass" className={`h-8 text-xs bg-transparent ${errors.carbonPerformanceClass ? "border-red-500" : "border-border"}`}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A","B","C","D","E","F","G"].map((c) => (
                      <SelectItem key={c} value={c}>{c} {c === "A" ? "— Best" : c === "G" ? "— Worst" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.carbonPerformanceClass && <p className="text-xs text-red-500 mt-0.5">{errors.carbonPerformanceClass.message}</p>}
              </div>
              <div className="grid gap-1">
                <Label htmlFor="notifiedBodyNumber" className="text-xs text-muted-foreground">Notified Body No.</Label>
                <Input id="notifiedBodyNumber" {...register("notifiedBodyNumber")} placeholder="e.g. 0123" className="h-8 text-xs bg-transparent border-border" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="ceMarking" {...register("ceMarking")} className="h-3.5 w-3.5 rounded border-border bg-transparent text-blue-500 focus:ring-blue-500" />
                <Label htmlFor="ceMarking" className="text-xs font-normal cursor-pointer text-foreground">CE Marking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="removableReplaceable" {...register("removableAndReplaceable")} className="h-3.5 w-3.5 rounded border-border bg-transparent text-blue-500 focus:ring-blue-500" />
                <Label htmlFor="removableReplaceable" className="text-xs font-normal cursor-pointer text-foreground">Removable & Replaceable</Label>
              </div>
            </div>

            {/* Certification Dates */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-blue-400 text-xs border-b border-blue-500/20 pb-1">
                <Calendar className="h-3.5 w-3.5" />
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

            {/* DoC Upload */}
            <div className="grid gap-1 pt-1">
              <Label className="text-xs text-muted-foreground">Declaration of Conformity (PDF)</Label>
              {!docUploadUrl ? (
                <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed cursor-pointer transition-colors ${isUploading ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-background hover:bg-accent"}`}>
                  <div className="flex flex-col items-center justify-center pt-4 pb-4">
                    {isUploading ? (
                      <>
                        <div className="w-full px-8 mb-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                        <p className="text-xs text-emerald-400">Uploading... ({uploadProgress}%)</p>
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground"><span className="">Click to upload</span> or drag and drop</p>
                        <p className="text-[10px] text-muted-foreground">PDF only (MAX. 5MB)</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf" disabled={isUploading} onChange={(e) => handleFileChange(e, onDocUpload)} />
                </label>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-200 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-500">DoC uploaded</span>
                    <div className="flex gap-2">
                      <a href={docUploadUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-emerald-100 text-emerald-500 rounded hover:bg-emerald-200 transition-colors">View</a>
                      <button type="button" onClick={() => setValue("docUploadUrl", null)} className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== INDIA COMPLIANCE ===== */}
      {isIndiaMode && (
        <div className="p-4 border border-orange-500/30 bg-orange-500/10 space-y-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm">
            <Shield className="h-4 w-4" />
            India Compliance Fields
            <span className="text-xs bg-orange-500/20 px-2 py-0.5 rounded">Required</span>
          </div>

          {/* HSN Code */}
          <div className="grid gap-2">
            <Label htmlFor="hsnCode" className="text-foreground">
              HSN Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="hsnCode"
              {...register("hsnCode")}
              placeholder='e.g. 85076000'
              className={`bg-transparent text-foreground ${errors.hsnCode ? "border-red-500" : "border-border"}`}
            />
            {errors.hsnCode && <p className="text-xs text-red-500 mt-1">{errors.hsnCode.message}</p>}
          </div>

          {/* BIS & EPR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bisNumber" className="text-foreground">BIS Number</Label>
              <Input id="bisNumber" {...register("bisNumber")} placeholder="e.g. R-12345678" className="bg-transparent text-foreground border-border" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eprNumber" className="text-foreground">EPR Number</Label>
              <Input id="eprNumber" {...register("eprNumber")} placeholder="e.g. EPR-12345" className="bg-transparent text-foreground border-border" />
            </div>
          </div>

          {/* Certification Dates */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-orange-400 text-xs border-b border-orange-500/20 pb-1">
              <Calendar className="h-3.5 w-3.5" />
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

          {/* IEC Warning */}
          {iecError && (
            <div className="p-3 bg-red-500/10 border border-red-200 rounded text-red-400 text-xs">
              ⚠️ IEC Code is required for imported cells — add it in Organization Settings
            </div>
          )}

          {/* DVA Section */}
          {cellSource !== "IMPORTED" && (
            <>
              <div className="grid gap-2">
                <Label className="text-foreground">Domestic Value Add (DVA) Mode</Label>
                <div className="flex gap-2">
                  {(["ESTIMATED", "AUDITED"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setValue("dvaSource", mode)}
                      className={`flex-1 p-2 text-xs border transition-colors ${
                        dvaSource === mode
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {mode === "ESTIMATED" ? "📊 Indicative Estimator" : "📋 Audited (CA Certified)"}
                    </button>
                  ))}
                </div>
              </div>

              {dvaSource === "AUDITED" ? (
                <div className="space-y-4">
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

                  {/* Certificate Upload */}
                  <div className="grid gap-2">
                    <Label className="text-foreground">
                      CA Certificate (PDF) <span className="text-red-500">*</span>
                    </Label>
                    {!uploadedFileUrl ? (
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed cursor-pointer transition-colors ${errors.uploadedFileUrl ? "border-red-500 bg-red-500/10" : isUploading ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-background hover:bg-accent"}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? (
                            <>
                              <div className="w-full px-8 mb-3">
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                              </div>
                              <p className="text-sm text-emerald-400">Uploading... ({uploadProgress}%)</p>
                            </>
                          ) : (
                            <>
                              <FileText className="w-8 h-8 mb-3 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground"><span className="">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept=".pdf" disabled={isUploading} onChange={(e) => handleFileChange(e, onCertificateUpload)} />
                      </label>
                    ) : (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-emerald-500" />
                            <div>
                              <p className="text-sm font-medium text-emerald-500">Certificate Uploaded</p>
                              <p className="text-xs text-emerald-500">Ready for submission</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-emerald-100 text-emerald-500 rounded hover:bg-emerald-200 transition-colors">View File</a>
                            <button type="button" onClick={() => setValue("uploadedFileUrl", null)} className="text-xs px-3 py-1 bg-muted text-foreground rounded hover:bg-muted transition-colors">Replace</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.uploadedFileUrl && <p className="text-xs text-red-500 mt-1">{errors.uploadedFileUrl.message}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calculator className="h-4 w-4 text-indigo-400" />
                    Indicative DVA Estimator
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="salePrice" className="text-foreground">Sale Price (₹)</Label>
                      <Input id="salePrice" type="number" min="0" {...register("salePrice")} placeholder="0.00" className="bg-transparent border-border text-foreground" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="importCost" className="text-foreground">Imp. Material Cost (₹)</Label>
                      <Input id="importCost" type="number" min="0" {...register("importCost")} placeholder="0.00" className="bg-transparent border-border text-foreground" />
                    </div>
                  </div>
                  {salePrice && importCost && (
                    <div className="space-y-2">
                      <div className={`p-3 rounded border text-center text-sm ${
                        ((parseFloat(salePrice) - parseFloat(importCost)) / parseFloat(salePrice)) * 100 >= 50
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}>
                        Estimated DVA: {Math.max(0, ((parseFloat(salePrice) - parseFloat(importCost)) / parseFloat(salePrice)) * 100).toFixed(1)}%
                        <span className="ml-1 opacity-80">
                          {((parseFloat(salePrice) - parseFloat(importCost)) / parseFloat(salePrice)) * 100 >= 50 ? "(Potentially Eligible)" : "(Ineligible)"}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-200 text-amber-800 text-xs flex gap-2 items-start">
                        <Activity className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span><strong>Note:</strong> This is an estimated value based on raw material costs. Final PLI eligibility requires certification by a Chartered Accountant.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Cell Source */}
          <div className="grid gap-2 pt-2">
            <Label htmlFor="cellSource" className="text-foreground">
              Cell Source <span className="text-red-500">*</span>
            </Label>
            <select
              id="cellSource"
              value={cellSource}
              onChange={(e) => {
                setValue("cellSource", e.target.value as "IMPORTED" | "DOMESTIC" | "");
                if (e.target.value === "IMPORTED") {
                  setValue("pliCompliant", false);
                }
              }}
              className={`flex h-10 w-full border px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 ${
                errors.cellSource ? "border-red-500 bg-transparent" : "border-border bg-transparent"
              }`}
            >
              <option value="">-- Select Cell Source --</option>
              <option value="DOMESTIC">🏭 Domestic (Enables DVA Calculator)</option>
              <option value="IMPORTED">📦 Imported (Requires IEC Code)</option>
            </select>
            {errors.cellSource ? (
              <p className="text-[10px] text-red-500">{errors.cellSource.message}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Required for India compliance. Determines customs and PLI eligibility.</p>
            )}
          </div>

          {/* PLI */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pliCompliant"
                {...register("pliCompliant")}
                disabled={cellSource === "IMPORTED"}
                className={`h-4 w-4 rounded border-border bg-transparent text-orange-500 focus:ring-orange-500 ${cellSource === "IMPORTED" ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              <Label htmlFor="pliCompliant" className={`font-normal cursor-pointer text-foreground ${cellSource === "IMPORTED" ? "opacity-50" : ""}`}>
                PLI Subsidy Eligible
              </Label>
            </div>
            {cellSource === "IMPORTED" && (
              <div className="p-2 bg-amber-500/10 border border-amber-200 rounded text-amber-800 text-xs flex gap-2 items-start">
                <Activity className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>⚠️ Imported cells typically constitute &gt;60% of cost, making the batch ineligible for PLI (Requires ≥50% Local Value Add).</span>
              </div>
            )}
          </div>

          {/* Customs Declaration for Imported */}
          {cellSource === "IMPORTED" && (
            <div className="mt-4 p-4 border border-amber-200 bg-amber-500/10 space-y-4">
              <div className="flex items-center gap-2 text-amber-500 text-sm">
                <FileText className="h-4 w-4" />
                Customs Declaration
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Required</span>
              </div>
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
              <div className="grid gap-2">
                <Label htmlFor="customsDate" className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  Import Date <span className="text-red-500">*</span>
                </Label>
                <Input id="customsDate" type="date" {...register("customsDate")} className={`max-w-50 bg-transparent text-foreground ${errors.customsDate ? "border-red-500" : "border-border"}`} />
                {errors.customsDate && <p className="text-xs text-red-500 mt-1">{errors.customsDate.message}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
