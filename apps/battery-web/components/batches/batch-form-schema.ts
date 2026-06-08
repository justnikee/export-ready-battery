import { z } from "zod";

export type MarketRegion = "INDIA" | "EU" | "GLOBAL";
export type CellSource = "IMPORTED" | "DOMESTIC" | "";
export type DvaSource = "ESTIMATED" | "AUDITED";

export const materialCompositionSchema = z.object({
  cobalt: z.string(),
  lithium: z.string(),
  nickel: z.string(),
  manganese: z.string(),
  graphite: z.string(),
  lead: z.string(),
  recycled_cobalt: z.string(),
  recycled_lithium: z.string(),
  recycled_nickel: z.string(),
  recycled_lead: z.string(),
});

export const hazardousSubstancesSchema = z.object({
  lead: z.boolean(),
  mercury: z.boolean(),
  cadmium: z.boolean(),
});

export const batchFormSchema = z
  .object({
    // Step 1: Identity
    batchName: z.string().min(1, "Batch name is required"),
    modelName: z.string().min(1, "Model name is required"),
    manufacturingStartDate: z.string().min(1, "Start date is required"),
    manufacturingEndDate: z.string().min(1, "End date is required"),
    marketRegion: z.enum(["INDIA", "EU", "GLOBAL"]),

    // Manufacturer info
    manufacturer: z.string().min(1, "Manufacturer is required"),
    manufacturerAddress: z.string(),
    manufacturerEmail: z.string().email("Invalid email").or(z.literal("")),
    countryOfOrigin: z.string().max(2, "Use 2-letter ISO code"),

    // Step 2: Specifications
    chemistry: z.enum([
      "LFP",
      "NMC",
      "NMC811",
      "NMC622",
      "NCA",
      "LCO",
      "LTO",
      "LMO",
      "Sodium-ion",
      "Li-ion",
    ]),
    batteryCategory: z.string(),
    capacity: z.string().min(1, "Capacity is required"),
    voltage: z.string().min(1, "Voltage is required"),
    weight: z.string(),
    recyclable: z.boolean(),

    // Material composition
    materialComposition: materialCompositionSchema,

    // Step 3: EU Compliance
    carbonFootprint: z.string(),
    certifications: z.array(z.string()),
    bisCertificateIssueDate: z.string(),
    un383TestDate: z.string(),
    iec62133TestDate: z.string(),
    msdsIssueDate: z.string(),
    recycledContent: z.string(),
    hazardousSubstances: hazardousSubstancesSchema,
    hazardousDeclaration: z.string(),
    euRepresentative: z.string(),
    euRepresentativeEmail: z.string().email("Invalid email").or(z.literal("")),
    euRepresentativeAddress: z.string(),
    expectedLifetime: z.string(),
    warrantyMonths: z.string(),
    ceMarking: z.boolean(),
    carbonPerformanceClass: z.string(),
    removableAndReplaceable: z.boolean(),
    notifiedBodyNumber: z.string(),
    docUploadUrl: z.string().nullable(),

    // Step 3: India Compliance
    pliCompliant: z.boolean(),
    hsnCode: z.string(),
    salePrice: z.string(),
    importCost: z.string(),
    cellSource: z.enum(["IMPORTED", "DOMESTIC", ""]),
    billOfEntryNo: z.string(),
    cellCountryOfOrigin: z.string().max(2),
    customsDate: z.string(),
    bisNumber: z.string(),
    eprNumber: z.string(),
    dvaSource: z.enum(["ESTIMATED", "AUDITED"]),
    auditedDva: z.string(),
    uploadedFileUrl: z.string().nullable(),

    // GS1 Digital Link GTIN for EU Battery Passport QR code compliance
    gtin: z.string(),

    // Step 4: Template
    saveAsTemplate: z.boolean(),
    templateName: z.string(),

    // Template selection (not part of submission)
    selectedTemplate: z.string(),
  })
  .superRefine((data, ctx) => {
    // Date ordering
    if (
      data.manufacturingStartDate &&
      data.manufacturingEndDate &&
      new Date(data.manufacturingEndDate) < new Date(data.manufacturingStartDate)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["manufacturingEndDate"],
      });
    }

    // Numeric validation for capacity, voltage, weight
    const numericWithUnitRegex = /^\d+(\.\d+)?\s*(mAh|V|g|kg|Wh)?$/i;
    if (data.capacity && !numericWithUnitRegex.test(data.capacity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Capacity must be a number with optional unit (e.g., 2500mAh)",
        path: ["capacity"],
      });
    }
    if (data.voltage && !numericWithUnitRegex.test(data.voltage)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Voltage must be a number with optional unit (e.g., 3.7V)",
        path: ["voltage"],
      });
    }
    if (data.weight && data.weight.trim() !== "" && !numericWithUnitRegex.test(data.weight)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weight must be a number with optional unit (e.g., 500g)",
        path: ["weight"],
      });
    }

    // Numeric validation for salePrice, importCost
    const plainNumberRegex = /^\d+(\.\d+)?$/;
    if (data.salePrice && data.salePrice.trim() !== "" && !plainNumberRegex.test(data.salePrice)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sale price must be a valid number",
        path: ["salePrice"],
      });
    }
    if (data.importCost && data.importCost.trim() !== "" && !plainNumberRegex.test(data.importCost)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Import cost must be a valid number",
        path: ["importCost"],
      });
    }

    // Carbon footprint numeric if provided
    if (data.carbonFootprint && data.carbonFootprint.trim() !== "" && !plainNumberRegex.test(data.carbonFootprint)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Carbon footprint must be a valid number",
        path: ["carbonFootprint"],
      });
    }

    // EU: battery category required
    if (data.marketRegion === "EU" && !data.batteryCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Battery category is required for EU compliance (Art. 3)",
        path: ["batteryCategory"],
      });
    }

    // GLOBAL: battery category recommended but not required (soft validation skipped)

    // Carbon performance class validation
    if (
      data.carbonPerformanceClass &&
      !/[A-G]/.test(data.carbonPerformanceClass)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Carbon performance class must be A–G",
        path: ["carbonPerformanceClass"],
      });
    }

    // Expected lifetime: positive number if provided
    if (data.expectedLifetime !== "") {
      const cycles = parseInt(data.expectedLifetime);
      if (isNaN(cycles) || cycles <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected lifetime must be a positive number",
          path: ["expectedLifetime"],
        });
      }
    }

    // Warranty months: positive number if provided
    if (data.warrantyMonths !== "") {
      const months = parseInt(data.warrantyMonths);
      if (isNaN(months) || months <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Warranty must be a positive number of months",
          path: ["warrantyMonths"],
        });
      }
    }

    // India: cell source required
    if (data.marketRegion === "INDIA" && !data.cellSource) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cell source is required for India compliance",
        path: ["cellSource"],
      });
    }

    // India: HSN code required and must start with 8507
    if (data.marketRegion === "INDIA") {
      if (!data.hsnCode.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "HSN Code is required for India",
          path: ["hsnCode"],
        });
      } else if (!data.hsnCode.startsWith("8507")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'HSN Code must start with "8507" (Li-ion accumulators)',
          path: ["hsnCode"],
        });
      }
    }

    // India imported: bill of entry, country, customs date required
    if (data.marketRegion === "INDIA" && data.cellSource === "IMPORTED") {
      if (!data.billOfEntryNo.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bill of Entry No. is required for imported cells",
          path: ["billOfEntryNo"],
        });
      }
      if (!data.cellCountryOfOrigin.trim() || data.cellCountryOfOrigin.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cell country of origin required (2-letter ISO code)",
          path: ["cellCountryOfOrigin"],
        });
      }
      if (!data.customsDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Import date is required for imported cells",
          path: ["customsDate"],
        });
      }
    }

    // India domestic: DVA must be > 0 if salePrice is provided
    if (data.marketRegion === "INDIA" && data.cellSource === "DOMESTIC") {
      const salePrice = parseFloat(data.salePrice) || 0;
      const importCost = parseFloat(data.importCost) || 0;
      if (salePrice > 0) {
        const dva = ((salePrice - importCost) / salePrice) * 100;
        if (dva <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Domestic batches must have Domestic Value Add > 0%. Please check sale price and import cost.",
            path: ["salePrice"],
          });
        }
      }
    }

    // India PLI: DVA must be >= 50%
    if (data.marketRegion === "INDIA" && data.pliCompliant && data.cellSource === "DOMESTIC") {
      const salePrice = parseFloat(data.salePrice) || 0;
      const importCost = parseFloat(data.importCost) || 0;
      if (salePrice > 0) {
        const dva = ((salePrice - importCost) / salePrice) * 100;
        if (dva < 50) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `PLI Scheme requires minimum 50% Domestic Value Add. Calculated DVA: ${dva.toFixed(2)}%`,
            path: ["pliCompliant"],
          });
        }
      }
    }

    // India: audited DVA validation
    if (
      data.marketRegion === "INDIA" &&
      data.cellSource !== "IMPORTED" &&
      data.dvaSource === "AUDITED"
    ) {
      if (!data.auditedDva.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Audited DVA % is required",
          path: ["auditedDva"],
        });
      } else {
        const dva = parseFloat(data.auditedDva);
        if (isNaN(dva) || dva < 0 || dva > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Audited DVA must be between 0 and 100",
            path: ["auditedDva"],
          });
        }
      }
      if (!data.uploadedFileUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CA Certificate upload is required for audited mode",
          path: ["uploadedFileUrl"],
        });
      }
    }

    // Material composition total <= 100
    const matTotal = (
      ["cobalt", "lithium", "nickel", "manganese", "graphite", "lead"] as const
    ).reduce(
      (sum, key) => sum + (parseFloat(data.materialComposition[key]) || 0),
      0,
    );
    if (matTotal > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Material composition total is ${matTotal.toFixed(1)}% — cannot exceed 100%`,
        path: ["materialComposition"],
      });
    }

    // Template name required if saveAsTemplate is checked
    if (data.saveAsTemplate && !data.templateName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Template name is required",
        path: ["templateName"],
      });
    }
  });

export type BatchFormData = z.infer<typeof batchFormSchema>;

export const defaultBatchFormValues: BatchFormData = {
  batchName: "",
  modelName: "",
  manufacturingStartDate: "",
  manufacturingEndDate: "",
  marketRegion: "INDIA",
  manufacturer: "",
  manufacturerAddress: "",
  manufacturerEmail: "",
  countryOfOrigin: "",
  chemistry: "LFP",
  batteryCategory: "",
  capacity: "",
  voltage: "",
  weight: "",
  recyclable: false,
  materialComposition: {
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
  },
  carbonFootprint: "",
  certifications: ["AIS-156", "AIS-038"],
  recycledContent: "",
  hazardousSubstances: { lead: false, mercury: false, cadmium: false },
  hazardousDeclaration: "",
  euRepresentative: "",
  euRepresentativeEmail: "",
  euRepresentativeAddress: "",
  expectedLifetime: "",
  warrantyMonths: "",
  ceMarking: false,
  carbonPerformanceClass: "",
  removableAndReplaceable: false,
  notifiedBodyNumber: "",
  docUploadUrl: null,
  bisCertificateIssueDate: "",
  un383TestDate: "",
  iec62133TestDate: "",
  msdsIssueDate: "",
  pliCompliant: false,
  hsnCode: "",
  salePrice: "",
  importCost: "",
  cellSource: "DOMESTIC",
  billOfEntryNo: "",
  cellCountryOfOrigin: "",
  customsDate: "",
  bisNumber: "",
  eprNumber: "",
  dvaSource: "ESTIMATED",
  auditedDva: "",
  uploadedFileUrl: null,
  gtin: "",
  saveAsTemplate: false,
  templateName: "",
  selectedTemplate: "",
};
