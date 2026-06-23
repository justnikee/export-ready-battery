"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import {
  Zap,
  AlertCircle,
  QrCode,
  FolderPlus,
  MoreHorizontal,
  ArrowRight,
  Trash2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BatchChartData } from "@/lib/types";
import { dashboardPathFromPathname } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ComplianceScoreCard } from "@/components/dashboard/ComplianceScoreCard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getProductConfigByType } from "@/lib/products";

const ProductionChart = dynamic(
  () =>
    import("@/components/dashboard/ProductionChart").then(
      (mod) => mod.ProductionChart,
    ),
  { ssr: false },
);
const BatchStatusChart = dynamic(
  () =>
    import("@/components/dashboard/BatchStatusChart").then(
      (mod) => mod.BatchStatusChart,
    ),
  { ssr: false },
);
const ScanMap = dynamic(
  () => import("@/components/dashboard/ScanMap").then((mod) => mod.ScanMap),
  { ssr: false },
);

interface DashboardStats {
  total_passports: number;
  total_batches: number;
  quota_used: number;
  quota_limit: number;
  quota_balance: number;
  passports_this_week: number;
  batches_by_status?: Record<string, number>;
}

interface ScanFeedItem {
  id?: string;
  batch_name?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  scanned_at: string;
}

interface ScanLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  scanned_at: string;
}

interface ActivityItem {
  id: string;
  type: "SCAN" | "BATCH";
  title: string;
  location: string;
  time: string;
}

interface ChartPoint {
  name: string;
  value: number;
}

interface RecentBatch {
  id: string;
  name: string;
  units: number;
  status: string;
  market_region?: string;
  created_at: string;
}

interface BatchesChartDataResponse {
  batches?: BatchChartData[];
}

interface RecentBatchesResponse {
  batches?: Array<{
    id: string;
    name: string;
    created_at: string;
    total_units: number;
    status: string;
    market_region: string;
  }>;
}

interface ScansResponse {
  scans?: ScanFeedItem[];
}

function getComplianceBadge(status: string | undefined) {
  const s = status?.toUpperCase();
  if (s === "VERIFIED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
        Verified
      </span>
    );
  }
  if (s === "PENDING") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
        Pending
      </span>
    );
  }
  if (s === "REJECTED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border">
      Not Uploaded
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [batches, setBatches] = useState<BatchChartData[]>([]);
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [scanLocations, setScanLocations] = useState<ScanLocation[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const batchesHref = dashboardPathFromPathname(pathname, "batches");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");
  const complianceHref = dashboardPathFromPathname(pathname, "compliance");
  const billingHref = dashboardPathFromPathname(pathname, "billing");
  const teamHref = dashboardPathFromPathname(pathname, "team");
  const productConfig = getProductConfigByType(user?.product_type);
  const dashboardConfig = productConfig.dashboard;

  const quickActionToneClasses = {
    emerald: {
      panel: "bg-emerald-100 dark:bg-emerald-500/10",
      icon: "text-emerald-500",
    },
    blue: {
      panel: "bg-blue-100 dark:bg-blue-500/10",
      icon: "text-blue-500",
    },
    amber: {
      panel: "bg-amber-100 dark:bg-amber-500/10",
      icon: "text-amber-500",
    },
    indigo: {
      panel: "bg-indigo-100 dark:bg-indigo-500/10",
      icon: "text-indigo-600",
    },
  } as const;

  const quickActionHref = (
    route: (typeof dashboardConfig.quickActions)[number]["route"],
  ) => {
    switch (route) {
      case "batches":
        return batchesHref;
      case "billing":
        return billingHref;
      case "compliance":
        return complianceHref;
      case "settings":
        return settingsHref;
      case "team":
        return teamHref;
      default:
        return batchesHref;
    }
  };

  const workspaceCardHref = dashboardConfig.workspaceCard
    ? quickActionHref(dashboardConfig.workspaceCard.route)
    : null;

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch stats, lightweight batch chart data (for chart + compliance), and recent batches
      const [statsRes, batchesRes, recentRes] = await Promise.all([
        api.get<DashboardStats>(`/dashboard/stats`),
        api.get<BatchesChartDataResponse>(`/batches/chart-data?limit=200`),
        api.get<RecentBatchesResponse>(`/batches/recent?limit=5`),
      ]);

      // Fetch scans separately — non-critical, shouldn't break dashboard
      let scansRes: { data: ScansResponse } = { data: { scans: [] } };
      try {
        scansRes = await api.get<ScansResponse>(`/scans/feed?limit=20`);
      } catch (scanError) {
        console.warn("Scan feed unavailable:", scanError);
      }

      setStats(statsRes.data);
      const allBatches = batchesRes.data.batches || [];
      setBatches(allBatches);

      // Chart Data
      const sortedAsc = [...allBatches].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const dateMap = new Map<string, number>();
      if (sortedAsc.length > 0) {
        const today = new Date();
        for (let i = 60; i >= 0; i -= 10) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dateMap.set(format(d, "MMM d"), 0);
        }
        sortedAsc.forEach((batch) => {
          const dateStr = format(parseISO(batch.created_at), "MMM d");
          dateMap.set(
            dateStr,
            (dateMap.get(dateStr) || 0) + (batch.total_passports || 0),
          );
        });
        let runningTotal = 0;
        const cData: ChartPoint[] = [];
        for (let i = 60; i >= 0; i -= 10) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateKey = format(d, "MMM d");
          runningTotal += dateMap.get(dateKey) || 0;
          cData.push({ name: dateKey, value: runningTotal });
        }
        const lastVal = cData[cData.length - 1]?.value || 0;
        const diff = (statsRes.data.total_passports || 0) - lastVal;
        setChartData(
          cData.map((d) => ({ name: d.name, value: d.value + diff })),
        );
      } else {
        setChartData([{ name: "Today", value: 0 }]);
      }

      // Recent Batches — from dedicated lightweight endpoint
      const recent = recentRes.data.batches || [];
      setRecentBatches(
        recent.map((b) => ({
          id: b.id,
          name: b.name || "Batch",
          units: b.total_units || 0,
          status: b.status || "DRAFT",
          market_region: b.market_region,
          created_at: formatDistanceToNow(new Date(b.created_at), {
            addSuffix: true,
          }),
        })),
      );

      // Store scan locations for the map
      const scans = scansRes.data.scans || [];
      setScanLocations(
        scans.map((s) => ({
          city: s.city || "Unknown",
          country: s.country || "Unknown",
          latitude: s.latitude ?? 0,
          longitude: s.longitude ?? 0,
          scanned_at: s.scanned_at,
        })),
      );

      // Audit Log
      const scanEvents: ActivityItem[] = scans.map((s) => ({
        id: `scan-${s.id || Math.random()}`,
        type: "SCAN",
        title: `QR Scan: ${s.batch_name}`,
        location: `${s.city || "Unknown"}, ${s.country || "Unknown"}`,
        time: formatDistanceToNow(new Date(s.scanned_at), { addSuffix: true }),
      }));
      const batchEvents: ActivityItem[] = recent
        .slice(0, 3)
        .map((b) => ({
          id: `batch-${b.id}`,
          type: "BATCH",
          title: `Batch Created: ${b.name || "Batch"}`,
          location: b.market_region === "INDIA" ? "Local" : "EU Export",
          time: formatDistanceToNow(new Date(b.created_at), {
            addSuffix: true,
          }),
        }));
      setActivities([...scanEvents, ...batchEvents].slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate Status Counts from stats (server-side) or fallback to client-side
  const statusMap = stats?.batches_by_status || {};
  const readyCount = statusMap["DRAFT"] || 0;
  const processingCount = statusMap["ACTIVE"] || 0;
  const completedCount =
    (statusMap["COMPLETED"] || 0) + (statusMap["ARCHIVED"] || 0);

  const quotaUsed = stats?.quota_used || 0;
  const quotaLimit = stats?.quota_limit ?? 0;
  const quotaPercent =
    quotaLimit > 0 ? Math.round((quotaUsed / quotaLimit) * 100) : 0;
  // Quota balance can't go negative (activation is blocked server-side at 0),
  // so "out of quota" is the real signal — used > limit never happens.
  const isOverLimit = (stats?.quota_balance ?? 0) <= 0 && quotaLimit > 0;

  // First-run: account has no batches yet — show getting-started guidance
  const isFirstRun = (stats?.total_batches ?? 0) === 0;

  const allVerified =
    dashboardConfig.compliance?.items.every(
      ({ statusField }) => user?.[statusField]?.toUpperCase() === "VERIFIED",
    ) ?? false;

  // All docs uploaded (PENDING or VERIFIED) but not yet all VERIFIED — nothing left
  // for the user to do, just waiting on admin review. Distinguish this from items
  // that are still NOT_UPLOADED/REJECTED, which genuinely need user action.
  const allSubmitted =
    dashboardConfig.compliance?.items.every(({ statusField }) => {
      const s = user?.[statusField]?.toUpperCase();
      return s === "PENDING" || s === "VERIFIED";
    }) ?? false;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-sidebar p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Section 1: Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isFirstRun ? "Welcome" : "Welcome back"},{" "}
              {user?.company_name || "Account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isFirstRun
                ? "Let's get your first battery passport ready"
                : dashboardConfig.subtitle}
            </p>
          </div>
          <Link
            href={batchesHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-4 w-4" />
            {dashboardConfig.primaryActionLabel}
          </Link>
        </div>

        {/* First-run: getting-started checklist */}
        {isFirstRun && (
          <div className="relative bg-transparent border border-border rounded-none p-5"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Getting started
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: 1,
                  title: "Complete your compliance profile",
                  description:
                    "Add EPR / BIS registration numbers and upload certificates",
                  href: `${settingsHref}?tab=compliance`,
                  done: allSubmitted,
                },
                {
                  step: 2,
                  title: "Create your first batch",
                  description:
                    "Describe a production run — specs, chemistry, and market",
                  href: batchesHref,
                  done: false,
                },
                {
                  step: 3,
                  title: "Activate & print QR labels",
                  description:
                    "Activation generates passports buyers can scan anywhere",
                  href: batchesHref,
                  done: false,
                },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="group flex items-start gap-3 p-3 border border-border hover:border-foreground/30 hover:bg-accent/50 transition-colors"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center text-xs font-medium border ${
                      item.done
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {item.done ? "✓" : item.step}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground group-hover:underline underline-offset-2">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {dashboardConfig.compliance ? (
          <div className="relative bg-transparent border border-border rounded-none p-5"><div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 bg-muted">
                  <Shield className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {dashboardConfig.compliance.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:ml-4">
                {dashboardConfig.compliance.items.map(
                  ({ label, statusField }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                      {getComplianceBadge(user?.[statusField])}
                    </div>
                  ),
                )}
              </div>
              <div className="sm:ml-auto shrink-0">
                {allVerified ? (
                  <span className="text-sm text-emerald-500 font-medium">
                    ✓ {dashboardConfig.compliance.verifiedText}
                  </span>
                ) : allSubmitted ? (
                  <span className="text-sm text-amber-500 font-medium">
                    {dashboardConfig.compliance.pendingText}
                  </span>
                ) : (
                  <Link
                    href={`${settingsHref}?tab=compliance`}
                    className="text-sm text-blue-500 hover:text-blue-500 font-medium hover:underline"
                  >
                    {dashboardConfig.compliance.ctaLabel} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : dashboardConfig.banner ? (
          <div className="relative bg-transparent border border-border rounded-none p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium text-foreground">
                  {dashboardConfig.banner.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dashboardConfig.banner.description}
                </p>
              </div>
              <Link
                href={quickActionHref(dashboardConfig.banner.route)}
                className="text-sm text-blue-500 hover:text-blue-500 font-medium hover:underline"
              >
                {dashboardConfig.banner.ctaLabel} →
              </Link>
            </div>
          </div>
        ) : null}

        {/* Section 3: Quick Actions Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboardConfig.quickActions.map((action) => {
            const Icon = action.icon;
            const tone = quickActionToneClasses[action.tone];

            return (
              <Link
                key={action.title}
                href={quickActionHref(action.route)}
                className="relative bg-transparent border border-border rounded-none p-4 hover:bg-accent transition-colors cursor-pointer group"
              ><div
                  className={`mb-3 flex h-10 w-10 items-center justify-center ${tone.panel}`}
                >
                  <Icon className={`h-5 w-5 ${tone.icon}`} />
                </div>
                <div className="text-sm font-medium text-foreground group-hover:text-muted-foreground">
                  {action.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Section 4: Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Passports */}
          <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible hover:border-(--border-prominent) transition-colors"><div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {dashboardConfig.totalEntitiesLabel}
              </span>
              <div className="w-5 h-5 bg-emerald-500/15 flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500" />
              </div>
            </div>
            <div className="font-mono text-3xl text-foreground tracking-tight">
              {stats?.total_passports?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="font-mono text-emerald-500">
                +{stats?.passports_this_week || 0}
              </span>{" "}
              this week
            </div>
          </div>

          {/* Active Batches */}
          <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible hover:border-(--border-prominent) transition-colors"><div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {dashboardConfig.activeCollectionsLabel}
              </span>
              <div className="w-5 h-5 bg-(--accent-purple)/15 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent-purple" />
              </div>
            </div>
            <div className="font-mono text-3xl text-foreground">
              {processingCount}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {dashboardConfig.activeCollectionsDescription}
            </div>
          </div>

          {/* Passport Quota */}
          <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible hover:border-(--border-prominent) transition-colors"><div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {dashboardConfig.quotaLabel}
              </span>
              <div className="w-5 h-5 bg-(--accent-orange)/15 flex items-center justify-center">
                <span className="font-mono text-[10px] text-accent-orange">
                  {quotaPercent}%
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}
            </div>
            <div className="w-full bg-muted h-1.5">
              <div
                className={`h-1.5 ${isOverLimit ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
              />
            </div>
            {isOverLimit && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  Out of quota
                </div>
                <Link
                  href={billingHref}
                  className="text-xs text-blue-500 hover:underline font-medium"
                >
                  Top Up →
                </Link>
              </div>
            )}
          </div>

          {dashboardConfig.compliance ? (
            <ComplianceScoreCard batches={batches} />
          ) : dashboardConfig.workspaceCard && workspaceCardHref ? (
            <div className="relative overflow-visible rounded-none border border-border bg-transparent p-5"><div className="mb-3 flex items-center justify-between">
                <span className="code-label text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {dashboardConfig.workspaceCard.title}
                </span>
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-sm text-foreground">
                {dashboardConfig.workspaceCard.description}
              </p>
              <Link
                href={workspaceCardHref}
                className="mt-4 inline-flex text-xs font-medium text-blue-500 hover:underline"
              >
                {dashboardConfig.workspaceCard.ctaLabel} →
              </Link>
            </div>
          ) : null}
        </div>

        {/* Section 5: Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Production Overview */}
          <div className="relative lg:col-span-3 bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-medium text-foreground">
                {dashboardConfig.trendTitle}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dashboardConfig.trendSubtitle}
              </p>
            </div>
            <div className="p-6">
              <ProductionChart data={chartData} />
            </div>
          </div>

          {/* Batch Status */}
          <div className="relative bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-medium text-foreground">
                Batch Status
              </h3>
            </div>
            <div className="p-6">
              <BatchStatusChart
                ready={readyCount}
                processing={processingCount}
                completed={completedCount}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Recent Batches + Audit Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Batches */}
          <div className="relative lg:col-span-2 bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">
                {dashboardConfig.recentCollectionsLabel}
              </h3>
              <Link
                href={batchesHref}
                className="text-xs text-blue-500 hover:underline font-medium"
              >
                View All →
              </Link>
            </div>
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {dashboardConfig.collectionSingularLabel}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-b border-border hover:bg-accent"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={dashboardPathFromPathname(
                          pathname,
                          `batches/${batch.id}`,
                        )}
                        className="text-sm font-medium text-foreground hover:text-blue-500"
                      >
                        {batch.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {batch.units} units
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border ${
                          batch.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : batch.status === "DRAFT"
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}
                      >
                        {batch.status === "ACTIVE"
                          ? "Active"
                          : batch.status === "DRAFT"
                            ? "Draft"
                            : batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {batch.created_at}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button aria-label="Batch actions" className="text-muted-foreground hover:text-foreground p-1 hover:bg-accent">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="shadow-none min-w-40"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                dashboardPathFromPathname(
                                  pathname,
                                  `batches/${batch.id}`,
                                ),
                              )
                            }
                            className="cursor-pointer"
                          >
                            <ArrowRight className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>

                          {batch.status !== "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await api.post(
                                    `/batches/${batch.id}/activate`,
                                  );
                                  toast.success("Batch activated!");
                                  fetchDashboardData();
                                } catch (err: unknown) {
                                  const apiError = err as {
                                    response?: { data?: { error?: string } };
                                  };
                                  toast.error(
                                    apiError.response?.data?.error ||
                                      "Activation failed",
                                  );
                                }
                              }}
                              className="cursor-pointer text-emerald-500 hover:bg-emerald-500/15 focus:bg-emerald-500/15 focus:text-emerald-500"
                            >
                              <Zap className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setBatchToDelete(batch.id);
                            }}
                            className="cursor-pointer text-red-500 hover:bg-red-500/15 focus:bg-red-500/15 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {recentBatches.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      {dashboardConfig.recentEmptyState}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Log */}
          <div className="relative bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-medium text-foreground">
                Audit Log
              </h3>
            </div>
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="px-6 py-4 flex items-start gap-3 hover:bg-accent"
                >
                  <div
                    className={`p-2 ${activity.type === "SCAN" ? "bg-emerald-500/10" : "bg-blue-500/10"}`}
                  >
                    {activity.type === "SCAN" ? (
                      <QrCode className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <FolderPlus className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.location}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 7: Global Scan Activity */}
        <div className="relative bg-transparent border border-border rounded-none overflow-visible"><div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-foreground">
                Global Scan Activity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time QR code scans worldwide
              </p>
            </div>
          </div>
          <ScanMap scans={scanLocations} height={400} />
        </div>
      </div>
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!batchToDelete}
        onOpenChange={(open) => !open && setBatchToDelete(null)}
        title="Delete this batch?"
        description="This action cannot be undone. The batch and all its data will be permanently removed."
        confirmText="Delete Batch"
        variant="destructive"
        onConfirm={async () => {
          if (batchToDelete) {
            try {
              await api.delete(`/batches/${batchToDelete}`);
              toast.success("Batch deleted");
              fetchDashboardData();
            } catch {
              toast.error("Failed to delete batch");
            } finally {
              setBatchToDelete(null);
            }
          }
        }}
      />
    </div>
  );
}
