// Public-scan honesty (Wave 3) lives in certificate-view + lib/passport-honesty.ts.
// This config only toggles which battery clusters to show; it must not add
// textile blocks or present carbon class as an Article 7 legal label.

export type PassportTemplateFamily = "battery";

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
  showIndiaRecycling: boolean;
  complianceMode: "battery_india" | "battery_standard";
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

export function resolvePassportTemplateConfig({
  templateVariant,
  productType,
  marketRegion,
  t,
}: ResolvePassportTemplateConfigArgs): PassportTemplateConfig {
  const normalizedVariant = templateVariant?.trim().toUpperCase();
  if (normalizedVariant === "BATTERY_INDIA") {
    return BATTERY_INDIA_CONFIG(t);
  }
  if (normalizedVariant === "BATTERY_STANDARD") {
    return BATTERY_STANDARD_CONFIG(t);
  }

  if (marketRegion?.trim().toUpperCase() === "INDIA") {
    return BATTERY_INDIA_CONFIG(t);
  }
  return BATTERY_STANDARD_CONFIG(t);
}
