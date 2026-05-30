export type PassportTemplateFamily = "textile";

export interface PassportTemplateConfig {
  variant: string;
  family: PassportTemplateFamily;
  badge: string;
  showLotBadge: boolean;
  showDocuments: boolean;
  showImportDetails: boolean;
  showTextileProfile: boolean;
  showTextileCompliance: boolean;
  showIndiaRecycling: boolean;
  complianceMode:
    | "textile_standard"
    | "textile_india"
    | "textile_organic"
    | "textile_recycled";
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

const TEXTILE_STANDARD_CONFIG: PassportTemplateConfig = {
  variant: "TEXTILE_STANDARD",
  family: "textile",
  badge: "🧵",
  showLotBadge: true,
  showDocuments: false,
  showImportDetails: false,
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

const TEXTILE_INDIA_CONFIG: PassportTemplateConfig = {
  ...TEXTILE_STANDARD_CONFIG,
  variant: "TEXTILE_INDIA",
  showDocuments: true,
  showIndiaRecycling: true,
  complianceMode: "textile_india",
  safetyTitle: "Care & QCO Guidance",
  safetyBody:
    "Follow care instructions. This product complies with India QCO (Quality Control Order) textile standards where applicable.",
  circularityTitle: "Sustainability & Recycling",
  circularityBody:
    "India: Prefer repair, reuse, and fiber recovery through RRR (Reduce, Reuse, Recycle) centers. Check for local textile recycling programs.",
};

const TEXTILE_ORGANIC_CONFIG: PassportTemplateConfig = {
  ...TEXTILE_STANDARD_CONFIG,
  variant: "TEXTILE_ORGANIC",
  badge: "🌿",
  complianceMode: "textile_organic",
  safetyTitle: "Organic Care Guidance",
  safetyBody:
    "Certified organic textile. Follow gentle care instructions to preserve fiber integrity and certification validity.",
  circularityTitle: "Organic Circularity",
  circularityBody:
    "Prefer organic fiber recycling, composting for natural fibers, and certified organic textile recovery channels.",
};

const TEXTILE_RECYCLED_CONFIG: PassportTemplateConfig = {
  ...TEXTILE_STANDARD_CONFIG,
  variant: "TEXTILE_RECYCLED",
  badge: "♻️",
  complianceMode: "textile_recycled",
  safetyTitle: "Recycled Material Care",
  safetyBody:
    "Contains recycled fibers. Follow care instructions to maximize durability and support circular material flows.",
  circularityTitle: "Recycled Circularity",
  circularityBody:
    "At end of life, return to GRS-certified recycling streams or fiber recovery programs to close the material loop.",
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
  if (normalizedVariant === "TEXTILE_INDIA") {
    return TEXTILE_INDIA_CONFIG;
  }
  if (normalizedVariant === "TEXTILE_ORGANIC") {
    return TEXTILE_ORGANIC_CONFIG;
  }
  if (normalizedVariant === "TEXTILE_RECYCLED") {
    return TEXTILE_RECYCLED_CONFIG;
  }
  if (marketRegion?.trim().toUpperCase() === "INDIA") {
    return TEXTILE_INDIA_CONFIG;
  }
  return TEXTILE_STANDARD_CONFIG;
}
