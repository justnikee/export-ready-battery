import { describe, it, expect } from "vitest";
import {
  isProductSlug,
  getProductConfig,
  productSlugToType,
  productTypeToSlug,
  getPageTitles,
} from "./products";

describe("isProductSlug", () => {
  it("returns true for textile", () => {
    expect(isProductSlug("textile")).toBe(true);
  });

  it("returns false for invalid slugs", () => {
    expect(isProductSlug("battery")).toBe(false);
    expect(isProductSlug("unknown")).toBe(false);
  });
});

describe("getProductConfig", () => {
  it("returns textile config", () => {
    const config = getProductConfig("textile");
    expect(config).not.toBeNull();
    expect(config?.slug).toBe("textile");
    expect(config?.type).toBe("TEXTILE");
  });
});

describe("productSlugToType", () => {
  it("converts textile to TEXTILE", () => {
    expect(productSlugToType("textile")).toBe("TEXTILE");
  });
});

describe("productTypeToSlug", () => {
  it("defaults to textile for anything else", () => {
    expect(productTypeToSlug("TEXTILE")).toBe("textile");
    expect(productTypeToSlug("UNKNOWN")).toBe("textile");
    expect(productTypeToSlug(null)).toBe("textile");
  });
});

describe("getPageTitles", () => {
  it("includes nav group subpaths", () => {
    const config = getProductConfig("textile");
    const titles = getPageTitles(config);
    expect(titles["batches"]).toBe("Lots");
    expect(titles["compliance"]).toBe("Compliance");
  });
});
