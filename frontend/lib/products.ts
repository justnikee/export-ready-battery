import {
  FileDown,
  Globe,
  Layers3,
  Settings,
  Shield,
  Shirt,
  Sparkles,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProductSlug = "battery" | "textile";
export type ProductType = "BATTERY" | "TEXTILE";

type AuthFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type DashboardRouteKey =
  | "batches"
  | "billing"
  | "compliance"
  | "settings"
  | "team";

type DashboardActionTone = "emerald" | "blue" | "amber" | "indigo";

type DashboardQuickAction = {
  icon: LucideIcon;
  title: string;
  description: string;
  route: DashboardRouteKey;
  tone: DashboardActionTone;
};

type DashboardBanner = {
  title: string;
  description: string;
  ctaLabel: string;
  route: DashboardRouteKey;
};

type DashboardCompliance = {
  title: string;
  items: Array<{
    label: string;
    statusField: "epr_status" | "bis_status" | "pli_status";
  }>;
  verifiedText: string;
  ctaLabel: string;
};

type DashboardWorkspaceCard = {
  title: string;
  description: string;
  ctaLabel: string;
  route: DashboardRouteKey;
};

type DashboardConfig = {
  subtitle: string;
  primaryActionLabel: string;
  totalEntitiesLabel: string;
  activeCollectionsLabel: string;
  activeCollectionsDescription: string;
  quotaLabel: string;
  trendTitle: string;
  trendSubtitle: string;
  recentCollectionsLabel: string;
  recentEmptyState: string;
  collectionSingularLabel: string;
  quickActions: DashboardQuickAction[];
  compliance?: DashboardCompliance;
  banner?: DashboardBanner;
  workspaceCard?: DashboardWorkspaceCard;
};

type ProductConfig = {
  slug: ProductSlug;
  type: ProductType;
  label: string;
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    inviteSubtitle: string;
    heroTitle: string;
    heroHighlight: string;
    footerTagline: string;
    features: AuthFeature[];
  };
  dashboard: DashboardConfig;
};

const PRODUCT_CONFIGS: Record<ProductSlug, ProductConfig> = {
  battery: {
    slug: "battery",
    type: "BATTERY",
    label: "Battery Passport",
    auth: {
      loginTitle: "Welcome back",
      loginSubtitle: "Sign in to manage your battery passports and compliance",
      registerTitle: "Get started with AnvayaLabs",
      registerSubtitle:
        "Set up your battery passport workspace in under 2 minutes",
      inviteSubtitle:
        "Create your password to join your battery passport workspace",
      heroTitle: "Compliance Infrastructure",
      heroHighlight: "for Battery Manufacturers",
      footerTagline:
        "Powering compliance for battery manufacturers across India & Europe",
      features: [
        {
          icon: Shield,
          title: "India (PLI/EPR) & EU Regulation Ready",
          description: "Full compliance with 2026 Draft Rules & EU 2027",
        },
        {
          icon: Globe,
          title: "Secure Traceability from Cell to Pack",
          description: "End-to-end battery passport tracking",
        },
        {
          icon: Zap,
          title: "Industrial-Scale Label Generation",
          description: "Generate thousands of QR labels in seconds",
        },
      ],
    },
    dashboard: {
      subtitle: "Overview of your battery passport operations",
      primaryActionLabel: "Create Batch",
      totalEntitiesLabel: "Total Passports",
      activeCollectionsLabel: "Active Batches",
      activeCollectionsDescription: "Currently Processing",
      quotaLabel: "Passport Quota",
      trendTitle: "Production Overview",
      trendSubtitle: "Passport generation over time",
      recentCollectionsLabel: "Recent Batches",
      recentEmptyState: "No batches yet",
      collectionSingularLabel: "Batch",
      quickActions: [
        {
          icon: Zap,
          title: "Create Batch",
          description: "Start a new production batch",
          route: "batches",
          tone: "emerald",
        },
        {
          icon: Upload,
          title: "Upload CSV",
          description: "Bulk import serial numbers",
          route: "batches",
          tone: "blue",
        },
        {
          icon: Shield,
          title: "View Compliance",
          description: "EPR obligations and certificates",
          route: "compliance",
          tone: "amber",
        },
        {
          icon: FileDown,
          title: "CPCB Report",
          description: "Generate CPCB Form 3 export",
          route: "compliance",
          tone: "indigo",
        },
      ],
      compliance: {
        title: "India Compliance",
        items: [
          { label: "EPR", statusField: "epr_status" },
          { label: "BIS", statusField: "bis_status" },
          { label: "PLI", statusField: "pli_status" },
        ],
        verifiedText: "All India compliance documents verified",
        ctaLabel: "Complete your compliance setup",
      },
    },
  },
  textile: {
    slug: "textile",
    type: "TEXTILE",
    label: "Textile Passport",
    auth: {
      loginTitle: "Welcome back",
      loginSubtitle:
        "Sign in to manage your textile passports and supply chain compliance",
      registerTitle: "Start your textile passport workspace",
      registerSubtitle:
        "Set up your textile compliance workspace with product-specific onboarding",
      inviteSubtitle:
        "Create your password to join your textile passport workspace",
      heroTitle: "Traceability Infrastructure",
      heroHighlight: "for Textile Supply Chains",
      footerTagline:
        "Powering traceability and compliance for mills, brands, and garment makers",
      features: [
        {
          icon: Shirt,
          title: "Fiber-to-Garment Product Passports",
          description:
            "Track composition, care labels, and product journey end-to-end",
        },
        {
          icon: Layers3,
          title: "Supply Chain Visibility Across Tiers",
          description:
            "Map mills, dye houses, garment makers, and recyclers in one flow",
        },
        {
          icon: Sparkles,
          title: "Textile Compliance Ready",
          description:
            "Prepare for ESPR, DPP, and chemical disclosure requirements",
        },
      ],
    },
    dashboard: {
      subtitle: "Overview of your textile traceability operations",
      primaryActionLabel: "Create Production Lot",
      totalEntitiesLabel: "Total Records",
      activeCollectionsLabel: "Active Lots",
      activeCollectionsDescription: "Currently in workflow",
      quotaLabel: "Record Quota",
      trendTitle: "Traceability Activity",
      trendSubtitle: "Record creation over time",
      recentCollectionsLabel: "Recent Lots",
      recentEmptyState: "No production lots yet",
      collectionSingularLabel: "Lot",
      quickActions: [
        {
          icon: Layers3,
          title: "Create Production Lot",
          description: "Start a new textile production lot",
          route: "batches",
          tone: "emerald",
        },
        {
          icon: Upload,
          title: "Upload Catalog",
          description: "Import SKUs or serialized items in bulk",
          route: "batches",
          tone: "blue",
        },
        {
          icon: Users,
          title: "Team & Access",
          description: "Invite mills, brands, and operators",
          route: "team",
          tone: "amber",
        },
        {
          icon: Settings,
          title: "Workspace Settings",
          description: "Configure company profile and workflow defaults",
          route: "settings",
          tone: "indigo",
        },
      ],
      banner: {
        title: "Textile workspace is active",
        description:
          "Use production lots, teams, and workspace settings while textile-specific compliance modules land.",
        ctaLabel: "Open Workspace Settings",
        route: "settings",
      },
      workspaceCard: {
        title: "Workspace Setup",
        description:
          "Align your team structure and workspace defaults for textile workflows.",
        ctaLabel: "Review Settings",
        route: "settings",
      },
    },
  },
};

export function isProductSlug(value: string): value is ProductSlug {
  return value === "battery" || value === "textile";
}

export function getProductConfig(slug: string): ProductConfig | null {
  if (!isProductSlug(slug)) {
    return null;
  }

  return PRODUCT_CONFIGS[slug];
}

export function getProductConfigByType(
  productType?: string | null,
): ProductConfig {
  return PRODUCT_CONFIGS[productTypeToSlug(productType)];
}

export function productSlugToType(slug: ProductSlug): ProductType {
  return PRODUCT_CONFIGS[slug].type;
}

export function productTypeToSlug(productType?: string | null): ProductSlug {
  return productType === "TEXTILE" ? "textile" : "battery";
}
