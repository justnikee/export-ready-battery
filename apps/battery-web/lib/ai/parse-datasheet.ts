import api from "@/lib/api";

export interface DatasheetParseResult {
  // Identity
  model_name: string;
  part_number: string;
  serial_number_format: string;

  // Electrical
  chemistry: string;
  capacity: string;
  voltage: string;
  energy_density: string;
  internal_resistance: string;
  max_charge_current: string;
  max_discharge_current: string;
  cutoff_voltage: string;

  // Physical
  weight: string;
  dimensions: string;
  terminal_type: string;
  ip_rating: string;

  // Performance
  cycle_life: string;
  calendar_life: string;
  expected_lifetime_cycles: string;
  operating_temperature: string;
  storage_temperature: string;
  self_discharge: string;

  // Manufacturer
  manufacturer: string;
  manufacturer_address: string;
  manufacturer_email: string;
  country_of_origin: string;
  factory_location: string;

  // Certifications & Safety
  certifications: string[];
  un38_3: boolean;
  ce_marking: boolean;
  ul_listed: boolean;
  bis_certified: boolean;
  iec_62133: boolean;
  rohs_compliant: boolean;
  reach_compliant: boolean;

  // EU Battery Regulation
  notified_body_number: string;
  eu_representative: string;
  eu_representative_email: string;
  eu_representative_address: string;
  removable_and_replaceable: boolean;
  carbon_footprint: string;
  carbon_performance_class: string;
  warranty_months: string;

  // India Compliance
  bis_number: string;
  epr_number: string;
  hsn_code: string;
  is_standard: string;

  // Material Composition
  material_composition: Record<string, string>;
  recycled_content_pct: string;
  recycled_cobalt: string;
  recycled_lithium: string;
  recycled_nickel: string;
  recycled_lead: string;

  // Hazardous Substances
  hazardous_lead_present: boolean;
  hazardous_mercury_present: boolean;
  hazardous_cadmium_present: boolean;
  hazardous_declaration: string;

  // Metadata
  confidence: number;
  method: "regex" | "llm" | "cached";
  processing_time_ms: number;
  // Per-field provenance for a tracked subset of fields: "regex" | "llm" | "missing".
  // Powers the per-field confidence preview table — see ai-field-preview-table.tsx.
  field_sources?: Record<string, string>;
}

export interface ParseDatasheetResponse {
  data: DatasheetParseResult;
  confidence: number;
  method: string;
}

export async function parseDatasheet(
  text: string,
  signal?: AbortSignal
): Promise<ParseDatasheetResponse> {
  const response = await api.post("/ai/parse-datasheet", { text }, { signal });
  return response.data;
}

export interface NLCreateResult {
  batch_name: string | null;
  model_name: string | null;
  chemistry: string | null;
  capacity: string | null;
  voltage: string | null;
  quantity: number | null;
  market_region: string | null;
  customer_name: string | null;
  weight: string | null;
  battery_category: string | null;
  // India compliance hints (optional — only present when implied by the text)
  hsn_code?: string | null;
  cell_source?: string | null;
  // EU compliance hint
  carbon_performance_class?: string | null;
}

export async function createBatchFromNL(
  text: string,
  marketRegion?: string,
  signal?: AbortSignal
): Promise<NLCreateResult> {
  const response = await api.post(
    "/ai/nl-create-batch",
    { text, market_region: marketRegion },
    { signal }
  );
  return response.data;
}
