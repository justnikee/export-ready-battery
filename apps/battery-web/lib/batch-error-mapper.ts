/**
 * Maps backend field names from /batches/validate to frontend react-hook-form paths.
 * Backend uses snake_case and dotted paths; frontend uses camelCase.
 */
export const backendFieldToFormPath: Record<string, string> = {
  batch_name: "batchName",
  model_name: "modelName",
  market_region: "marketRegion",
  manufacturing_start_date: "manufacturingStartDate",
  manufacturing_end_date: "manufacturingEndDate",
  "specs.chemistry": "chemistry",
  "specs.capacity": "capacity",
  "specs.voltage": "voltage",
  "specs.weight": "weight",
  "specs.manufacturer": "manufacturer",
  "specs.manufacturer_email": "manufacturerEmail",
  "specs.country_of_origin": "countryOfOrigin",
  "specs.gtin": "gtin",
  cell_source: "cellSource",
  hsn_code: "hsnCode",
  bill_of_entry_no: "billOfEntryNo",
  country_of_origin: "countryOfOrigin",
  customs_date: "customsDate",
  domestic_value_add: "domesticValueAdd",
  pli_compliant: "pliCompliant",
  dva_source: "dvaSource",
  audited_dva: "auditedDva",
  battery_category: "batteryCategory",
  carbon_footprint: "carbonFootprint",
  expected_lifetime_cycles: "expectedLifetime",
  warranty_months: "warrantyMonths",
  carbon_performance_class: "carbonPerformanceClass",
  notified_body_number: "notifiedBodyNumber",
  "specs.components": "components",
}

/**
 * Translates a backend validation error field to a frontend form path.
 * Falls back to the original field name if no mapping exists.
 */
export function mapBackendFieldToFormPath(backendField: string): string {
  return backendFieldToFormPath[backendField] ?? backendField
}
