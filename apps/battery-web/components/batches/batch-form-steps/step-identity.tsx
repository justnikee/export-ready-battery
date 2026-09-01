"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Leaf, Flag, FileText, Sparkles, Loader2, Check, AlertTriangle, Wand2, HardDrive, X, Building2 } from "lucide-react";
import { toast } from "sonner";
import { extractTextFromPDF, type ExtractProgress } from "@/lib/pdf-extractor";
import { parseDatasheet, createBatchFromNL, type DatasheetParseResult, type NLCreateResult } from "@/lib/ai/parse-datasheet";
import { hashFile, getCachedResult, setCachedResult, getCacheEntries } from "@/lib/ai/datasheet-cache";
import { useFileDropzone } from "@/hooks/use-file-dropzone";
import { AiFieldPreviewTable } from "@/components/batches/batch-form-steps/ai-field-preview-table";
import { AiBadge, aiFieldClass } from "@/components/batches/batch-form-steps/ai-badge";
import { SettingsBadge } from "@/components/batches/batch-form-steps/settings-badge";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

// Human-readable labels for the "AI populated N fields" banner — keyed by
// react-hook-form field name (the same keys passed to onAiFill).
const FIELD_LABELS: Record<string, string> = {
  modelName: "Model Name",
  chemistry: "Chemistry",
  capacity: "Capacity",
  voltage: "Voltage",
  weight: "Weight",
  manufacturer: "Manufacturer",
  manufacturerAddress: "Manufacturer Address",
  manufacturerEmail: "Manufacturer Email",
  countryOfOrigin: "Country of Origin",
  ceMarking: "CE Marking",
  carbonFootprint: "Carbon Footprint",
  carbonPerformanceClass: "Carbon Performance Class",
  notifiedBodyNumber: "Notified Body Number",
  euRepresentative: "EU Representative",
  euRepresentativeEmail: "EU Representative Email",
  euRepresentativeAddress: "EU Representative Address",
  removableAndReplaceable: "Removable & Replaceable",
  expectedLifetime: "Expected Lifetime",
  warrantyMonths: "Warranty",
  bisNumber: "BIS Number",
  eprNumber: "EPR Number",
  hsnCode: "HSN Code",
  hazardousDeclaration: "Hazardous Declaration",
  certifications: "Certifications",
  materialComposition: "Material Composition",
  batchName: "Batch Name",
  lotSize: "Lot size",
  marketRegion: "Market Region",
  batteryCategory: "Battery Category",
};

interface StepIdentityProps {
  initialAiMode?: "pdf" | "nl";
  aiFilledFields?: Set<string>;
  onAiFill?: (fields: string[]) => void;
  settingsFilledFields?: Set<string>;
}

export function StepIdentity({ initialAiMode, aiFilledFields, onAiFill, settingsFilledFields }: StepIdentityProps = {}) {
  const filledByAi = aiFilledFields ?? new Set<string>();
  const filledBySettings = settingsFilledFields ?? new Set<string>();
  const markAiFilled = onAiFill ?? (() => {});
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();

  const marketRegion = watch("marketRegion");

  // AI assistant state
  const [aiMode, setAiMode] = useState<"none" | "pdf" | "nl">(initialAiMode ?? "none");
  const [isParsing, setIsParsing] = useState(false);
  const [parseStage, setParseStage] = useState<"idle" | "hashing" | "extracting" | "parsing" | "cached">("idle");
  const [parseProgress, setParseProgress] = useState<ExtractProgress | null>(null);
  const [parsedResult, setParsedResult] = useState<DatasheetParseResult | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [editedFieldValues, setEditedFieldValues] = useState<Record<string, string | boolean | string[]>>({});
  const [nlText, setNlText] = useState("");
  const [nlResult, setNlResult] = useState<NLCreateResult | null>(null);
  const [isNlProcessing, setIsNlProcessing] = useState(false);
  const [cachedFiles, setCachedFiles] = useState(getCacheEntries());

  // Track which fields were populated by AI so we can highlight them
  const [aiPopulatedFields, setAiPopulatedFields] = useState<string[]>([]);

  // Manufacturer Info accordion — collapsed by default once Settings has
  // pre-filled it, open by default when the tenant has nothing on file yet.
  const manufacturerPrefilled =
    filledBySettings.has("manufacturer") ||
    filledBySettings.has("manufacturerAddress") ||
    filledBySettings.has("manufacturerEmail");
  const [manufacturerOpen, setManufacturerOpen] = useState(() => !manufacturerPrefilled);

  // Never let a collapsed accordion hide a real validation error.
  useEffect(() => {
    if (errors.manufacturer || errors.manufacturerEmail) {
      setManufacturerOpen(true);
    }
  }, [errors.manufacturer, errors.manufacturerEmail]);

  // AbortControllers for cancellation
  const pdfAbortRef = useRef<AbortController | null>(null);
  const nlAbortRef = useRef<AbortController | null>(null);
  // Prevent duplicate simultaneous requests
  const pdfInFlightRef = useRef(false);

  const handlePdfDrop = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF must be under 10MB");
      return;
    }

    // Cancel any in-flight request
    if (pdfAbortRef.current) {
      pdfAbortRef.current.abort();
    }
    if (pdfInFlightRef.current) {
      toast.info("Cancelling previous parse...");
    }

    const abortController = new AbortController();
    pdfAbortRef.current = abortController;
    pdfInFlightRef.current = true;

    setIsParsing(true);
    setParseStage("hashing");
    setParseProgress(null);
    setParsedResult(null);
    setIsFromCache(false);

    try {
      // 1. Hash the file to check cache
      const fileHash = await hashFile(file);

      // 2. Check cache
      const cached = getCachedResult(fileHash);
      if (cached) {
        setParseStage("cached");
        setParsedResult(cached as DatasheetParseResult);
        setEditedFieldValues({});
        setIsFromCache(true);
        toast.success("Loaded from cache — instant result!");
        pdfInFlightRef.current = false;
        setIsParsing(false);
        return;
      }

      // 3. Extract text with progress
      setParseStage("extracting");
      const text = await extractTextFromPDF(file, (progress) => {
        setParseProgress(progress);
      });

      if (!text.trim()) {
        toast.error("No text found in PDF — it may be scanned/image-based");
        setIsParsing(false);
        pdfInFlightRef.current = false;
        return;
      }

      // 4. Parse with AI
      setParseStage("parsing");
      const response = await parseDatasheet(text, abortController.signal);

      if (abortController.signal.aborted) return;

      setParsedResult(response.data);
      setEditedFieldValues({});
      setCachedResult(fileHash, file.name, response.data);
      setCachedFiles(getCacheEntries());
      toast.success(`Parsed with ${Math.round(response.confidence * 100)}% confidence (${response.method})`);
    } catch (error: unknown) {
      if ((error as Error).name === "AbortError" || (error as Error).name === "CanceledError") {
        toast.info("Parse cancelled");
        return;
      }
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.message || "Failed to parse PDF");
    } finally {
      setIsParsing(false);
      pdfInFlightRef.current = false;
      if (pdfAbortRef.current === abortController) {
        pdfAbortRef.current = null;
      }
    }
  }, []);

  const { isDragActive: isPdfDragActive, dropHandlers: pdfDropHandlers } = useFileDropzone(
    handlePdfDrop,
    isParsing
  );

  const handleCancelParse = useCallback(() => {
    if (pdfAbortRef.current) {
      pdfAbortRef.current.abort();
      pdfAbortRef.current = null;
    }
    setIsParsing(false);
    setParseStage("idle");
    setParseProgress(null);
    pdfInFlightRef.current = false;
  }, []);

  const handleNlSubmit = useCallback(async () => {
    if (!nlText.trim()) return;

    // Cancel previous NL request
    if (nlAbortRef.current) {
      nlAbortRef.current.abort();
    }
    const abortController = new AbortController();
    nlAbortRef.current = abortController;

    setIsNlProcessing(true);
    setNlResult(null);
    try {
      const result = await createBatchFromNL(nlText, marketRegion, abortController.signal);
      setNlResult(result);
      toast.success("Draft created from your description");
    } catch (error: unknown) {
      if ((error as Error).name === "AbortError" || (error as Error).name === "CanceledError") {
        toast.info("Request cancelled");
        return;
      }
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.message || "Failed to process description");
    } finally {
      setIsNlProcessing(false);
      if (nlAbortRef.current === abortController) {
        nlAbortRef.current = null;
      }
    }
  }, [nlText, marketRegion]);

  const applyPdfResult = (
    rawResult: DatasheetParseResult,
    edits: Record<string, string | boolean | string[]> = {}
  ) => {
    const result = { ...rawResult, ...edits } as DatasheetParseResult;
    const appliedKeys: string[] = [];
    // === Identity & Electrical ===
    if (result.model_name) { setValue("modelName", result.model_name, { shouldDirty: true }); appliedKeys.push("modelName"); }
    if (result.chemistry) { setValue("chemistry", result.chemistry as BatchFormData["chemistry"], { shouldDirty: true }); appliedKeys.push("chemistry"); }
    if (result.capacity) { setValue("capacity", result.capacity, { shouldDirty: true }); appliedKeys.push("capacity"); }
    if (result.voltage) { setValue("voltage", result.voltage, { shouldDirty: true }); appliedKeys.push("voltage"); }
    if (result.weight) { setValue("weight", result.weight, { shouldDirty: true }); appliedKeys.push("weight"); }
    if (result.manufacturer) { setValue("manufacturer", result.manufacturer, { shouldDirty: true }); appliedKeys.push("manufacturer"); }
    if (result.manufacturer_address) { setValue("manufacturerAddress", result.manufacturer_address, { shouldDirty: true }); appliedKeys.push("manufacturerAddress"); }
    if (result.manufacturer_email) { setValue("manufacturerEmail", result.manufacturer_email, { shouldDirty: true }); appliedKeys.push("manufacturerEmail"); }
    if (result.country_of_origin) { setValue("countryOfOrigin", result.country_of_origin, { shouldDirty: true }); appliedKeys.push("countryOfOrigin"); }

    // === EU Compliance ===
    if (result.ce_marking) { setValue("ceMarking", true, { shouldDirty: true }); appliedKeys.push("ceMarking"); }
    if (result.carbon_footprint) { setValue("carbonFootprint", result.carbon_footprint, { shouldDirty: true }); appliedKeys.push("carbonFootprint"); }
    if (result.carbon_performance_class) { setValue("carbonPerformanceClass", result.carbon_performance_class, { shouldDirty: true }); appliedKeys.push("carbonPerformanceClass"); }
    if (result.notified_body_number) { setValue("notifiedBodyNumber", result.notified_body_number, { shouldDirty: true }); appliedKeys.push("notifiedBodyNumber"); }
    if (result.eu_representative) { setValue("euRepresentative", result.eu_representative, { shouldDirty: true }); appliedKeys.push("euRepresentative"); }
    if (result.eu_representative_email) { setValue("euRepresentativeEmail", result.eu_representative_email, { shouldDirty: true }); appliedKeys.push("euRepresentativeEmail"); }
    if (result.eu_representative_address) { setValue("euRepresentativeAddress", result.eu_representative_address, { shouldDirty: true }); appliedKeys.push("euRepresentativeAddress"); }
    if (result.removable_and_replaceable) { setValue("removableAndReplaceable", true, { shouldDirty: true }); appliedKeys.push("removableAndReplaceable"); }
    if (result.expected_lifetime_cycles) { setValue("expectedLifetime", result.expected_lifetime_cycles, { shouldDirty: true }); appliedKeys.push("expectedLifetime"); }
    if (result.warranty_months) { setValue("warrantyMonths", result.warranty_months, { shouldDirty: true }); appliedKeys.push("warrantyMonths"); }

    // === India Compliance ===
    if (result.bis_number) { setValue("bisNumber", result.bis_number, { shouldDirty: true }); appliedKeys.push("bisNumber"); }
    if (result.epr_number) { setValue("eprNumber", result.epr_number, { shouldDirty: true }); appliedKeys.push("eprNumber"); }
    if (result.hsn_code) { setValue("hsnCode", result.hsn_code, { shouldDirty: true }); appliedKeys.push("hsnCode"); }

    // === Hazardous Substances ===
    const currentHS = watch("hazardousSubstances");
    setValue("hazardousSubstances", {
      lead: result.hazardous_lead_present ?? currentHS.lead,
      mercury: result.hazardous_mercury_present ?? currentHS.mercury,
      cadmium: result.hazardous_cadmium_present ?? currentHS.cadmium,
    }, { shouldDirty: true });
    if (result.hazardous_declaration) { setValue("hazardousDeclaration", result.hazardous_declaration, { shouldDirty: true }); appliedKeys.push("hazardousDeclaration"); }

    // === Material Composition ===
    if (result.material_composition) {
      const mc = result.material_composition;
      const current = watch("materialComposition");
      setValue("materialComposition", {
        ...current,
        lithium: mc.lithium || current.lithium,
        cobalt: mc.cobalt || current.cobalt,
        nickel: mc.nickel || current.nickel,
        manganese: mc.manganese || current.manganese,
        graphite: mc.graphite || current.graphite,
        lead: mc.lead || current.lead,
        recycled_cobalt: result.recycled_cobalt || current.recycled_cobalt,
        recycled_lithium: result.recycled_lithium || current.recycled_lithium,
        recycled_nickel: result.recycled_nickel || current.recycled_nickel,
        recycled_lead: result.recycled_lead || current.recycled_lead,
      }, { shouldDirty: true });
    }
    if (result.recycled_content_pct) setValue("recycledContent", result.recycled_content_pct, { shouldDirty: true });

    // === Certifications ===
    if (result.certifications?.length > 0) {
      const certs = result.certifications.map((c: string) => c.toUpperCase());
      setValue("certifications", certs, { shouldDirty: true });
    }

    if (result.certifications?.length > 0) appliedKeys.push("certifications");
    if (result.material_composition) appliedKeys.push("materialComposition");

    markAiFilled(appliedKeys);
    setAiPopulatedFields(appliedKeys.map((k) => FIELD_LABELS[k] ?? k));

    // Count only fields actually written to the form, not every non-empty key
    // the parser returned (many parsed keys have no corresponding form field).
    const appliedCount = appliedKeys.length;
    toast.success(`Applied ${appliedCount} field${appliedCount === 1 ? "" : "s"} — review and adjust as needed`);
    setAiMode("none");
    setParsedResult(null);
    setEditedFieldValues({});
  };

  const applyNlResult = (result: NLCreateResult) => {
    const populated: string[] = [];
    const appliedKeys: string[] = [];

    if (result.batch_name) {
      setValue("batchName", result.batch_name, { shouldDirty: true });
      populated.push("Batch Name");
      appliedKeys.push("batchName");
    }
    if (result.model_name) {
      setValue("modelName", result.model_name, { shouldDirty: true });
      populated.push("Model Name");
      appliedKeys.push("modelName");
    }
    if (result.chemistry) {
      setValue("chemistry", result.chemistry as BatchFormData["chemistry"], { shouldDirty: true });
      populated.push("Chemistry");
      appliedKeys.push("chemistry");
    }
    if (result.capacity) {
      setValue("capacity", result.capacity, { shouldDirty: true });
      populated.push("Capacity");
      appliedKeys.push("capacity");
    }
    if (result.voltage) {
      setValue("voltage", result.voltage, { shouldDirty: true });
      populated.push("Voltage");
      appliedKeys.push("voltage");
    }
    if (result.weight) {
      setValue("weight", result.weight, { shouldDirty: true });
      populated.push("Weight");
      appliedKeys.push("weight");
    }
    if (result.market_region) {
      setValue("marketRegion", result.market_region as BatchFormData["marketRegion"], { shouldDirty: true, shouldValidate: true });
      populated.push("Market Region");
      appliedKeys.push("marketRegion");
      // Update certifications based on market
      if (result.market_region === "INDIA") {
        setValue("certifications", ["AIS-156", "AIS-038"], { shouldDirty: true });
      } else if (result.market_region === "EU") {
        setValue("certifications", ["CE"], { shouldDirty: true });
      } else {
        setValue("certifications", [], { shouldDirty: true });
      }
    }
    if (result.quantity && result.quantity > 0) {
      setValue("lotSize", String(result.quantity), { shouldDirty: true });
      populated.push("Lot size");
      appliedKeys.push("lotSize");
    }
    if (result.battery_category) {
      setValue("batteryCategory", result.battery_category, { shouldDirty: true });
      populated.push("Battery Category");
      appliedKeys.push("batteryCategory");
    }
    if (result.hsn_code) {
      setValue("hsnCode", result.hsn_code, { shouldDirty: true });
      populated.push("HSN Code");
      appliedKeys.push("hsnCode");
    }
    if (result.cell_source === "DOMESTIC" || result.cell_source === "IMPORTED") {
      setValue("cellSource", result.cell_source, { shouldDirty: true });
      populated.push("Cell Source");
      appliedKeys.push("cellSource");
    }
    if (result.carbon_performance_class) {
      setValue("carbonPerformanceClass", result.carbon_performance_class, { shouldDirty: true });
      populated.push("Carbon Class");
      appliedKeys.push("carbonPerformanceClass");
    }

    markAiFilled(appliedKeys);
    setAiPopulatedFields(populated);
    toast.success(`AI populated ${populated.length} field${populated.length > 1 ? "s" : ""}: ${populated.join(", ")}`);
    setAiMode("none");
    setNlResult(null);
    setNlText("");
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return "text-foreground";
    if (c >= 0.5) return "text-muted-foreground";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* ===== AI ASSISTANT STRIP ===== */}
      <div className="border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">AI Assistant</span>
            <span className="text-xs text-muted-foreground">Upload a datasheet or describe what you need</span>
          </div>

          {aiMode === "none" && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAiMode("pdf")}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Upload PDF
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAiMode("nl")}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Describe in Words
              </Button>
            </div>
          )}
        </div>

        {aiMode === "pdf" && (
          <div className="space-y-3">
            {!parsedResult ? (
              <>
                {/* Cached files quick access */}
                {cachedFiles.length > 0 && !isParsing && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                      <HardDrive className="h-3 w-3" /> Recently Parsed
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cachedFiles.slice(0, 3).map((entry) => (
                        <button
                          key={entry.hash}
                          type="button"
                          onClick={async () => {
                            const cached = getCachedResult(entry.hash);
                            if (cached) {
                              setParsedResult(cached as DatasheetParseResult);
                              setEditedFieldValues({});
                              setIsFromCache(true);
                              toast.success("Loaded from cache");
                            }
                          }}
                          className="text-[10px] px-2 py-1 bg-accent border border-border rounded hover:bg-accent/80 transition-colors truncate max-w-[140px]"
                          title={entry.filename}
                        >
                          {entry.filename}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label
                  {...pdfDropHandlers}
                  className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded cursor-pointer transition-colors ${isParsing ? "border-foreground bg-muted/50" : isPdfDragActive ? "border-foreground bg-accent" : "border-border bg-background hover:bg-accent"}`}
                >
                  <div className="flex flex-col items-center justify-center py-4 w-full px-4">
                    {isParsing ? (
                      <div className="w-full space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {parseStage === "hashing" && "Checking cache..."}
                              {parseStage === "extracting" && `Extracting page ${parseProgress?.currentPage ?? 0} of ${parseProgress?.totalPages ?? "?"}...`}
                              {parseStage === "parsing" && "Analyzing with AI..."}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCancelParse();
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-foreground rounded-full transition-all duration-300"
                            style={{ width: `${parseProgress?.percent ?? (parseStage === "hashing" ? 5 : parseStage === "parsing" ? 90 : 50)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {parseStage === "extracting" && "Reading PDF text... This may take a moment for large files."}
                          {parseStage === "parsing" && "Sending to AI for analysis..."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {isPdfDragActive ? (
                            <span className="font-medium">Drop your PDF here</span>
                          ) : (
                            <><span className="font-medium">Click to upload</span> or drag and drop PDF</>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Max 10MB. Text-based PDFs work best.</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    disabled={isParsing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePdfDrop(file);
                    }}
                  />
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAiMode("none")} className="w-full">
                  Cancel
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Parsed Results</span>
                  <div className="flex items-center gap-2">
                    {isFromCache && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded">
                        Cached
                      </span>
                    )}
                    <span className={`text-xs font-medium ${confidenceColor(parsedResult.confidence)}`}>
                      {Math.round(parsedResult.confidence * 100)}% confidence ({parsedResult.method})
                    </span>
                  </div>
                </div>
                <AiFieldPreviewTable
                  result={parsedResult}
                  editedValues={editedFieldValues}
                  onEdit={(field, value) => setEditedFieldValues((prev) => ({ ...prev, [field]: value }))}
                  onApply={() => applyPdfResult(parsedResult, editedFieldValues)}
                  onTryAnother={() => {
                    setParsedResult(null);
                    setEditedFieldValues({});
                  }}
                />
              </div>
            )}
          </div>
        )}

        {aiMode === "nl" && (
          <div className="space-y-3">
            {!nlResult ? (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder='e.g. "Create 50 LFP 150Ah batteries for EU e-bike market"'
                    value={nlText}
                    onChange={(e) => setNlText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleNlSubmit();
                      }
                    }}
                    disabled={isNlProcessing}
                    className="flex-1"
                  />
                  {isNlProcessing ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      if (nlAbortRef.current) {
                        nlAbortRef.current.abort();
                        nlAbortRef.current = null;
                      }
                      setIsNlProcessing(false);
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNlSubmit}
                      disabled={!nlText.trim()}
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Examples: "150Ah NMC for VW EV platform" · "LFP solar storage 48V 200Ah India BIS" · "100 units e-bike battery EU"
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAiMode("none")} className="w-full">
                  Cancel
                </Button>
              </>
            ) : (
              <div className="space-y-3 border border-border bg-muted/30 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">AI Draft Preview</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded">
                    {Object.values(nlResult).filter(v => v !== null && v !== "" && v !== 0).length} fields detected
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/80">
                  A text description covers core identity, specs, and a few compliance hints (HSN, cell source, carbon class) when you mention them. For full certifications and material data, upload a datasheet PDF instead.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {nlResult.batch_name && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Batch Name</span>
                      <span className="text-foreground font-medium">{nlResult.batch_name}</span>
                    </div>
                  )}
                  {nlResult.model_name && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Model</span>
                      <span className="text-foreground font-medium">{nlResult.model_name}</span>
                    </div>
                  )}
                  {nlResult.chemistry && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Chemistry</span>
                      <span className="text-foreground font-medium">{nlResult.chemistry}</span>
                    </div>
                  )}
                  {nlResult.capacity && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Capacity</span>
                      <span className="text-foreground font-medium">{nlResult.capacity}</span>
                    </div>
                  )}
                  {nlResult.voltage && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Voltage</span>
                      <span className="text-foreground font-medium">{nlResult.voltage}</span>
                    </div>
                  )}
                  {nlResult.quantity && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Quantity</span>
                      <span className="text-foreground font-medium">{nlResult.quantity}</span>
                    </div>
                  )}
                  {nlResult.market_region && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Market</span>
                      <span className="text-foreground font-medium">{nlResult.market_region}</span>
                    </div>
                  )}
                  {nlResult.battery_category && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Category</span>
                      <span className="text-foreground font-medium">{nlResult.battery_category}</span>
                    </div>
                  )}
                  {nlResult.hsn_code && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">HSN Code</span>
                      <span className="text-foreground font-medium">{nlResult.hsn_code}</span>
                    </div>
                  )}
                  {nlResult.cell_source && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Cell Source</span>
                      <span className="text-foreground font-medium">{nlResult.cell_source}</span>
                    </div>
                  )}
                  {nlResult.carbon_performance_class && (
                    <div className="p-2.5 bg-background border border-border rounded">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Carbon Class</span>
                      <span className="text-foreground font-medium">{nlResult.carbon_performance_class}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => applyNlResult(nlResult)} className="flex-1">
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Fill Form with These Values
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setNlResult(null)}>
                    Try Different Description
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== AI POPULATED BANNER ===== */}
      {aiPopulatedFields.length > 0 && (
        <div className="p-3 bg-muted/50 border border-border rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">AI populated {aiPopulatedFields.length} field{aiPopulatedFields.length > 1 ? "s" : ""}:</span>{" "}
                <span className="opacity-80">{aiPopulatedFields.join(", ")}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiPopulatedFields([])}
              className="p-1 hover:bg-muted rounded transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1 ml-6">
            Review and adjust the highlighted fields below before proceeding.
          </p>
        </div>
      )}

      {/* ===== MANUAL FORM ===== */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or fill manually</span>
        </div>
      </div>

      {/* Market Region */}
      <div className="grid gap-3">
        <Label className="flex items-center gap-2 font-medium text-foreground">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Target Market <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "INDIA" as const, label: "India", sub: "Battery Aadhaar", flagClass: "fi-in" },
            { value: "EU" as const, label: "EU Export", sub: "Battery Passport", flagClass: "fi-eu" },
          ] as const).map((opt) => {
            const isSelected = marketRegion === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("marketRegion", opt.value, { shouldValidate: true })}
                className={`relative flex flex-col items-center justify-center p-4 border rounded-xl text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[var(--brand)] bg-[var(--brand)]/5 text-foreground ring-1 ring-[var(--brand)]/20"
                    : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`fi ${opt.flagClass} text-xl mb-2 shadow-xs rounded-sm`} />
                <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                <div className="text-[11px] opacity-85 mt-0.5">{opt.sub}</div>
                {isSelected && (
                  <div className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--brand-foreground)] shadow-xs">
                    <Check className="h-2.5 w-2.5 stroke-[3px]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {errors.marketRegion && (
          <p className="text-xs text-red-500">{errors.marketRegion.message}</p>
        )}
      </div>

      {/* Batch Name */}
      <div className="grid gap-2">
        <Label htmlFor="batchName">
          Batch Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="batchName"
          {...register("batchName")}
          placeholder="e.g. Q1-2024-Pro"
          className={errors.batchName ? "border-red-500" : ""}
        />
        {errors.batchName && (
          <p className="text-xs text-red-500">{errors.batchName.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lotSize">
          How many packs in this lot? <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lotSize"
          inputMode="numeric"
          {...register("lotSize")}
          placeholder="e.g. 200"
          className={errors.lotSize ? "border-red-500" : ""}
        />
        {errors.lotSize && (
          <p className="text-xs text-red-500">{errors.lotSize.message}</p>
        )}
      </div>

      {/* Model Name */}
      <div className="grid gap-2">
        <Label htmlFor="modelName" className="flex items-center gap-1.5">
          Model Name <span className="text-red-500">*</span>
          {filledByAi.has("modelName") && <AiBadge />}
        </Label>
        <Input
          id="modelName"
          {...register("modelName")}
          placeholder="e.g. ER-52V-20Ah"
          className={`${errors.modelName ? "border-red-500" : ""} ${aiFieldClass(filledByAi.has("modelName"))}`}
        />
        {errors.modelName && (
          <p className="text-xs text-red-500">{errors.modelName.message}</p>
        )}
      </div>

      {/* Manufacturing Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="manufacturingStartDate">
            Manufacturing Start <span className="text-red-500">*</span>
          </Label>
          <Input
            id="manufacturingStartDate"
            type="date"
            {...register("manufacturingStartDate")}
            className={errors.manufacturingStartDate ? "border-red-500" : ""}
          />
          {errors.manufacturingStartDate && (
            <p className="text-xs text-red-500">{errors.manufacturingStartDate.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="manufacturingEndDate">
            Manufacturing End <span className="text-red-500">*</span>
          </Label>
          <Input
            id="manufacturingEndDate"
            type="date"
            {...register("manufacturingEndDate")}
            className={errors.manufacturingEndDate ? "border-red-500" : ""}
          />
          {errors.manufacturingEndDate && (
            <p className="text-xs text-red-500">{errors.manufacturingEndDate.message}</p>
          )}
        </div>
      </div>

      {/* Manufacturer Info */}
      <AccordionItem value="manufacturer-info" className="!rounded-md">
        <AccordionTrigger isOpen={manufacturerOpen} onClick={() => setManufacturerOpen((o) => !o)} className="!px-4 !py-3">
          <span className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Manufacturer Info <span className="text-red-500">*</span>
            {(errors.manufacturer || errors.manufacturerEmail) && (
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            )}
          </span>
          {manufacturerPrefilled && !manufacturerOpen && <SettingsBadge />}
        </AccordionTrigger>
        <AccordionContent isOpen={manufacturerOpen} className="!px-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="manufacturer" className="flex items-center gap-1.5">
              Manufacturer <span className="text-red-500">*</span>
              {filledByAi.has("manufacturer") && <AiBadge />}
              {filledBySettings.has("manufacturer") && <SettingsBadge />}
            </Label>
            <Input
              id="manufacturer"
              {...register("manufacturer")}
              className={`${errors.manufacturer ? "border-red-500" : ""} ${aiFieldClass(filledByAi.has("manufacturer"))}`}
            />
            {errors.manufacturer && (
              <p className="text-xs text-red-500">{errors.manufacturer.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="manufacturerAddress" className="flex items-center gap-1.5">
                Manufacturer Address
                {filledByAi.has("manufacturerAddress") && <AiBadge />}
                {filledBySettings.has("manufacturerAddress") && <SettingsBadge />}
              </Label>
              <Input
                id="manufacturerAddress"
                {...register("manufacturerAddress")}
                placeholder="e.g. Industrial Area, New Delhi"
                className={aiFieldClass(filledByAi.has("manufacturerAddress"))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manufacturerEmail" className="flex items-center gap-1.5">
                Compliance Email
                {filledByAi.has("manufacturerEmail") && <AiBadge />}
                {filledBySettings.has("manufacturerEmail") && <SettingsBadge />}
              </Label>
              <Input
                id="manufacturerEmail"
                type="email"
                {...register("manufacturerEmail")}
                placeholder="e.g. compliance@company.com"
                className={`${errors.manufacturerEmail ? "border-red-500" : ""} ${aiFieldClass(filledByAi.has("manufacturerEmail"))}`}
              />
              {errors.manufacturerEmail && (
                <p className="text-xs text-red-500">{errors.manufacturerEmail.message}</p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* GTIN — GS1 Digital Link for EU Battery Passport */}
      <div className="grid gap-2">
        <Label htmlFor="gtin" className="flex items-center gap-2">
          <span>GTIN (Global Trade Item Number)</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded">GS1 Digital Link</span>
        </Label>
        <Input
          id="gtin"
          {...register("gtin")}
          placeholder="e.g. 12345678901234"
          maxLength={14}
        />
        <p className="text-[10px] text-muted-foreground">
          Optional — only if you already have a GS1 GTIN. QR codes still use /p/&#123;uuid&#125; until Digital Link is enabled.
        </p>
      </div>
    </div>
  );
}
