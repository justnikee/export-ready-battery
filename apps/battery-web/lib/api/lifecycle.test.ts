import { describe, it, expect } from "vitest";
import { parseSoHPercent } from "./lifecycle";

describe("parseSoHPercent", () => {
  it("accepts 0, 100, and one decimal", () => {
    expect(parseSoHPercent("0")).toBe(0);
    expect(parseSoHPercent("100")).toBe(100);
    expect(parseSoHPercent("92.5")).toBe(92.5);
  });

  it("rejects empty, NaN, and out of range", () => {
    expect(parseSoHPercent("")).toBeNull();
    expect(parseSoHPercent("abc")).toBeNull();
    expect(parseSoHPercent("-1")).toBeNull();
    expect(parseSoHPercent("100.1")).toBeNull();
  });
});
