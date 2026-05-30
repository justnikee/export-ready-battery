import { describe, it, expect, vi } from "vitest";
import { resolvePassportTemplateConfig } from "./passport-template-config";

const mockT = vi.fn((key: string) => key);

describe("resolvePassportTemplateConfig", () => {
  it("returns battery standard config by default", () => {
    const config = resolvePassportTemplateConfig({ t: mockT });
    expect(config.variant).toBe("BATTERY_STANDARD");
    expect(config.family).toBe("battery");
    expect(config.showCapacityBadge).toBe(true);
    expect(config.showIndiaRecycling).toBe(false);
  });

  it("returns battery india config for BATTERY_INDIA variant", () => {
    const config = resolvePassportTemplateConfig({
      templateVariant: "BATTERY_INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("BATTERY_INDIA");
    expect(config.showImportDetails).toBe(true);
    expect(config.showIndiaRecycling).toBe(true);
    expect(config.complianceMode).toBe("battery_india");
  });

  it("falls back to battery india when marketRegion is INDIA", () => {
    const config = resolvePassportTemplateConfig({
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("BATTERY_INDIA");
    expect(config.family).toBe("battery");
  });

  it("falls back to battery standard for unknown productType", () => {
    const config = resolvePassportTemplateConfig({
      productType: "TEXTILE",
      t: mockT,
    });
    expect(config.variant).toBe("BATTERY_STANDARD");
    expect(config.family).toBe("battery");
  });

  it("prefers explicit variant over marketRegion", () => {
    const config = resolvePassportTemplateConfig({
      templateVariant: "BATTERY_STANDARD",
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("BATTERY_STANDARD");
    expect(config.family).toBe("battery");
  });

  it("calls translator for battery standard safety and circularity text", () => {
    resolvePassportTemplateConfig({
      templateVariant: "BATTERY_STANDARD",
      t: mockT,
    });
    expect(mockT).toHaveBeenCalledWith("safety_title");
    expect(mockT).toHaveBeenCalledWith("recycling_title");
    expect(mockT).toHaveBeenCalledWith("recycling_text_global");
  });

  it("calls translator for india-specific recycling text", () => {
    resolvePassportTemplateConfig({
      templateVariant: "BATTERY_INDIA",
      t: mockT,
    });
    expect(mockT).toHaveBeenCalledWith("recycling_text_india");
  });
});
