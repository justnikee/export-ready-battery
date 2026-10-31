import { describe, it, expect } from "vitest";
import {
  PASSPORT_FEB_2027_CAPTION,
  PASSPORT_NOT_IN_FORCE,
  PASSPORT_RESTRICTED_LINE,
  isPublicAccessTier,
  notInForceDisplay,
} from "./passport-honesty";

describe("notInForceDisplay", () => {
  it("does not treat a missing carbon class as a fail", () => {
    expect(notInForceDisplay(undefined)).toEqual({
      display: PASSPORT_NOT_IN_FORCE,
      present: false,
    });
    expect(notInForceDisplay("")).toEqual({
      display: PASSPORT_NOT_IN_FORCE,
      present: false,
    });
  });

  it("keeps a declared class as text, not an Article 7 label", () => {
    expect(notInForceDisplay("B")).toEqual({ display: "B", present: true });
  });
});

describe("isPublicAccessTier", () => {
  it("treats missing and PUBLIC as the QR-scan tier", () => {
    expect(isPublicAccessTier(undefined)).toBe(true);
    expect(isPublicAccessTier("PUBLIC")).toBe(true);
    expect(isPublicAccessTier("PARTNER")).toBe(false);
    expect(isPublicAccessTier("REGULATOR")).toBe(false);
  });
});

describe("honesty copy", () => {
  it("uses the locked February 2027 caption", () => {
    expect(PASSPORT_FEB_2027_CAPTION).toContain("February 2027");
    expect(PASSPORT_FEB_2027_CAPTION).toContain("Commission guidance");
  });

  it("keeps repair/dismantling off the public page in one line", () => {
    expect(PASSPORT_RESTRICTED_LINE).toContain("Repair/dismantling");
  });
});
