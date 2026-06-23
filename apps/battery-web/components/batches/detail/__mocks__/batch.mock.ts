import type { Batch } from "@/lib/types";

export function createMockBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: "batch-123",
    tenant_id: "tenant-1",
    batch_name: "Test Batch",
    model_name: "Model-X",
    specs: {
      chemistry: "LFP",
      voltage: "3.2V",
      capacity: "100Ah",
      manufacturer: "Test Mfg",
      weight: "25kg",
      recyclable: true,
      carbon_footprint: "120 kg CO2e",
      country_of_origin: "India",
      bis_certificate_issue_date: "2024-01-15",
      un38_3_test_date: "2024-02-01",
      iec_62133_test_date: "2023-12-01",
      msds_issue_date: "2024-01-01",
      manufacturer_email: "test@example.com",
      manufacturer_address: "123 Factory Rd, Shenzhen",
      lot_size: "1000",
      production_stage: "CELL_ASSEMBLY",
      material_composition: {
        cobalt_pct: 5,
        lithium_pct: 12,
        nickel_pct: 8,
        lead_pct: 0,
        manganese_pct: 15,
        graphite_pct: 25,
      },
      certifications: ["BIS", "UN38.3"],
      ...overrides.specs,
    },
    created_at: "2024-01-01T00:00:00Z",
    status: "ACTIVE",
    market_region: "INDIA",
    pli_compliant: true,
    domestic_value_add: 65,
    total_passports: 42,
    compliance_score: 85,
    manufacturing_start_date: "2024-01-01",
    manufacturing_end_date: "2024-01-15",
    ...overrides,
  };
}

export function createEmptyMockBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: "batch-empty",
    tenant_id: "tenant-1",
    batch_name: "Empty Batch",
    specs: {
      chemistry: "",
      voltage: "",
      capacity: "",
      manufacturer: "",
      weight: "",
      recyclable: false,
      carbon_footprint: "",
      country_of_origin: "",
      ...overrides.specs,
    },
    created_at: "2024-01-01T00:00:00Z",
    status: "DRAFT",
    market_region: "GLOBAL",
    pli_compliant: false,
    domestic_value_add: 0,
    total_passports: 0,
    ...overrides,
  };
}
