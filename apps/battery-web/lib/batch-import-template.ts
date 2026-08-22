/**
 * Bulk-import CSV contract. Headers must stay in sync with
 * BulkImportBatches (services/battery-api/internal/handlers/bulk_handlers.go)
 * and BatchCreationValidator — the importer now runs the same rules as create.
 */

export interface ImportColumn {
  key: string;
  required: boolean | string;
  note: string;
}

export const BATCH_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "batch_name", required: true, note: "Unique name for this production run" },
  { key: "model_name", required: true, note: "Product / model name" },
  { key: "market_region", required: "INDIA or EU", note: "INDIA, EU, or GLOBAL. Blank uses tenant primary market" },
  { key: "chemistry", required: false, note: "LFP, NMC, NMC622, NMC811, NCA, LCO, …" },
  { key: "capacity", required: false, note: "e.g. 50 kWh or 2500 mAh" },
  { key: "voltage", required: false, note: "e.g. 3.2 V" },
  { key: "weight", required: false, note: "e.g. 25 kg" },
  { key: "manufacturer", required: false, note: "Plant / brand name" },
  { key: "country_of_origin", required: "India IMPORTED", note: "ISO-2 cell origin when cell_source=IMPORTED" },
  { key: "manufacturing_start_date", required: false, note: "YYYY-MM-DD" },
  { key: "manufacturing_end_date", required: false, note: "YYYY-MM-DD" },
  { key: "battery_category", required: "EU", note: "EV, LMT, INDUSTRIAL, PORTABLE, or SLI (Art. 3)" },
  { key: "cell_source", required: "India", note: "DOMESTIC or IMPORTED" },
  { key: "hsn_code", required: "India", note: "8 digits starting 8507, e.g. 85076000" },
  { key: "sale_price_inr", required: "India DOMESTIC", note: "Net selling price. Used to compute DVA" },
  { key: "cell_cost_domestic_inr", required: "India DOMESTIC", note: "Domestic cell cost (PLI-ACC breakdown)" },
  { key: "labour_overhead_cost_inr", required: false, note: "Domestic labour / overhead" },
  { key: "cell_cost_imported_inr", required: false, note: "Imported cell cost" },
  { key: "bms_cost_domestic_inr", required: false, note: "Domestic BMS cost" },
  { key: "bms_cost_imported_inr", required: false, note: "Imported BMS cost" },
  { key: "casing_cost_domestic_inr", required: false, note: "Domestic casing cost" },
  { key: "casing_cost_imported_inr", required: false, note: "Imported casing cost" },
  { key: "import_cost_inr", required: false, note: "Legacy DVA shortcut if breakdown is empty" },
  { key: "pli_compliant", required: false, note: "true/false. IMPORTED cannot be PLI" },
  { key: "bill_of_entry_no", required: "India IMPORTED", note: "Customs bill of entry" },
  { key: "customs_date", required: "India IMPORTED", note: "YYYY-MM-DD" },
  { key: "bis_number", required: false, note: "BIS R-number" },
  { key: "epr_number", required: false, note: "CPCB EPR number" },
  { key: "lot_size", required: false, note: "Optional lot size" },
  { key: "production_stage", required: false, note: "Optional stage label" },
];

/** Example rows that satisfy create-time validator (activation still has extra gates). */
export const BATCH_IMPORT_SAMPLE_ROWS: Record<string, string>[] = [
  {
    batch_name: "IND-LFP-DOM-2026-A",
    model_name: "Tiago EV Pack",
    market_region: "INDIA",
    chemistry: "LFP",
    capacity: "19.2 kWh",
    voltage: "3.2 V",
    weight: "220 kg",
    manufacturer: "Example Cells Pvt Ltd",
    country_of_origin: "IN",
    manufacturing_start_date: "2026-01-01",
    manufacturing_end_date: "2026-01-31",
    battery_category: "",
    cell_source: "DOMESTIC",
    hsn_code: "85076000",
    sale_price_inr: "350000",
    cell_cost_domestic_inr: "140000",
    labour_overhead_cost_inr: "40000",
    cell_cost_imported_inr: "0",
    bms_cost_domestic_inr: "20000",
    bms_cost_imported_inr: "0",
    casing_cost_domestic_inr: "15000",
    casing_cost_imported_inr: "0",
    import_cost_inr: "0",
    pli_compliant: "false",
    bill_of_entry_no: "",
    customs_date: "",
    bis_number: "R-41001234",
    epr_number: "",
    lot_size: "500",
    production_stage: "pack",
  },
  {
    batch_name: "IND-LFP-IMP-2026-B",
    model_name: "Scooter Module",
    market_region: "INDIA",
    chemistry: "LFP",
    capacity: "4 kWh",
    voltage: "3.2 V",
    weight: "45 kg",
    manufacturer: "Example Cells Pvt Ltd",
    country_of_origin: "CN",
    manufacturing_start_date: "2026-02-01",
    manufacturing_end_date: "2026-02-15",
    battery_category: "",
    cell_source: "IMPORTED",
    hsn_code: "85076000",
    sale_price_inr: "65000",
    cell_cost_domestic_inr: "0",
    labour_overhead_cost_inr: "0",
    cell_cost_imported_inr: "28000",
    bms_cost_domestic_inr: "0",
    bms_cost_imported_inr: "0",
    casing_cost_domestic_inr: "0",
    casing_cost_imported_inr: "0",
    import_cost_inr: "28000",
    pli_compliant: "false",
    bill_of_entry_no: "BOE-2026-00421",
    customs_date: "2026-01-20",
    bis_number: "",
    epr_number: "",
    lot_size: "200",
    production_stage: "pack",
  },
  {
    batch_name: "EU-NMC-2026-C",
    model_name: "Export EV Pack",
    market_region: "EU",
    chemistry: "NMC",
    capacity: "75 kWh",
    voltage: "3.6 V",
    weight: "450 kg",
    manufacturer: "Example Cells Pvt Ltd",
    country_of_origin: "IN",
    manufacturing_start_date: "2026-03-01",
    manufacturing_end_date: "2026-03-20",
    battery_category: "EV",
    cell_source: "",
    hsn_code: "",
    sale_price_inr: "",
    cell_cost_domestic_inr: "",
    labour_overhead_cost_inr: "",
    cell_cost_imported_inr: "",
    bms_cost_domestic_inr: "",
    bms_cost_imported_inr: "",
    casing_cost_domestic_inr: "",
    casing_cost_imported_inr: "",
    import_cost_inr: "",
    pli_compliant: "",
    bill_of_entry_no: "",
    customs_date: "",
    bis_number: "",
    epr_number: "",
    lot_size: "100",
    production_stage: "pack",
  },
];

export function buildBatchImportTemplateCsv(): string {
  const headers = BATCH_IMPORT_COLUMNS.map((c) => c.key);
  const lines = [headers.join(",")];
  for (const row of BATCH_IMPORT_SAMPLE_ROWS) {
    lines.push(
      headers
        .map((key) => csvEscape(row[key] ?? ""))
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadBatchImportTemplate(): void {
  const blob = new Blob([buildBatchImportTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "batch_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
