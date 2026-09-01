import { describe, it, expect } from "vitest";
import { parseDispatchScan, shouldShipAfterActivateFailure } from "./dispatch-scan";

describe("parseDispatchScan", () => {
  it("extracts a raw UUID", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(parseDispatchScan(id)).toEqual({ kind: "uuid", uuid: id });
  });

  it("extracts UUID from a public passport URL", () => {
    const id = "22222222-2222-4222-8222-222222222222";
    expect(parseDispatchScan(`https://app.anvayalabs.in/p/${id}?bpan=EU-FOO-LFP-2026-00001`)).toEqual({
      kind: "uuid",
      uuid: id,
    });
  });

  it("accepts a BPAN V2 serial", () => {
    expect(parseDispatchScan("eu-foo-lfp-2026-00001")).toEqual({
      kind: "bpan",
      serial: "EU-FOO-LFP-2026-00001",
    });
  });

  it("rejects empty and garbage", () => {
    expect(parseDispatchScan("")).toEqual({ kind: "invalid" });
    expect(parseDispatchScan("PACK-1")).toEqual({ kind: "invalid" });
  });
});

describe("shouldShipAfterActivateFailure", () => {
  it("ships units that were already ACTIVE", () => {
    expect(shouldShipAfterActivateFailure("Action ACTIVATE not allowed from ACTIVE. Allowed actions: [SHIP]")).toBe(
      true,
    );
  });

  it("does not ship CREATED units that failed ACTIVATE", () => {
    expect(shouldShipAfterActivateFailure("Action SHIP not allowed from CREATED")).toBe(false);
    expect(shouldShipAfterActivateFailure("missing evidence")).toBe(false);
  });
});
