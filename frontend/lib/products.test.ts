import { describe, it, expect } from "vitest";
import {
  isProductSlug,
  getProductConfig,
  getProductConfigByType,
  productSlugToType,
  productTypeToSlug,
} from "./products";

describe("isProductSlug", () => {
  it("returns true for battery", () => {
    expect(isProductSlug("battery")).toBe(true);
  });

  it("returns true for textile", () => {
    expect(isProductSlug("textile")).toBe(true);
  });

  it("returns false for unknown values", () => {
    expect(isProductSlug("electronics")).toBe(false);
    expect(isProductSlug("")).toBe(false);
  });
});

describe("getProductConfig", () => {
  it("returns battery config", () => {
    const config = getProductConfig("battery");
    expect(config).not.toBeNull();
    expect(config?.slug).toBe("battery");
    expect(config?.type).toBe("BATTERY");
    expect(config?.label).toBe("Battery Passport");
  });

  it("returns textile config", () => {
    const config = getProductConfig("textile");
    expect(config).not.toBeNull();
    expect(config?.slug).toBe("textile");
    expect(config?.type).toBe("TEXTILE");
  });

  it("returns null for invalid slug", () => {
    expect(getProductConfig("unknown")).toBeNull();
  });
});

describe("getProductConfigByType", () => {
  it("returns battery config for BATTERY", () => {
    expect(getProductConfigByType("BATTERY").slug).toBe("battery");
  });

  it("returns textile config for TEXTILE", () => {
    expect(getProductConfigByType("TEXTILE").slug).toBe("textile");
  });

  it("defaults to battery for null/undefined/unknown", () => {
    expect(getProductConfigByType(null).slug).toBe("battery");
    expect(getProductConfigByType(undefined).slug).toBe("battery");
    expect(getProductConfigByType("UNKNOWN").slug).toBe("battery");
  });
});

describe("productSlugToType", () => {
  it("converts battery to BATTERY", () => {
    expect(productSlugToType("battery")).toBe("BATTERY");
  });

  it("converts textile to TEXTILE", () => {
    expect(productSlugToType("textile")).toBe("TEXTILE");
  });
});

describe("productTypeToSlug", () => {
  it("converts TEXTILE to textile", () => {
    expect(productTypeToSlug("TEXTILE")).toBe("textile");
  });

  it("defaults to battery for anything else", () => {
    expect(productTypeToSlug("BATTERY")).toBe("battery");
    expect(productTypeToSlug("UNKNOWN")).toBe("battery");
    expect(productTypeToSlug(null)).toBe("battery");
    expect(productTypeToSlug(undefined)).toBe("battery");
  });
});
