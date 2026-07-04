"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { HeartPulse, Activity, AlertTriangle, RotateCcw, Flame, Loader2 } from "lucide-react";
import { dashboardPathFromPathname } from "@/lib/routes";
import { useFleetStats, useFleetWorstHealth, useFleetEvents, useFleetGeo } from "@/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
import { WorstHealthTable } from "@/components/fleet/WorstHealthTable";
import { LifecycleEventsTimeline } from "@/components/fleet/LifecycleEventsTimeline";

const ScanMap = dynamic(
  () => import("@/components/dashboard/ScanMap").then((mod) => mod.ScanMap),
  { ssr: false },
);

export default function FleetHealthPage() {
  const pathname = usePathname();
  const lifecycleHref = dashboardPathFromPathname(pathname, "lifecycle");

  const { data: stats, isLoading: statsLoading } = useFleetStats();
  const { data: worstHealth = [], isLoading: worstHealthLoading } = useFleetWorstHealth(20);
  const { data: events = [], isLoading: eventsLoading } = useFleetEvents(30);
  const { data: geo = [] } = useFleetGeo();

  const soHDistribution = (stats?.soh_distribution || []).map((b) => ({ name: b.band, value: b.count }));

  return (
    <div className="min-h-screen bg-sidebar p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-rose-500" />
          Fleet Health
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          State of Health, thermal events, and recall tracking across your deployed fleet.
        </p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            Total IN_SERVICE
          </div>
          <div className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-7 w-16" /> : stats?.total_in_service ?? 0}
          </div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HeartPulse className="w-3.5 h-3.5" />
            Avg SoH
          </div>
          <div className="text-2xl font-medium">
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : stats?.avg_soh === null || stats?.avg_soh === undefined ? (
              "—"
            ) : (
              `${stats.avg_soh.toFixed(1)}%`
            )}
          </div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" />
            Below 80% SoH
          </div>
          <div className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-7 w-16" /> : stats?.below_80_count ?? 0}
          </div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
            Open Recalls
          </div>
          <div className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-7 w-16" /> : stats?.open_recalls ?? 0}
          </div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="w-3.5 h-3.5" />
            Thermal Events (30d)
          </div>
          <div className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-7 w-16" /> : stats?.thermal_events_30d ?? 0}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* SoH distribution */}
        <div className="bg-muted rounded-md p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">SoH Distribution</h3>
          <StatusDistributionChart data={soHDistribution} emptyMessage="No SoH data yet" />
        </div>

        {/* Geographic deployment */}
        <div className="bg-muted rounded-md p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Geographic Deployment</h3>
          <ScanMap
            scans={geo.map((g) => ({
              city: g.city || "Unknown",
              country: g.country || "Unknown",
              latitude: g.latitude,
              longitude: g.longitude,
              scanned_at: g.scanned_at,
            }))}
            height={280}
          />
        </div>
      </div>

      {/* Worst-health table */}
      <div className="bg-muted rounded-md p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Worst Health — Bottom 20 by SoH</h3>
        {worstHealthLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading fleet health…
          </div>
        ) : (
          <WorstHealthTable passports={worstHealth} lifecycleHref={lifecycleHref} />
        )}
      </div>

      {/* Lifecycle events timeline */}
      <div className="bg-muted rounded-md p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Lifecycle Events — Last 30 Days</h3>
        {eventsLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events…
          </div>
        ) : (
          <LifecycleEventsTimeline events={events} />
        )}
      </div>
    </div>
  );
}
