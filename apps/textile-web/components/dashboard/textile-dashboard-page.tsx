"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  Layers3,
  AlertCircle,
  Plus,
  FileCheck,
  Leaf,
  Shirt,
  Droplets,
  Zap,
  Recycle,
  Beaker,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Batch } from "@/lib/types";
import { dashboardPathFromPathname } from "@/lib/routes";
import { getProductConfigByType } from "@/lib/products";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { CreateBatchDialog } from "@/components/batches/create-batch-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  total_passports: number;
  total_batches: number;
  quota_used: number;
  quota_limit: number;
  passports_this_week: number;
  avg_water_usage: number;
  avg_energy_usage: number;
  avg_recycled_content: number;
  avg_biodegradable: number;
  chemical_compliance_percentage: number;
}

interface BatchesResponse {
  batches?: Batch[];
}

export default function TextileDashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
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

      setBatches(sortedByDateDesc);
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

  const recentBatches = batches.slice(0, 5);

  // ── Aggregate textile metrics ──
  // Prefer backend-computed averages; fallback to client-side computation
  const avgWater = stats?.avg_water_usage ?? 0;
  const avgEnergy = stats?.avg_energy_usage ?? 0;
  const avgRecycled = stats?.avg_recycled_content ?? 0;
  const avgBiodegradable = stats?.avg_biodegradable ?? 0;
  const chemicalCompliance = stats?.chemical_compliance_percentage ?? 0;

  const textileBatches = batches.filter((b) => b.product_type === "TEXTILE");

  // ── Fiber breakdown ──
  const fiberKeys = [
    { key: "cotton_pct", label: "Cotton" },
    { key: "polyester_pct", label: "Polyester" },
    { key: "wool_pct", label: "Wool" },
    { key: "silk_pct", label: "Silk" },
    { key: "linen_pct", label: "Linen" },
    { key: "viscose_pct", label: "Viscose" },
    { key: "nylon_pct", label: "Nylon" },
    { key: "acrylic_pct", label: "Acrylic" },
    { key: "hemp_pct", label: "Hemp" },
    { key: "other_pct", label: "Other" },
  ] as const;

  const fiberTotals = fiberKeys
    .map(({ key, label }) => ({
      key,
      label,
      value: textileBatches.reduce((sum, b) => {
        const pct = b.specs?.fiber_composition?.[key];
        return sum + (typeof pct === "number" ? pct : 0);
      }, 0),
    }))
    .filter((f) => f.value > 0);

  const totalFiber = fiberTotals.reduce((sum, f) => sum + f.value, 0) || 1;

  // ── Compliance buckets ──
  const greenLots = batches.filter(
    (b) => (b.compliance_score ?? 0) > 75,
  ).length;
  const amberLots = batches.filter((b) => {
    const s = b.compliance_score ?? 0;
    return s >= 50 && s <= 75;
  }).length;
  const redLots = batches.filter(
    (b) => (b.compliance_score ?? 0) < 50 && b.compliance_score !== undefined && b.compliance_score !== null,
  ).length;
  const unscoredLots = batches.filter(
    (b) => b.compliance_score === undefined || b.compliance_score === null,
  ).length;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-sidebar p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Welcome back, {user?.company_name || "Account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {dashboardConfig.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateBatchDialog onBatchCreated={fetchDashboardData} />
            <Link
              href={batchesHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Layers3 className="h-4 w-4" />
              {dashboardConfig.primaryActionLabel}
            </Link>
          </div>
        </div>

        {/* Banner */}
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

        {/* Quick Actions Grid */}
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

        {/* Extra quick action links */}
        <div className="flex items-center gap-3">
          <Link
            href={settingsHref}
            className="inline-flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <FileCheck className="h-4 w-4" />
            {dashboardConfig.uploadComplianceLabel || "Upload Compliance Certificates"}
          </Link>
        </div>

        {/* Stats Row */}
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

          {/* Chemical Compliance */}
          <div className="relative overflow-visible rounded-none border border-border bg-transparent p-5">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {dashboardConfig.complianceCardTitle || "Chemical Compliance"}
              </span>
              <div className="w-5 h-5 bg-blue-500/15 flex items-center justify-center">
                <Beaker className="h-3 w-3 text-blue-500" />
              </div>
            </div>
            <div className="font-mono text-3xl text-foreground">
              {chemicalCompliance.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {dashboardConfig.complianceCardSubtitle || "ZDHC MRSL coverage"}
            </div>
            <div className="w-full bg-muted h-1.5 mt-2">
              <div
                className="h-1.5 bg-blue-500"
                style={{ width: `${Math.min(chemicalCompliance, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Textile-specific Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sustainability Overview */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Leaf className="h-4 w-4 text-emerald-500" />
                Sustainability Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Avg Water Usage</span>
                  <span className="text-foreground font-medium">
                    {avgWater.toFixed(1)} L
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5">
                  <div
                    className="h-1.5 bg-cyan-500"
                    style={{ width: `${Math.min((avgWater / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Avg Energy Usage</span>
                  <span className="text-foreground font-medium">
                    {avgEnergy.toFixed(1)} kWh
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5">
                  <div
                    className="h-1.5 bg-emerald-500"
                    style={{ width: `${Math.min((avgEnergy / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Recycled Content</span>
                  <span className="text-foreground font-medium">
                    {avgRecycled.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5">
                  <div
                    className="h-1.5 bg-teal-500"
                    style={{ width: `${Math.min(avgRecycled, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Biodegradable</span>
                  <span className="text-foreground font-medium">
                    {avgBiodegradable.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5">
                  <div
                    className="h-1.5 bg-green-500"
                    style={{ width: `${Math.min(avgBiodegradable, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fiber Breakdown */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <Shirt className="h-4 w-4 text-cyan-500" />
                Fiber Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fiberTotals.length > 0 ? (
                fiberTotals.map((fiber) => (
                  <div key={fiber.key}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">
                        {fiber.label}
                      </span>
                      <span className="text-foreground font-medium">
                        {((fiber.value / totalFiber) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5">
                      <div
                        className="h-1.5 bg-cyan-500"
                        style={{
                          width: `${Math.min((fiber.value / totalFiber) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No fiber composition data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-xs text-muted-foreground">
                  Green (&gt;75)
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {greenLots} lots
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-amber-500/5 border border-amber-500/10">
                <span className="text-xs text-muted-foreground">
                  Amber (50-75)
                </span>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  {amberLots} lots
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-500/5 border border-red-500/10">
                <span className="text-xs text-muted-foreground">Red (&lt;50)</span>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                  {redLots} lots
                </Badge>
              </div>
              {unscoredLots > 0 && (
                <div className="flex items-center justify-between p-2 bg-muted border border-border">
                  <span className="text-xs text-muted-foreground">
                    Not Scored
                  </span>
                  <Badge className="bg-muted text-muted-foreground border-border">
                    {unscoredLots} lots
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Lots Table */}
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
                  Material Profile
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Production Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  GSM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Compliance
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
                      {batch.batch_name || "Lot"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {batch.total_passports || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {batch.specs?.material_profile || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {batch.specs?.production_stage
                      ? batch.specs.production_stage
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {batch.specs?.gsm ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {batch.compliance_score !== undefined &&
                    batch.compliance_score !== null ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${
                          batch.compliance_score > 75
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : batch.compliance_score >= 50
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {batch.compliance_score}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
                    {formatDistanceToNow(new Date(batch.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
              {recentBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
