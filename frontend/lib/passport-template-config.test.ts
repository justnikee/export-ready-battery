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

  it("returns textile config for TEXTILE_STANDARD variant", () => {
    const config = resolvePassportTemplateConfig({
      templateVariant: "TEXTILE_STANDARD",
      t: mockT,
    });
    expect(config.variant).toBe("TEXTILE_STANDARD");
    expect(config.family).toBe("textile");
    expect(config.showLotBadge).toBe(true);
    expect(config.showTextileProfile).toBe(true);
  });

  it("falls back to textile when productType is TEXTILE", () => {
    const config = resolvePassportTemplateConfig({
      productType: "TEXTILE",
      t: mockT,
    });
    expect(config.family).toBe("textile");
  });

  it("falls back to battery india when marketRegion is INDIA", () => {
    const config = resolvePassportTemplateConfig({
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("BATTERY_INDIA");
  });

  it("prefers explicit variant over productType/marketRegion", () => {
    const config = resolvePassportTemplateConfig({
      templateVariant: "TEXTILE_STANDARD",
      productType: "BATTERY",
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.family).toBe("textile");
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
