export type PassportTemplateFamily = "battery" | "textile";

export interface PassportTemplateConfig {
  variant: string;
  family: PassportTemplateFamily;
  badge: string;
  showCapacityBadge: boolean;
  showLotBadge: boolean;
  showDocuments: boolean;
  showImportDetails: boolean;
  showCrm: boolean;
  showSoh: boolean;
  showTextileProfile: boolean;
  showTextileCompliance: boolean;
  showIndiaRecycling: boolean;
  complianceMode: "battery_india" | "battery_standard" | "textile_standard";
  safetyTitle: string;
  safetyBody: string;
  circularityTitle: string;
  circularityBody: string;
}

type TranslatorFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

type ResolvePassportTemplateConfigArgs = {
  templateVariant?: string | null;
  productType?: string | null;
  marketRegion?: string | null;
  t: TranslatorFn;
};

const BATTERY_STANDARD_CONFIG = (t: TranslatorFn): PassportTemplateConfig => ({
  variant: "BATTERY_STANDARD",
  family: "battery",
  badge: "🔋",
  showCapacityBadge: true,
  showLotBadge: false,
  showDocuments: true,
  showImportDetails: false,
  showCrm: true,
  showSoh: true,
  showTextileProfile: false,
  showTextileCompliance: false,
  showIndiaRecycling: false,
  complianceMode: "battery_standard",
  safetyTitle: t("safety_title"),
  safetyBody: t("safety_text"),
  circularityTitle: t("recycling_title"),
  circularityBody: t("recycling_text_global"),
});

const BATTERY_INDIA_CONFIG = (t: TranslatorFn): PassportTemplateConfig => ({
  ...BATTERY_STANDARD_CONFIG(t),
  variant: "BATTERY_INDIA",
  showImportDetails: true,
  showCrm: false,
  showIndiaRecycling: true,
  complianceMode: "battery_india",
  circularityBody: t("recycling_text_india"),
});

const TEXTILE_STANDARD_CONFIG: PassportTemplateConfig = {
  variant: "TEXTILE_STANDARD",
  family: "textile",
  badge: "🧵",
  showCapacityBadge: false,
  showLotBadge: true,
  showDocuments: false,
  showImportDetails: false,
  showCrm: false,
  showSoh: false,
  showTextileProfile: true,
  showTextileCompliance: true,
  showIndiaRecycling: false,
  complianceMode: "textile_standard",
  safetyTitle: "Care Guidance",
  safetyBody:
    "Follow care, washing, and handling instructions from the manufacturer before resale, repair, or recycling.",
  circularityTitle: "Circularity",
  circularityBody:
    "Prefer repair, reuse, fiber recovery, and certified textile recycling channels where available.",
};

export function resolvePassportTemplateConfig({
  templateVariant,
  productType,
  marketRegion,
  t,
}: ResolvePassportTemplateConfigArgs): PassportTemplateConfig {
  const normalizedVariant = templateVariant?.trim().toUpperCase();
  if (normalizedVariant === "TEXTILE_STANDARD") {
    return TEXTILE_STANDARD_CONFIG;
  }
  if (normalizedVariant === "BATTERY_INDIA") {
    return BATTERY_INDIA_CONFIG(t);
  }
  if (normalizedVariant === "BATTERY_STANDARD") {
    return BATTERY_STANDARD_CONFIG(t);
  }

  if (productType?.trim().toUpperCase() === "TEXTILE") {
    return TEXTILE_STANDARD_CONFIG;
  }
  if (marketRegion?.trim().toUpperCase() === "INDIA") {
    return BATTERY_INDIA_CONFIG(t);
  }
  return BATTERY_STANDARD_CONFIG(t);
}
