"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Radio, HeartPulse, AlertTriangle, Flame, Key } from "lucide-react";
import { dashboardPathFromPathname } from "@/lib/routes";
import { useFleetStats, useFleetThermalEvents, useDeviceTokens } from "@/hooks/use-queries";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
import { ThermalEventsFeed } from "@/components/telemetry/ThermalEventsFeed";

export default function TelemetryDashboardPage() {
  const pathname = usePathname();
  const developerHref = dashboardPathFromPathname(pathname, "developer");
  const batchHrefFor = (batchId: string) => dashboardPathFromPathname(pathname, `batches/${batchId}`);

  const { data: stats, isLoading: statsLoading } = useFleetStats();
  const { data: thermalEvents = [], isLoading: eventsLoading } = useFleetThermalEvents(30, 20);
  const { data: devices = [], isLoading: devicesLoading } = useDeviceTokens();

  const soHDistribution = (stats?.soh_distribution || []).map((b) => ({ name: b.band, value: b.count }));
  const activeDeviceCount = devices.filter((d) => d.is_active).length;

  return (
    <div className="min-h-screen bg-sidebar p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-2">
          <Radio className="h-6 w-6 text-blue-500" />
          BMS Telemetry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live battery management system readings — State of Health, thermal events, and registered devices across your fleet.
        </p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="w-3.5 h-3.5" />
            Registered Devices
          </div>
          <div className="text-2xl font-medium">{devicesLoading ? "—" : activeDeviceCount}</div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HeartPulse className="w-3.5 h-3.5" />
            Avg SoH
          </div>
          <div className="text-2xl font-medium">
            {statsLoading || stats?.avg_soh === null || stats?.avg_soh === undefined ? "—" : `${stats.avg_soh.toFixed(1)}%`}
          </div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" />
            Below 80% SoH
          </div>
          <div className="text-2xl font-medium">{statsLoading ? "—" : stats?.below_80_count ?? 0}</div>
        </div>
        <div className="bg-muted rounded-md p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="w-3.5 h-3.5" />
            Thermal Events (30d)
          </div>
          <div className="text-2xl font-medium">{statsLoading ? "—" : stats?.thermal_events_30d ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* SoH distribution */}
        <div className="bg-muted rounded-md p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">SoH Distribution</h3>
          <StatusDistributionChart data={soHDistribution} emptyMessage="No SoH data yet" />
        </div>

        {/* Device tokens summary */}
        <div className="bg-muted rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Registered Devices</h3>
            <Link href={developerHref} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Key className="w-3 h-3" />
              Manage in Developer →
            </Link>
          </div>
          {devicesLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading devices...</p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No BMS devices registered yet.{" "}
              <Link href={developerHref} className="text-primary hover:underline">
                Register one →
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-border">
              {devices.slice(0, 6).map((d) => (
                <div key={d.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-foreground">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {d.last_used_at ? new Date(d.last_used_at).toLocaleDateString() : "Never used"}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${d.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                      {d.is_active ? "Active" : "Revoked"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thermal events feed */}
      <div className="border border-border p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Thermal Events — Last 30 Days</h3>
        {eventsLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        ) : (
          <ThermalEventsFeed events={thermalEvents} batchHrefFor={batchHrefFor} />
        )}
      </div>
    </div>
  );
}
