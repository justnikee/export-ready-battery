import { describe, it, expect } from "vitest";
import fixtures from "../../../../test-fixtures/batch-validation-fixtures.json";
import {
  batchFormSchema,
  defaultBatchFormValues,
  type BatchFormData,
} from "./batch-form-schema";

// Shared cross-stack fixtures — the same cases run against the Go validator in
// services/battery-api/internal/services/batch_creation_validator_test.go
// (TestBatchCreationValidatorSharedFixtures). If one validator drifts from the
// other, this test (or its Go counterpart) catches it.

const validBaseline: BatchFormData = {
  ...defaultBatchFormValues,
  batchName: "TestBatch",
  modelName: "TestModel",
  manufacturer: "TestManufacturer",
  capacity: "2500mAh",
  voltage: "3.7V",
  manufacturingStartDate: "2024-01-01",
  manufacturingEndDate: "2024-06-01",
  hsnCode: "85076000",
};

interface FixtureCase {
  name: string;
  marketRegion?: string;
  cellSource?: string;
  hsnCode?: string;
  salePrice?: number;
  importCost?: number;
  pliCompliant?: boolean;
  dvaSource?: string;
  auditedDva?: number | null;
  uploadedFileUrl?: string | null;
  batteryCategory?: string;
  billOfEntryNo?: string;
  cellCountryOfOrigin?: string;
  customsDate?: string;
  manufacturingStartDate?: string;
  manufacturingEndDate?: string;
  expectValid: boolean;
  expectErrors?: { go: string; ts: string }[];
}

const cases = fixtures.cases as FixtureCase[];

function buildFormData(tc: FixtureCase): BatchFormData {
  return {
    ...validBaseline,
    ...(tc.marketRegion !== undefined && { marketRegion: tc.marketRegion as BatchFormData["marketRegion"] }),
    ...(tc.cellSource !== undefined && { cellSource: tc.cellSource as BatchFormData["cellSource"] }),
    ...(tc.hsnCode !== undefined && { hsnCode: tc.hsnCode }),
    ...(tc.salePrice !== undefined && { salePrice: String(tc.salePrice) }),
    ...(tc.importCost !== undefined && { importCost: String(tc.importCost) }),
    ...(tc.pliCompliant !== undefined && { pliCompliant: tc.pliCompliant }),
    ...(tc.dvaSource !== undefined && { dvaSource: tc.dvaSource as BatchFormData["dvaSource"] }),
    ...(tc.auditedDva !== undefined && { auditedDva: tc.auditedDva === null ? "" : String(tc.auditedDva) }),
    ...(tc.uploadedFileUrl !== undefined && { uploadedFileUrl: tc.uploadedFileUrl }),
    ...(tc.batteryCategory !== undefined && { batteryCategory: tc.batteryCategory }),
    ...(tc.billOfEntryNo !== undefined && { billOfEntryNo: tc.billOfEntryNo }),
    ...(tc.cellCountryOfOrigin !== undefined && { cellCountryOfOrigin: tc.cellCountryOfOrigin }),
    ...(tc.customsDate !== undefined && { customsDate: tc.customsDate }),
    ...(tc.manufacturingStartDate !== undefined && { manufacturingStartDate: tc.manufacturingStartDate }),
    ...(tc.manufacturingEndDate !== undefined && { manufacturingEndDate: tc.manufacturingEndDate }),
  };
}

describe("batchFormSchema — shared cross-stack fixtures", () => {
  for (const tc of cases) {
    it(tc.name, () => {
      const result = batchFormSchema.safeParse(buildFormData(tc));

      if (tc.expectValid) {
        expect(result.success, JSON.stringify(!result.success && result.error.issues)).toBe(true);
        return;
      }

      expect(result.success).toBe(false);
      if (!result.success) {
        const issuePaths = result.error.issues.map((issue) => issue.path.join("."));
        for (const expected of tc.expectErrors ?? []) {
          expect(issuePaths).toContain(expected.ts);
        }
      }
    });
  }
});
