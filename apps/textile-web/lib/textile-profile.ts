export type TextilePrimaryMarket = "domestic" | "export" | "both";
export type TextileFacilityType =
  | "mill"
  | "manufacturer"
  | "brand"
  | "integrated";
export type TextileSupplyChainTier = "tier_1" | "tier_2" | "multi_tier";
export type TextileFiberType = "natural" | "synthetic" | "blended" | "mixed";
export type TextilePublishScope = "internal" | "partner" | "public";
export type TextileProductionStage =
  | "fiber"
  | "fabric"
  | "dyeing"
  | "cut_sew"
  | "finished_goods";

export const TEXTILE_PRIMARY_MARKET_OPTIONS = [
  { value: "domestic", label: "Domestic market" },
  { value: "export", label: "Export market" },
  { value: "both", label: "Domestic + export" },
] as const;

export const TEXTILE_FACILITY_TYPE_OPTIONS = [
  { value: "mill", label: "Mill / processor" },
  { value: "manufacturer", label: "Garment manufacturer" },
  { value: "brand", label: "Brand / aggregator" },
  { value: "integrated", label: "Integrated operation" },
] as const;

export const TEXTILE_SUPPLY_CHAIN_TIER_OPTIONS = [
  { value: "tier_1", label: "Tier 1 only" },
  { value: "tier_2", label: "Tier 2 focus" },
  { value: "multi_tier", label: "Multi-tier supply chain" },
] as const;

export const TEXTILE_FIBER_TYPE_OPTIONS = [
  { value: "natural", label: "Natural fibers" },
  { value: "synthetic", label: "Synthetic fibers" },
  { value: "blended", label: "Blended materials" },
  { value: "mixed", label: "Mixed portfolio" },
] as const;

export const TEXTILE_CERTIFICATION_OPTIONS = [
  { value: "GOTS", label: "GOTS" },
  { value: "GRS", label: "Global Recycled Standard" },
  { value: "OEKO_TEX", label: "OEKO-TEX" },
  { value: "BSCI", label: "BSCI / social audit" },
] as const;

export const TEXTILE_PRODUCTION_STAGE_OPTIONS = [
  { value: "fiber", label: "Fiber preparation" },
  { value: "fabric", label: "Fabric formation" },
  { value: "dyeing", label: "Dyeing / finishing" },
  { value: "cut_sew", label: "Cut and sew" },
  { value: "finished_goods", label: "Finished goods" },
] as const;

export function textileStageLabel(stage?: string | null) {
  return (
    TEXTILE_PRODUCTION_STAGE_OPTIONS.find((option) => option.value === stage)
      ?.label || "Not set"
  );
}

export function mapPrimaryMarketToList(value: TextilePrimaryMarket): string[] {
  switch (value) {
    case "domestic":
      return ["domestic"];
    case "export":
      return ["export"];
    default:
      return ["domestic", "export"];
  }
}

export function mapPrimaryMarketsToSelection(
  markets?: string[] | null,
): TextilePrimaryMarket {
  const normalized = new Set(
    (markets || []).map((market) => market.toLowerCase()),
  );

  if (normalized.has("domestic") && normalized.has("export")) {
    return "both";
  }
  if (normalized.has("export")) {
    return "export";
  }
  if (normalized.has("domestic")) {
    return "domestic";
  }
  return "both";
}

export function normalizeTextileArray(value?: string[] | null): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
