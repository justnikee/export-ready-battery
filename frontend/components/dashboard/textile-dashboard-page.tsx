"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  Layers3,
  AlertCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Batch } from "@/lib/types";
import { dashboardPathFromPathname } from "@/lib/routes";
import { getProductConfigByType } from "@/lib/products";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

interface DashboardStats {
  total_passports: number;
  total_batches: number;
  quota_used: number;
  quota_limit: number;
  passports_this_week: number;
}

interface RecentBatch {
  id: string;
  name: string;
  units: number;
  status: string;
  created_at: string;
}

interface BatchesResponse {
  batches?: Batch[];
}

export default function TextileDashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const batchesHref = dashboardPathFromPathname(pathname, "batches");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");
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
      const [statsRes, batchesRes] = await Promise.all([
        api.get<DashboardStats>(`/dashboard/stats?tenant_id=${user.tenant_id}`),
        api.get<BatchesResponse>(`/batches?tenant_id=${user.tenant_id}`),
      ]);

      setStats(statsRes.data);
      const allBatches = batchesRes.data.batches || [];
      const sortedByDateDesc = [...allBatches].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setRecentBatches(
        sortedByDateDesc.slice(0, 5).map((b) => ({
          id: b.id,
          name: b.batch_name || "Lot",
          units: b.total_passports || 0,
          status: b.status || "DRAFT",
          created_at: formatDistanceToNow(new Date(b.created_at), {
            addSuffix: true,
          }),
        })),
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quotaUsed = stats?.quota_used || 0;
  const quotaLimit = stats?.quota_limit || 5000;
  const quotaPercent = Math.round((quotaUsed / quotaLimit) * 100);
  const isOverLimit = quotaUsed > quotaLimit;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-sidebar p-6">
      <div className="w-full mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Welcome back, {user?.company_name || "Account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {dashboardConfig.subtitle}
            </p>
          </div>
          <Link
            href={batchesHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Layers3 className="h-4 w-4" />
            {dashboardConfig.primaryActionLabel}
          </Link>
        </div>

        {dashboardConfig.banner ? (
          <div className="relative bg-transparent border border-border rounded-none p-5">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboardConfig.quickActions.map((action) => {
            const Icon = action.icon;
            const tone = quickActionToneClasses[action.tone];

            return (
              <Link
                key={action.title}
                href={quickActionHref(action.route)}
                className="relative bg-transparent border border-border rounded-none p-4 hover:bg-accent transition-colors cursor-pointer group"
              >
                <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
                <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
                <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
                <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
                <div
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible hover:border-(--border-prominent) transition-colors">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="flex items-center justify-between mb-3">
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

          <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible hover:border-(--border-prominent) transition-colors">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {dashboardConfig.activeCollectionsLabel}
              </span>
              <div className="w-5 h-5 bg-(--accent-purple)/15 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent-purple" />
              </div>
            </div>
            <div className="font-mono text-3xl text-foreground">
              {stats?.total_batches || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {dashboardConfig.activeCollectionsDescription}
            </div>
          </div>

          <div className="relative bg-transparent border border-border rounded-none p-5 overflow-visible hover:border-(--border-prominent) transition-colors">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="flex items-center justify-between mb-3">
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
              <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                Over by {(quotaUsed - quotaLimit).toLocaleString()}
              </div>
            )}
          </div>

          {dashboardConfig.workspaceCard && workspaceCardHref ? (
            <div className="relative overflow-visible rounded-none border border-border bg-transparent p-5">
              <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
              <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
              <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
              <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
              <div className="mb-3 flex items-center justify-between">
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

        <div className="relative bg-transparent border border-border rounded-none overflow-visible">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
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
                  Records
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="border-b border-border hover:bg-accent cursor-pointer"
                  onClick={() =>
                    router.push(
                      dashboardPathFromPathname(pathname, `batches/${batch.id}`),
                    )
                  }
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground hover:text-blue-500">
                      {batch.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {batch.units}
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
                </tr>
              ))}
              {recentBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {dashboardConfig.recentEmptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
