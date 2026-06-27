"use client";

import Link from "next/link";
import { Flame, ThermometerSun, Snowflake } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FleetThermalEvent } from "@/lib/api/fleet";

const THERMAL_TYPE_META: Record<string, { label: string; icon: typeof Flame; className: string }> = {
  THERMAL_RUNAWAY_WARNING: { label: "Thermal Runaway Warning", icon: Flame, className: "bg-red-500/10 text-red-500" },
  OVERHEAT: { label: "Overheat", icon: ThermometerSun, className: "bg-amber-500/10 text-amber-500" },
  COOLING_FAILURE: { label: "Cooling Failure", icon: Snowflake, className: "bg-blue-500/10 text-blue-500" },
};

export function ThermalEventsFeed({ events, batchHrefFor }: { events: FleetThermalEvent[]; batchHrefFor: (batchId: string) => string }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No thermal events in this window.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {events.map((e) => {
        const meta = THERMAL_TYPE_META[e.thermal_type] ?? { label: e.thermal_type || "Thermal Event", icon: Flame, className: "bg-muted text-muted-foreground" };
        const Icon = meta.icon;
        return (
          <div key={e.id} className="py-3 flex items-start gap-3">
            <div className={`p-2 ${meta.className}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {meta.label}: <span className="font-mono">{e.serial_number}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {e.batch_name}
                {e.temperature !== null && ` · ${e.temperature.toFixed(1)}°C`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(e.recorded_at), { addSuffix: true })}
              </span>
              <Link href={batchHrefFor(e.batch_id)} className="text-xs text-primary hover:underline">
                View batch →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
