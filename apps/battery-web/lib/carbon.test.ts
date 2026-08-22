import { describe, expect, it } from "vitest";
import {
  carbonSpecKey,
  isCarbonResultCurrent,
  isCarbonResultPayload,
  parseCapacityKwh,
  parseWeightKg,
} from "./carbon";

describe("parseCapacityKwh", () => {
  it("parses kWh", () => {
    expect(parseCapacityKwh("50 kWh")).toBe(50);
  });

  it("converts Ah using chemistry voltage", () => {
    // 100 Ah * 3.2 V / 1000 = 0.32 kWh for LFP
    expect(parseCapacityKwh("100 Ah", "LFP")).toBeCloseTo(0.32);
  });

  it("returns 0 for missing or invalid input (no silent default)", () => {
    expect(parseCapacityKwh("")).toBe(0);
    expect(parseCapacityKwh(undefined)).toBe(0);
    expect(parseCapacityKwh("abc")).toBe(0);
    expect(parseCapacityKwh("0 kWh")).toBe(0);
  });
});

describe("parseWeightKg", () => {
  it("parses kg and grams", () => {
    expect(parseWeightKg("25 kg")).toBe(25);
    expect(parseWeightKg("2500 g")).toBe(2.5);
  });

  it("returns 0 for missing input (no silent default)", () => {
    expect(parseWeightKg("")).toBe(0);
    expect(parseWeightKg(undefined)).toBe(0);
  });
});

describe("isCarbonResultCurrent", () => {
  const result = {
    total_kg_co2e: 12.5,
    carbon_class: "C",
  };

  it("accepts a matching calculator payload", () => {
    expect(
      isCarbonResultCurrent({
        carbonFootprintResult: result,
        carbonResultSpecKey: carbonSpecKey("LFP", "50 kWh", "25 kg"),
        chemistry: "LFP",
        capacity: "50 kWh",
        weight: "25 kg",
      }),
    ).toBe(true);
  });

  it("rejects free-text-only or stale specs", () => {
    expect(
      isCarbonResultCurrent({
        carbonFootprintResult: null,
        carbonResultSpecKey: "",
        chemistry: "LFP",
        capacity: "50 kWh",
        weight: "25 kg",
      }),
    ).toBe(false);
    expect(
      isCarbonResultCurrent({
        carbonFootprintResult: result,
        carbonResultSpecKey: carbonSpecKey("LFP", "50 kWh", "25 kg"),
        chemistry: "LFP",
        capacity: "60 kWh",
        weight: "25 kg",
      }),
    ).toBe(false);
  });

  it("rejects a payload missing total/class", () => {
    expect(isCarbonResultPayload({ foo: 1 })).toBe(false);
    expect(isCarbonResultPayload(result)).toBe(true);
  });
});
