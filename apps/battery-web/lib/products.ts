import {
  Activity,
  BookOpen,
  Box,
  Building2,
  Calculator,
  ClipboardCheck,
  CreditCard,
  FileDown,
  Globe,
  HeartPulse,
  Home,
  Key,
  Landmark,
  LayoutTemplate,
  Newspaper,
  Radio,
  Scale,
  Send,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Feature } from "@/lib/entitlements";

export type ProductSlug = "battery";
export type ProductType = "BATTERY";

type AuthFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type DashboardRouteKey =
  | "analytics"
  | "batches"
  | "billing"
  | "compliance"
  | "developer"
  | "dgft-claims"
  | "dispatch"
  | "due-diligence"
  | "exports"
  | "fleet"
  | "lifecycle"
  | "mass-balance"
  | "partners"
  | "settings"
  | "team"
  | "templates";

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
  pendingText: string;
  ctaLabel: string;
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
  /** If set, this nav item requires the given plan-gated feature. */
  feature?: Feature;
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
  compliance?: DashboardCompliance;
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

const BATTERY_CONFIG: ProductConfig = {
  slug: "battery",
  type: "BATTERY",
  label: "Battery Passport",
  auth: {
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to manage your battery passports and compliance",
    registerTitle: "Get started with Anviora",
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
        { name: "Batches", dashboardSubpath: "batches", icon: Box },
        { name: "Dispatch", dashboardSubpath: "dispatch", icon: Send },
        { name: "Lifecycle", dashboardSubpath: "lifecycle", icon: Activity },
        { name: "Templates", dashboardSubpath: "templates", icon: LayoutTemplate },
        { name: "Fleet Health", dashboardSubpath: "fleet", icon: HeartPulse, feature: "fleet" },
        { name: "BMS Telemetry", dashboardSubpath: "telemetry", icon: Radio, feature: "telemetry" },
      ],
    },
    {
      label: "Compliance",
      items: [
        { name: "India Compliance", dashboardSubpath: "compliance", icon: Shield },
        { name: "EU Compliance", dashboardSubpath: "eu-compliance", icon: Globe, feature: "eu_compliance" },
        { name: "Carbon Calculator", dashboardSubpath: "carbon-calculator", icon: Calculator },
        { name: "Mass Balance", dashboardSubpath: "mass-balance", icon: Scale, feature: "mass_balance" },
        { name: "DGFT Claims", dashboardSubpath: "dgft-claims", icon: Landmark, feature: "dgft_claims" },
      ],
    },
    {
      label: "Supply Chain",
      items: [
        { name: "Suppliers & DD", dashboardSubpath: "due-diligence", icon: ClipboardCheck, feature: "due_diligence" },
        { name: "Regulatory", dashboardSubpath: "regulatory", icon: Newspaper, feature: "regulatory" },
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
        { name: "API Keys", dashboardSubpath: "developer", icon: Key, feature: "developer" },
        { name: "Webhooks", dashboardSubpath: "developer#webhooks", icon: Webhook, feature: "developer" },
        { name: "Downloads", dashboardSubpath: "exports", icon: FileDown },
        { name: "Docs", href: "/docs", icon: BookOpen },
      ],
    },
    {
      label: "Admin",
      collapsible: true,
      items: [
        { name: "Admin Panel", dashboardSubpath: "admin", icon: Shield },
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
        icon: HeartPulse,
        title: "Fleet Health",
        description: "SoH and lifecycle status across your fleet",
        route: "fleet",
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
        icon: Landmark,
        title: "DGFT Claims",
        description: "Track export incentive claims",
        route: "dgft-claims",
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
      pendingText: "Documents submitted — awaiting verification",
      ctaLabel: "Complete your compliance setup",
    },
  },
  onboarding: {
    steps: [
      {
        id: 1,
        title: "Company Profile",
        description: "Basic information about your organization",
        icon: Building2,
      },
      {
        id: 2,
        title: "Target Markets",
        description: "Where will you sell batteries?",
        icon: Target,
      },
      {
        id: 3,
        title: "Compliance Setup",
        description: "Regulatory credentials (optional)",
        icon: Shield,
      },
      {
        id: 4,
        title: "All Set!",
        description: "Review and complete setup",
        icon: Sparkles,
      },
    ],
    completionTitle: "All Set!",
    completionDescription: "Your battery passport workspace is ready",
    backLabel: "Back",
    nextLabel: "Next",
    completeLabel: "Complete setup",
    skipLabel: "Skip for now",
  },
};

export function isProductSlug(value: string): value is ProductSlug {
  return value === "battery";
}

export function getProductConfig(_slug?: string): ProductConfig {
  return BATTERY_CONFIG;
}

export function getProductConfigByType(
  _productType?: string | null,
): ProductConfig {
  return BATTERY_CONFIG;
}

export function productSlugToType(_slug: ProductSlug): ProductType {
  return "BATTERY";
}

export function productTypeToSlug(_productType?: string | null): ProductSlug {
  return "battery";
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
