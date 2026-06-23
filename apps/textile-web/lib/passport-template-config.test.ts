import { describe, it, expect, vi } from "vitest";
import { resolvePassportTemplateConfig } from "./passport-template-config";

const mockT = vi.fn((key: string) => key);

describe("resolvePassportTemplateConfig", () => {
  it("returns textile standard config by default", () => {
    const config = resolvePassportTemplateConfig({ t: mockT });
    expect(config.variant).toBe("TEXTILE_STANDARD");
    expect(config.family).toBe("textile");
    expect(config.showLotBadge).toBe(true);
    expect(config.showIndiaRecycling).toBe(false);
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

  it("returns textile india config for TEXTILE_INDIA variant", () => {
    const config = resolvePassportTemplateConfig({
      templateVariant: "TEXTILE_INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("TEXTILE_INDIA");
    expect(config.family).toBe("textile");
    expect(config.showLotBadge).toBe(true);
    expect(config.showDocuments).toBe(true);
    expect(config.showIndiaRecycling).toBe(true);
    expect(config.complianceMode).toBe("textile_india");
  });

  it("falls back to textile standard when productType is TEXTILE and no market", () => {
    const config = resolvePassportTemplateConfig({
      productType: "TEXTILE",
      t: mockT,
    });
    expect(config.family).toBe("textile");
    expect(config.variant).toBe("TEXTILE_STANDARD");
  });

  it("falls back to textile india when productType is TEXTILE and marketRegion is INDIA", () => {
    const config = resolvePassportTemplateConfig({
      productType: "TEXTILE",
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("TEXTILE_INDIA");
    expect(config.family).toBe("textile");
  });

  it("falls back to textile india when marketRegion is INDIA and productType unknown", () => {
    const config = resolvePassportTemplateConfig({
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.variant).toBe("TEXTILE_INDIA");
    expect(config.family).toBe("textile");
  });

  it("prefers explicit variant over productType/marketRegion", () => {
    const config = resolvePassportTemplateConfig({
      templateVariant: "TEXTILE_STANDARD",
      productType: "BATTERY",
      marketRegion: "INDIA",
      t: mockT,
    });
    expect(config.family).toBe("textile");
    expect(config.variant).toBe("TEXTILE_STANDARD");
  });
});
