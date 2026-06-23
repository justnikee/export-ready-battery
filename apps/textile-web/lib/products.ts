import {
  Activity,
  BookOpen,
  Box,
  Building2,
  CreditCard,
  Factory,
  FileDown,
  Globe,
  Home,
  Key,
  Layers3,
  LayoutTemplate,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProductSlug = "textile";
export type ProductType = "TEXTILE";

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

type DashboardWorkspaceCard = {
  title: string;
  description: string;
  ctaLabel: string;
  route: DashboardRouteKey;
};

type NavItem = {
  name: string;
  href?: string;
  dashboardSubpath?: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
};

type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
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
  banner?: DashboardBanner;
  workspaceCard?: DashboardWorkspaceCard;
  complianceCardTitle?: string;
  complianceCardSubtitle?: string;
  uploadComplianceLabel?: string;
};

export type ProductConfig = {
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
  navGroups: NavGroup[];
  pageTitles: Record<string, string>;
  onboarding: {
    steps: OnboardingStep[];
    completionTitle: string;
    completionDescription: string;
    backLabel: string;
    nextLabel: string;
    completeLabel: string;
    skipLabel: string;
  };
};

const TEXTILE_CONFIG: ProductConfig = {
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
        icon: Layers3,
        title: "Fiber-to-Garment Product Passports",
        description:
          "Track composition, care labels, and product journey end-to-end",
      },
      {
        icon: Globe,
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
  navGroups: [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", icon: Home },
        { name: "Analytics", dashboardSubpath: "analytics", icon: TrendingUp },
      ],
    },
    {
      label: "Production",
      items: [
        { name: "Lots", dashboardSubpath: "batches", icon: Box },
        { name: "Supply Chain", dashboardSubpath: "lifecycle", icon: Activity },
        { name: "Templates", dashboardSubpath: "templates", icon: LayoutTemplate },
      ],
    },
    {
      label: "Compliance",
      items: [
        { name: "Compliance", dashboardSubpath: "compliance", icon: Shield },
        { name: "Exports", dashboardSubpath: "exports", icon: FileDown },
      ],
    },
    {
      label: "Account",
      items: [
        { name: "Team", dashboardSubpath: "team", icon: Users },
        { name: "Partners", dashboardSubpath: "partners", icon: Building2 },
        { name: "Billing", dashboardSubpath: "billing", icon: CreditCard },
        { name: "Settings", dashboardSubpath: "settings", icon: Settings },
      ],
    },
    {
      label: "Developer",
      collapsible: true,
      items: [
        { name: "API Keys", dashboardSubpath: "developer", icon: Key },
        { name: "Docs", href: "/docs", icon: BookOpen },
      ],
    },
  ],
  pageTitles: {
    "": "Dashboard",
    passports: "Passports",
    tokens: "API Tokens",
    onboarding: "Onboarding",
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
    complianceCardTitle: "Chemical Compliance",
    complianceCardSubtitle: "ZDHC MRSL coverage",
    uploadComplianceLabel: "Upload Compliance Certificates",
  },
  onboarding: {
    steps: [
      {
        id: 1,
        title: "Organization Profile",
        description: "Basic company and workspace information",
        icon: Building2,
      },
      {
        id: 2,
        title: "Supply Chain Setup",
        description: "Define how your textile operation is structured",
        icon: Factory,
      },
      {
        id: 3,
        title: "Product Data Readiness",
        description: "Decide what traceability information you will publish first",
        icon: Layers3,
      },
      {
        id: 4,
        title: "Launch Workspace",
        description: "Review and activate your textile workspace",
        icon: Sparkles,
      },
    ],
    completionTitle: "Launch Workspace",
    completionDescription: "Your textile passport workspace is ready",
    backLabel: "Back",
    nextLabel: "Next",
    completeLabel: "Complete setup",
    skipLabel: "Skip for now",
  },
};

export function isProductSlug(value: string): value is ProductSlug {
  return value === "textile";
}

export function getProductConfig(_slug?: string): ProductConfig {
  return TEXTILE_CONFIG;
}

export function getProductConfigByType(
  _productType?: string | null,
): ProductConfig {
  return TEXTILE_CONFIG;
}

export function productSlugToType(_slug: ProductSlug): ProductType {
  return "TEXTILE";
}

export function productTypeToSlug(_productType?: string | null): ProductSlug {
  return "textile";
}

export function getPageTitles(config: ProductConfig): Record<string, string> {
  const titles: Record<string, string> = { ...config.pageTitles };
  for (const group of config.navGroups) {
    for (const item of group.items) {
      if (item.dashboardSubpath && !(item.dashboardSubpath in titles)) {
        titles[item.dashboardSubpath] = item.name;
      }
    }
  }
  return titles;
}
