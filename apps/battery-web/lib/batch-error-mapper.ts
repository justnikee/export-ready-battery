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
  // Bare country_of_origin is the cell's customs import origin (India +
  // IMPORTED only) — distinct from specs.country_of_origin below, which is
  // the battery's manufacturing origin set in the Specifications step.
  country_of_origin: "cellCountryOfOrigin",
  customs_date: "customsDate",
  // Backend reports the estimator-mode DVA shortfall under domestic_value_add,
  // but the frontend's equivalent check lives on salePrice (see batch-form-schema.ts).
  domestic_value_add: "salePrice",
  pli_compliant: "pliCompliant",
  dva_source: "dvaSource",
  audited_domestic_value_add: "auditedDva",
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

export interface BatchCreationError {
  message?: string;
  response?: {
    status?: number;
    statusText?: string;
    data?: { error?: string; fields?: Array<{ field: string; message: string }> };
  };
}

/** CreateBatch's 422 contains both a summary and field details. Show the fields first. */
export function describeBatchCreationError(error: BatchCreationError): {
  message: string;
  fields: Array<{ field: string; message: string }>;
} {
  const fields = error.response?.data?.fields;
  if (Array.isArray(fields) && fields.length > 0) {
    const mapped = fields.map(({ field, message }) => ({
      field: mapBackendFieldToFormPath(field),
      message,
    }));
    return {
      message: `Please fix the highlighted ${mapped.length} field(s) before submitting.`,
      fields: mapped,
    };
  }
  return {
    message: error.response?.data?.error ||
      (error.response?.statusText
        ? `Server error (${error.response.status}): ${error.response.statusText}`
        : error.message || "Failed to create batch"),
    fields: [],
  };
}
