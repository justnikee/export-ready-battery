import { describe, expect, it } from "vitest";
import {
  BATCH_IMPORT_COLUMNS,
  BATCH_IMPORT_SAMPLE_ROWS,
  buildBatchImportTemplateCsv,
} from "./batch-import-template";

describe("batch import template", () => {
  it("includes columns the create validator actually reads", () => {
    const keys = BATCH_IMPORT_COLUMNS.map((c) => c.key);
    for (const required of [
      "batch_name",
      "model_name",
      "market_region",
      "hsn_code",
      "cell_source",
      "sale_price_inr",
      "cell_cost_domestic_inr",
      "battery_category",
      "bill_of_entry_no",
      "customs_date",
    ]) {
      expect(keys).toContain(required);
    }
  });

  it("ships example India DOMESTIC, IMPORTED, and EU rows", () => {
    const markets = BATCH_IMPORT_SAMPLE_ROWS.map((r) => r.market_region);
    expect(markets).toEqual(["INDIA", "INDIA", "EU"]);
    const domestic = BATCH_IMPORT_SAMPLE_ROWS[0];
    expect(domestic.cell_source).toBe("DOMESTIC");
    expect(domestic.hsn_code).toMatch(/^8507/);
    expect(Number(domestic.sale_price_inr)).toBeGreaterThan(0);
    expect(Number(domestic.cell_cost_domestic_inr)).toBeGreaterThan(0);
    const imported = BATCH_IMPORT_SAMPLE_ROWS[1];
    expect(imported.cell_source).toBe("IMPORTED");
    expect(imported.bill_of_entry_no).not.toBe("");
    expect(imported.customs_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(imported.pli_compliant).toBe("false");
    const eu = BATCH_IMPORT_SAMPLE_ROWS[2];
    expect(eu.battery_category).toBe("EV");
  });

  it("CSV header matches the column catalog", () => {
    const csv = buildBatchImportTemplateCsv();
    const header = csv.split("\n")[0];
    expect(header.split(",")).toEqual(BATCH_IMPORT_COLUMNS.map((c) => c.key));
    expect(csv.split("\n").filter(Boolean).length).toBe(
      1 + BATCH_IMPORT_SAMPLE_ROWS.length,
    );
  });
});
