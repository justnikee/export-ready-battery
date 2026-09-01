import { describe, it, expect } from "vitest";
import {
  getActivationBlockers,
  mergeActivationBlockers,
  isProfileBlocker,
  formatBlockerLabel,
  type ActivationBatchInput,
  type ActivationTenantFields,
} from "./activation-blockers";

const fullTenant: ActivationTenantFields = {
  epr_registration_number: "EPR-1",
  bis_r_number: "R-123",
  iec_code: "IEC-1",
  morth_manufacturer_code: "MORTH-1",
  company_name: "Acme",
  address: "12 Industrial Park",
  eu_authorized_representative_name: "EU Rep",
  eu_authorized_representative_address: "1 EU Street",
  eu_contact_email: "rep@acme.eu",
};

function indiaBatch(overrides: Partial<ActivationBatchInput> = {}): ActivationBatchInput {
  return {
    model_name: "BT-LFP-2500",
    market_region: "INDIA",
    manufacturing_start_date: "2026-01-01",
    manufacturing_end_date: "2026-02-01",
    domestic_value_add: 60,
    specs: {
      chemistry: "LFP",
      capacity: "2500mAh",
      cell_source: "DOMESTIC",
      certifications: ["AIS-156", "AIS-038"],
      bis_certificate_issue_date: "2026-01-01",
      un38_3_test_date: "2026-01-01",
      iec_62133_test_date: "2026-01-01",
      msds_issue_date: "2026-01-01",
    },
    ...overrides,
  };
}

function euBatch(overrides: Partial<ActivationBatchInput> = {}): ActivationBatchInput {
  return {
    model_name: "EU-NMC-1",
    market_region: "EU",
    manufacturing_start_date: "2026-01-01",
    manufacturing_end_date: "2026-02-01",
    carbon_footprint_result: { total: 12 },
    specs: {
      chemistry: "NMC",
      capacity: "180Wh",
      battery_category: "INDUSTRIAL",
      material_composition: { nickel: "30" },
      hazardous_substances: { declaration: "none present" },
      expected_lifetime_cycles: 2000,
      warranty_months: 24,
    },
    ...overrides,
  };
}

describe("getActivationBlockers", () => {
  it("returns no blockers for a complete India batch with full profile", () => {
    const { blocking } = getActivationBlockers(indiaBatch(), fullTenant);
    expect(blocking).toEqual([]);
  });

  it("returns no blockers for a complete EU batch with full profile", () => {
    const { blocking } = getActivationBlockers(euBatch(), fullTenant);
    expect(blocking).toEqual([]);
  });

  it("flags missing core data fields", () => {
    const { blocking } = getActivationBlockers(
      indiaBatch({ model_name: "", specs: { chemistry: "", capacity: "" } }),
      fullTenant,
    );
    expect(blocking).toContain("model_name");
    expect(blocking).toContain("specs.chemistry");
    expect(blocking).toContain("specs.capacity");
  });

  it("flags missing tenant/profile fields as profile blockers", () => {
    const { blocking } = getActivationBlockers(indiaBatch(), {});
    expect(blocking).toContain("tenant.epr_registration_number");
    expect(blocking.filter(isProfileBlocker).length).toBeGreaterThan(0);
  });

  it("requires import docs only for IMPORTED cells", () => {
    const imported = getActivationBlockers(
      indiaBatch({ domestic_value_add: 0, specs: { chemistry: "LFP", capacity: "2500mAh", cell_source: "IMPORTED", certifications: ["AIS-156", "AIS-038"] } }),
      fullTenant,
    );
    expect(imported.blocking).toContain("bill_of_entry_no");
    expect(imported.blocking).toContain("customs_date");
  });

  it("warns when PLI is claimed below 50% DVA", () => {
    const { warnings } = getActivationBlockers(
      indiaBatch({ pli_compliant: true, domestic_value_add: 30 }),
      fullTenant,
    );
    expect(warnings.some((w) => w.includes("PLI"))).toBe(true);
  });

  it("flags EU carbon footprint and battery category when missing", () => {
    const { blocking } = getActivationBlockers(
      euBatch({ carbon_footprint_result: null, specs: { chemistry: "NMC", capacity: "180Wh" } }),
      fullTenant,
    );
    expect(blocking).toContain("carbon_footprint_result");
    expect(blocking).toContain("specs.battery_category");
  });

  it("requires AIS only for EV/LMT traction, not industrial", () => {
    const industrial = getActivationBlockers(
      indiaBatch({ specs: { chemistry: "LFP", capacity: "2500mAh", cell_source: "DOMESTIC", battery_category: "INDUSTRIAL", certifications: [] } }),
      fullTenant,
    );
    expect(industrial.blocking).not.toContain("specs.certifications: AIS-156");
    expect(industrial.blocking).not.toContain("specs.certifications: AIS-038");

    const lmt = getActivationBlockers(
      indiaBatch({
        specs: {
          chemistry: "LFP",
          capacity: "2500mAh",
          cell_source: "DOMESTIC",
          battery_category: "LMT",
          certifications: [],
          bis_certificate_issue_date: "2026-01-01",
          un38_3_test_date: "2026-01-01",
          iec_62133_test_date: "2026-01-01",
          msds_issue_date: "2026-01-01",
        },
      }),
      fullTenant,
    );
    expect(lmt.blocking).toContain("specs.certifications: AIS-156");
    expect(lmt.blocking).toContain("specs.certifications: AIS-038");
  });

  it("does not block EU activation when recycled content is undeclared", () => {
    const { blocking, warnings } = getActivationBlockers(
      euBatch({
        specs: {
          chemistry: "NMC",
          capacity: "180Wh",
          battery_category: "LMT",
          material_composition: { nickel: "30", recycled_nickel: "0" },
          hazardous_substances: { declaration: "none present" },
          expected_lifetime_cycles: 2000,
          warranty_months: 24,
        },
      }),
      fullTenant,
    );
    expect(blocking).toEqual([]);
    expect(warnings.some((w) => w.includes("2031"))).toBe(true);
  });

  it("does not accept free-text carbon_footprint as Art. 7 compliance", () => {
    const { blocking } = getActivationBlockers(
      euBatch({
        carbon_footprint_result: null,
        specs: {
          chemistry: "NMC",
          capacity: "180Wh",
          battery_category: "EV",
          carbon_footprint: "12 kg CO2e",
        },
      }),
      fullTenant,
    );
    expect(blocking).toContain("carbon_footprint_result");
  });
});

describe("mergeActivationBlockers", () => {
  it("surfaces backend-only blockers the heuristic misses (e.g. cert dates)", () => {
    const heuristic = { blocking: ["model_name"], warnings: [] };
    const gaps = [
      { field: "batch.specs.bis_certificate_issue_date", message: "BIS date required", severity: "ERROR" },
      { field: "batch.specs.un38_3_test_date", message: "UN38.3 required", severity: "ERROR" },
    ];
    const merged = mergeActivationBlockers(heuristic, gaps);
    expect(merged.blocking).toContain("specs.bis_certificate_issue_date");
    expect(merged.blocking).toContain("specs.un38_3_test_date");
    expect(merged.blocking).toContain("model_name");
  });

  it("dedupes overlapping heuristic and gap fields after normalization", () => {
    const heuristic = { blocking: ["specs.certifications: AIS-156"], warnings: [] };
    const gaps = [
      { field: "batch.specs.certifications[AIS-156]", message: "AIS-156 required", severity: "ERROR" },
    ];
    const merged = mergeActivationBlockers(heuristic, gaps);
    expect(merged.blocking.filter((b) => b === "specs.certifications: AIS-156")).toHaveLength(1);
  });

  it("routes warnings from gaps and ignores non-error severities for blocking", () => {
    const merged = mergeActivationBlockers(
      { blocking: [], warnings: [] },
      [
        { field: "batch.specs.bis_number", message: "BIS number recommended", severity: "WARNING" },
        { field: "x", message: "info", severity: "INFO" },
      ],
    );
    expect(merged.blocking).toHaveLength(0);
    expect(merged.warnings).toContain("BIS number recommended");
  });

  it("returns the heuristic unchanged when there are no gaps", () => {
    const heuristic = { blocking: ["model_name"], warnings: ["w"] };
    expect(mergeActivationBlockers(heuristic, [])).toEqual(heuristic);
    expect(mergeActivationBlockers(heuristic, null)).toEqual(heuristic);
  });
});

describe("isProfileBlocker / formatBlockerLabel", () => {
  it("distinguishes tenant blockers from batch blockers", () => {
    expect(isProfileBlocker("tenant.iec_code")).toBe(true);
    expect(isProfileBlocker("model_name")).toBe(false);
    expect(isProfileBlocker("specs.chemistry")).toBe(false);
  });

  it("formats known keys to readable labels", () => {
    expect(formatBlockerLabel("model_name")).toBe("Model name");
    expect(formatBlockerLabel("specs.battery_category")).toBe("EU battery category");
  });
});
