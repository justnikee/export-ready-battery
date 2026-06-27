"use client";

import { RotateCcw, Recycle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FleetLifecycleEvent } from "@/lib/api/fleet";

export function LifecycleEventsTimeline({ events }: { events: FleetLifecycleEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No RECALL or RECYCLE events in the last 30 days.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {events.map((e) => (
        <div key={e.id} className="py-3 flex items-start gap-3">
          <div className={`p-2 ${e.event_type === "RECALLED" ? "bg-red-500/10" : "bg-blue-500/10"}`}>
            {e.event_type === "RECALLED" ? (
              <RotateCcw className="h-4 w-4 text-red-500" />
            ) : (
              <Recycle className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              {e.event_type === "RECALLED" ? "Recalled" : "Recycled"}: <span className="font-mono">{e.serial_number}</span>
            </p>
            <p className="text-xs text-muted-foreground">{e.batch_name}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}
