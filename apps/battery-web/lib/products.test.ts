import { describe, it, expect } from "vitest";
import {
  isProductSlug,
  getProductConfig,
  productSlugToType,
  productTypeToSlug,
  getPageTitles,
} from "./products";

describe("isProductSlug", () => {
  it("returns true for battery", () => {
    expect(isProductSlug("battery")).toBe(true);
  });

  it("returns false for invalid slugs", () => {
    expect(isProductSlug("textile")).toBe(false);
    expect(isProductSlug("unknown")).toBe(false);
  });
});

describe("getProductConfig", () => {
  it("returns battery config", () => {
    const config = getProductConfig("battery");
    expect(config).not.toBeNull();
    expect(config?.slug).toBe("battery");
    expect(config?.type).toBe("BATTERY");
  });
});

describe("productSlugToType", () => {
  it("converts battery to BATTERY", () => {
    expect(productSlugToType("battery")).toBe("BATTERY");
  });
});

describe("productTypeToSlug", () => {
  it("defaults to battery for anything else", () => {
    expect(productTypeToSlug("BATTERY")).toBe("battery");
    expect(productTypeToSlug("UNKNOWN")).toBe("battery");
    expect(productTypeToSlug(null)).toBe("battery");
  });
});

describe("getPageTitles", () => {
  it("includes nav group subpaths", () => {
    const config = getProductConfig("battery");
    const titles = getPageTitles(config);
    expect(titles["batches"]).toBe("Batches");
    expect(titles["compliance"]).toBe("India Compliance");
  });
});
