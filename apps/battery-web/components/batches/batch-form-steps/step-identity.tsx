"use client";

import { useState, useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Leaf, Flag, FileText, Sparkles, Loader2, Check, AlertTriangle, Wand2, HardDrive, X } from "lucide-react";
import { toast } from "sonner";
import { extractTextFromPDF, type ExtractProgress } from "@/lib/pdf-extractor";
import { parseDatasheet, createBatchFromNL, type DatasheetParseResult, type NLCreateResult } from "@/lib/ai/parse-datasheet";
import { hashFile, getCachedResult, setCachedResult, getCacheEntries } from "@/lib/ai/datasheet-cache";
import type { BatchFormData } from "@/components/batches/batch-form-schema";

export function StepIdentity() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BatchFormData>();

  const marketRegion = watch("marketRegion");

  // AI assistant state
  const [aiMode, setAiMode] = useState<"none" | "pdf" | "nl">("none");
  const [isParsing, setIsParsing] = useState(false);
  const [parseStage, setParseStage] = useState<"idle" | "hashing" | "extracting" | "parsing" | "cached">("idle");
  const [parseProgress, setParseProgress] = useState<ExtractProgress | null>(null);
  const [parsedResult, setParsedResult] = useState<DatasheetParseResult | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [nlText, setNlText] = useState("");
  const [nlResult, setNlResult] = useState<NLCreateResult | null>(null);
  const [isNlProcessing, setIsNlProcessing] = useState(false);
  const [cachedFiles, setCachedFiles] = useState(getCacheEntries());

  // Track which fields were populated by AI so we can highlight them
  const [aiPopulatedFields, setAiPopulatedFields] = useState<string[]>([]);

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

  const applyPdfResult = (result: DatasheetParseResult) => {
    // === Identity & Electrical ===
    if (result.model_name) setValue("modelName", result.model_name, { shouldDirty: true });
    if (result.chemistry) setValue("chemistry", result.chemistry as BatchFormData["chemistry"], { shouldDirty: true });
    if (result.capacity) setValue("capacity", result.capacity, { shouldDirty: true });
    if (result.voltage) setValue("voltage", result.voltage, { shouldDirty: true });
    if (result.weight) setValue("weight", result.weight, { shouldDirty: true });
    if (result.manufacturer) setValue("manufacturer", result.manufacturer, { shouldDirty: true });
    if (result.manufacturer_address) setValue("manufacturerAddress", result.manufacturer_address, { shouldDirty: true });
    if (result.manufacturer_email) setValue("manufacturerEmail", result.manufacturer_email, { shouldDirty: true });
    if (result.country_of_origin) setValue("countryOfOrigin", result.country_of_origin, { shouldDirty: true });

    // === EU Compliance ===
    if (result.ce_marking) setValue("ceMarking", true, { shouldDirty: true });
    if (result.carbon_footprint) setValue("carbonFootprint", result.carbon_footprint, { shouldDirty: true });
    if (result.carbon_performance_class) setValue("carbonPerformanceClass", result.carbon_performance_class, { shouldDirty: true });
    if (result.notified_body_number) setValue("notifiedBodyNumber", result.notified_body_number, { shouldDirty: true });
    if (result.eu_representative) setValue("euRepresentative", result.eu_representative, { shouldDirty: true });
    if (result.eu_representative_email) setValue("euRepresentativeEmail", result.eu_representative_email, { shouldDirty: true });
    if (result.eu_representative_address) setValue("euRepresentativeAddress", result.eu_representative_address, { shouldDirty: true });
    if (result.removable_and_replaceable) setValue("removableAndReplaceable", true, { shouldDirty: true });
    if (result.expected_lifetime_cycles) setValue("expectedLifetime", result.expected_lifetime_cycles, { shouldDirty: true });
    if (result.warranty_months) setValue("warrantyMonths", result.warranty_months, { shouldDirty: true });

    // === India Compliance ===
    if (result.bis_number) setValue("bisNumber", result.bis_number, { shouldDirty: true });
    if (result.epr_number) setValue("eprNumber", result.epr_number, { shouldDirty: true });
    if (result.hsn_code) setValue("hsnCode", result.hsn_code, { shouldDirty: true });

    // === Hazardous Substances ===
    const currentHS = watch("hazardousSubstances");
    setValue("hazardousSubstances", {
      lead: result.hazardous_lead_present ?? currentHS.lead,
      mercury: result.hazardous_mercury_present ?? currentHS.mercury,
      cadmium: result.hazardous_cadmium_present ?? currentHS.cadmium,
    }, { shouldDirty: true });
    if (result.hazardous_declaration) setValue("hazardousDeclaration", result.hazardous_declaration, { shouldDirty: true });

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

    const r = result as unknown as Record<string, unknown>;
    const appliedCount = Object.keys(result).filter(k =>
      r[k] !== "" && r[k] !== false && r[k] !== null &&
      k !== "confidence" && k !== "method" && k !== "processing_time_ms"
    ).length;
    toast.success(`Applied ${appliedCount} fields — review and adjust as needed`);
    setAiMode("none");
    setParsedResult(null);
  };

  const applyNlResult = (result: NLCreateResult) => {
    const populated: string[] = [];

    if (result.batch_name) {
      setValue("batchName", result.batch_name, { shouldDirty: true });
      populated.push("Batch Name");
    }
    if (result.model_name) {
      setValue("modelName", result.model_name, { shouldDirty: true });
      populated.push("Model Name");
    }
    if (result.chemistry) {
      setValue("chemistry", result.chemistry as BatchFormData["chemistry"], { shouldDirty: true });
      populated.push("Chemistry");
    }
    if (result.capacity) {
      setValue("capacity", result.capacity, { shouldDirty: true });
      populated.push("Capacity");
    }
    if (result.voltage) {
      setValue("voltage", result.voltage, { shouldDirty: true });
      populated.push("Voltage");
    }
    if (result.weight) {
      setValue("weight", result.weight, { shouldDirty: true });
      populated.push("Weight");
    }
    if (result.market_region) {
      setValue("marketRegion", result.market_region as BatchFormData["marketRegion"], { shouldDirty: true, shouldValidate: true });
      populated.push("Market Region");
      // Update certifications based on market
      if (result.market_region === "INDIA") {
        setValue("certifications", ["AIS-156", "AIS-038"], { shouldDirty: true });
      } else if (result.market_region === "EU") {
        setValue("certifications", ["CE"], { shouldDirty: true });
      } else {
        setValue("certifications", [], { shouldDirty: true });
      }
    }
    if (result.battery_category) {
      setValue("batteryCategory", result.battery_category, { shouldDirty: true });
      populated.push("Battery Category");
    }

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
      {/* ===== AI ASSISTANT ===== */}
      <div className="border border-border bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-foreground text-sm">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">AI Assistant</span>
          <span className="text-xs text-muted-foreground">Upload a datasheet or describe what you need</span>
        </div>

        {aiMode === "none" && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAiMode("pdf")} className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Upload Datasheet PDF
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAiMode("nl")} className="flex-1">
              <Wand2 className="mr-2 h-4 w-4" />
              Describe in Words
            </Button>
          </div>
        )}

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

                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded cursor-pointer transition-colors ${isParsing ? "border-foreground bg-muted/50" : "border-border bg-background hover:bg-accent"}`}>
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
                        <p className="text-xs text-muted-foreground"><span className="font-medium">Click to upload</span> or drag and drop PDF</p>
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
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {/* Identity */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Identity</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {parsedResult.model_name && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Model:</span> {parsedResult.model_name}</div>}
                      {parsedResult.part_number && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Part #:</span> {parsedResult.part_number}</div>}
                      {parsedResult.serial_number_format && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Serial Format:</span> {parsedResult.serial_number_format}</div>}
                      {parsedResult.manufacturer && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Mfg:</span> {parsedResult.manufacturer}</div>}
                      {parsedResult.manufacturer_address && <div className="p-1.5 bg-background border border-border rounded col-span-2"><span className="text-muted-foreground">Mfg Address:</span> {parsedResult.manufacturer_address}</div>}
                      {parsedResult.country_of_origin && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Origin:</span> {parsedResult.country_of_origin}</div>}
                    </div>
                  </div>
                  {/* Electrical */}
                  {(parsedResult.capacity || parsedResult.voltage || parsedResult.energy_density || parsedResult.internal_resistance) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Electrical</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {parsedResult.chemistry && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Chemistry:</span> {parsedResult.chemistry}</div>}
                        {parsedResult.capacity && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Capacity:</span> {parsedResult.capacity}</div>}
                        {parsedResult.voltage && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Voltage:</span> {parsedResult.voltage}</div>}
                        {parsedResult.energy_density && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Energy Density:</span> {parsedResult.energy_density}</div>}
                        {parsedResult.internal_resistance && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Int. Resistance:</span> {parsedResult.internal_resistance}</div>}
                        {parsedResult.max_charge_current && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Max Charge:</span> {parsedResult.max_charge_current}</div>}
                        {parsedResult.max_discharge_current && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Max Discharge:</span> {parsedResult.max_discharge_current}</div>}
                        {parsedResult.cutoff_voltage && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Cutoff:</span> {parsedResult.cutoff_voltage}</div>}
                      </div>
                    </div>
                  )}
                  {/* Physical */}
                  {(parsedResult.weight || parsedResult.dimensions || parsedResult.ip_rating) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Physical</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {parsedResult.weight && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Weight:</span> {parsedResult.weight}</div>}
                        {parsedResult.dimensions && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Dimensions:</span> {parsedResult.dimensions}</div>}
                        {parsedResult.ip_rating && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">IP Rating:</span> {parsedResult.ip_rating}</div>}
                        {parsedResult.terminal_type && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Terminal:</span> {parsedResult.terminal_type}</div>}
                      </div>
                    </div>
                  )}
                  {/* Performance */}
                  {(parsedResult.cycle_life || parsedResult.expected_lifetime_cycles || parsedResult.warranty_months) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Performance</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {parsedResult.cycle_life && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Cycle Life:</span> {parsedResult.cycle_life}</div>}
                        {parsedResult.expected_lifetime_cycles && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Exp. Lifetime:</span> {parsedResult.expected_lifetime_cycles}</div>}
                        {parsedResult.warranty_months && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Warranty:</span> {parsedResult.warranty_months} mo</div>}
                        {parsedResult.operating_temperature && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Op. Temp:</span> {parsedResult.operating_temperature}</div>}
                      </div>
                    </div>
                  )}
                  {/* EU Compliance */}
                  {(parsedResult.ce_marking || parsedResult.carbon_footprint || parsedResult.eu_representative || parsedResult.removable_and_replaceable) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">EU Compliance</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {parsedResult.ce_marking !== undefined && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">CE Marking:</span> {parsedResult.ce_marking ? "Yes" : "No"}</div>}
                        {parsedResult.carbon_footprint && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Carbon:</span> {parsedResult.carbon_footprint}</div>}
                        {parsedResult.carbon_performance_class && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Class:</span> {parsedResult.carbon_performance_class}</div>}
                        {parsedResult.notified_body_number && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Notified Body:</span> {parsedResult.notified_body_number}</div>}
                        {parsedResult.eu_representative && <div className="p-1.5 bg-background border border-border rounded col-span-2"><span className="text-muted-foreground">EU Rep:</span> {parsedResult.eu_representative}</div>}
                        {parsedResult.removable_and_replaceable !== undefined && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">Removable:</span> {parsedResult.removable_and_replaceable ? "Yes" : "No"}</div>}
                      </div>
                    </div>
                  )}
                  {/* India Compliance */}
                  {(parsedResult.bis_number || parsedResult.epr_number || parsedResult.hsn_code) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">India Compliance</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {parsedResult.bis_number && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">BIS:</span> {parsedResult.bis_number}</div>}
                        {parsedResult.epr_number && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">EPR:</span> {parsedResult.epr_number}</div>}
                        {parsedResult.hsn_code && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">HSN:</span> {parsedResult.hsn_code}</div>}
                        {parsedResult.is_standard && <div className="p-1.5 bg-background border border-border rounded"><span className="text-muted-foreground">IS Std:</span> {parsedResult.is_standard}</div>}
                      </div>
                    </div>
                  )}
                  {/* Certifications */}
                  {parsedResult.certifications && parsedResult.certifications.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Certifications</div>
                      <div className="flex flex-wrap gap-1">
                        {parsedResult.certifications.map((cert: string) => (
                          <span key={cert} className="px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border rounded">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Hazardous Substances */}
                  {(parsedResult.hazardous_lead_present !== undefined || parsedResult.hazardous_mercury_present !== undefined || parsedResult.hazardous_cadmium_present !== undefined) && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Hazardous Substances</div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        {parsedResult.hazardous_lead_present !== undefined && (
                          <div className={`p-1.5 border rounded ${parsedResult.hazardous_lead_present ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-background border-border"}`}>
                            Lead: {parsedResult.hazardous_lead_present ? "Yes" : "No"}
                          </div>
                        )}
                        {parsedResult.hazardous_mercury_present !== undefined && (
                          <div className={`p-1.5 border rounded ${parsedResult.hazardous_mercury_present ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-background border-border"}`}>
                            Hg: {parsedResult.hazardous_mercury_present ? "Yes" : "No"}
                          </div>
                        )}
                        {parsedResult.hazardous_cadmium_present !== undefined && (
                          <div className={`p-1.5 border rounded ${parsedResult.hazardous_cadmium_present ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-background border-border"}`}>
                            Cd: {parsedResult.hazardous_cadmium_present ? "Yes" : "No"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Material Composition */}
                  {parsedResult.material_composition && Object.keys(parsedResult.material_composition).length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Material Composition</div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        {Object.entries(parsedResult.material_composition).map(([mat, val]) => (
                          <div key={mat} className="p-1.5 bg-background border border-border rounded">
                            <span className="text-muted-foreground capitalize">{mat}:</span> {val}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {parsedResult.confidence < 0.5 && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    Low confidence — please verify all fields before applying
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => applyPdfResult(parsedResult)} className="flex-1">
                    <Check className="mr-1 h-3 w-3" />
                    Apply to Form
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setParsedResult(null)}>
                    Try Another
                  </Button>
                </div>
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
        <Label className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Target Market <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "INDIA" as const, label: "India", sub: "Battery Aadhaar", icon: Flag },
            { value: "EU" as const, label: "EU Export", sub: "Battery Passport", icon: Leaf },
            { value: "GLOBAL" as const, label: "Global", sub: "Both Markets", icon: Globe },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setValue("marketRegion", opt.value, { shouldValidate: true });
                if (opt.value === "INDIA") {
                  setValue("certifications", ["AIS-156", "AIS-038"]);
                } else if (opt.value === "EU") {
                  setValue("certifications", ["CE"]);
                } else {
                  setValue("certifications", []);
                }
              }}
              className={`p-3 border-2 text-center transition-all ${
                marketRegion === opt.value
                  ? "border-foreground bg-accent text-foreground"
                  : "border-border hover:border-border text-muted-foreground"
              }`}
            >
              <opt.icon className="h-5 w-5 mx-auto mb-1" />
              <div className="text-sm">{opt.label}</div>
              <div className="text-xs opacity-70">{opt.sub}</div>
            </button>
          ))}
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

      {/* Model Name */}
      <div className="grid gap-2">
        <Label htmlFor="modelName">
          Model Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="modelName"
          {...register("modelName")}
          placeholder="e.g. ER-52V-20Ah"
          className={errors.modelName ? "border-red-500" : ""}
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

      {/* Manufacturer */}
      <div className="grid gap-2">
        <Label htmlFor="manufacturer">
          Manufacturer <span className="text-red-500">*</span>
        </Label>
        <Input
          id="manufacturer"
          {...register("manufacturer")}
          className={errors.manufacturer ? "border-red-500" : ""}
        />
        {errors.manufacturer && (
          <p className="text-xs text-red-500">{errors.manufacturer.message}</p>
        )}
      </div>

      {/* Manufacturer Address & Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="manufacturerAddress">Manufacturer Address</Label>
          <Input
            id="manufacturerAddress"
            {...register("manufacturerAddress")}
            placeholder="e.g. Industrial Area, New Delhi"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="manufacturerEmail">Compliance Email</Label>
          <Input
            id="manufacturerEmail"
            type="email"
            {...register("manufacturerEmail")}
            placeholder="e.g. compliance@company.com"
            className={errors.manufacturerEmail ? "border-red-500" : ""}
          />
          {errors.manufacturerEmail && (
            <p className="text-xs text-red-500">{errors.manufacturerEmail.message}</p>
          )}
        </div>
      </div>

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
          Required for EU Battery Passport QR codes. Enables GS1 Digital Link format: /01/&#123;gtin&#125;/21/&#123;serial&#125;
        </p>
      </div>
    </div>
  );
}
