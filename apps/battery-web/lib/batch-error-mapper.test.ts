import { describe, expect, it } from "vitest";
import { describeBatchCreationError } from "./batch-error-mapper";

describe("CreateBatch validation response", () => {
  it("shows field errors when the API includes both a summary and fields", () => {
    const result = describeBatchCreationError({
      response: {
        status: 422,
        data: {
          error: "Validation failed",
          fields: [
            { field: "batch_name", message: "Batch name is required" },
            { field: "specs.chemistry", message: "Chemistry is required" },
          ],
        },
      },
    });
    expect(result.fields).toEqual([
      { field: "batchName", message: "Batch name is required" },
      { field: "chemistry", message: "Chemistry is required" },
    ]);
    expect(result.message).toContain("2 field(s)");
  });

  it("keeps a server error without field details", () => {
    expect(describeBatchCreationError({ response: { data: { error: "Unavailable" } } })).toEqual({
      message: "Unavailable",
      fields: [],
    });
  });
});
