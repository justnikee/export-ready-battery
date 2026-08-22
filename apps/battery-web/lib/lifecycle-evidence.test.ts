import { describe, expect, it } from "vitest";
import { buildEvidencePayload, evidenceFieldsForAction } from "./lifecycle-evidence";

describe("buildEvidencePayload", () => {
  it("includes only required recycle keys and reports missing", () => {
    const { evidence, missing } = buildEvidencePayload("RECYCLE", {
      recycler_epr_id: "  EPR-1  ",
      recycling_date: "2026-03-01",
      extra_ignored: "nope",
    });
    expect(evidence).toEqual({
      recycler_epr_id: "EPR-1",
      recycling_date: "2026-03-01",
    });
    expect(missing).toEqual(["Certificate Reference"]);
  });

  it("returns empty evidence for ACTIVATE (no extra keys)", () => {
    const { evidence, missing } = buildEvidencePayload("ACTIVATE", {
      shipment_reference: "should-not-send",
    });
    expect(evidence).toEqual({});
    expect(missing).toEqual([]);
  });

  it("prefers server-required keys over the local catalog", () => {
    const fields = evidenceFieldsForAction("RECYCLE", ["recycler_epr_id"]);
    expect(fields.map((f) => f.key)).toEqual(["recycler_epr_id"]);
    const { evidence, missing } = buildEvidencePayload(
      "RECYCLE",
      { recycler_epr_id: "EPR-9" },
      ["recycler_epr_id"],
    );
    expect(evidence).toEqual({ recycler_epr_id: "EPR-9" });
    expect(missing).toEqual([]);
  });
});
