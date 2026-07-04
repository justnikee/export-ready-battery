"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { FleetPassportHealth } from "@/lib/api/fleet";

function sohTextClass(soh: number | null): string {
  if (soh === null) return "text-muted-foreground";
  if (soh < 60) return "text-red-500";
  if (soh < 80) return "text-amber-500";
  return "text-foreground";
}

export function WorstHealthTable({ passports, lifecycleHref }: { passports: FleetPassportHealth[]; lifecycleHref: string }) {
  if (passports.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No IN_SERVICE passports with SoH data yet.</p>;
  }

  return (
    <div className="bg-background rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Serial</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Batch</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">SoH</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Last Reading</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {passports.map((p) => (
            <tr key={p.uuid}>
              <td className="px-4 py-3 font-mono text-foreground">{p.serial_number}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.batch_name}</td>
              <td className={`px-4 py-3 text-right font-medium flex items-center justify-end gap-1 ${sohTextClass(p.state_of_health)}`}>
                {p.state_of_health !== null && p.state_of_health < 60 && <AlertTriangle className="w-3.5 h-3.5" />}
                {p.state_of_health !== null ? `${p.state_of_health.toFixed(1)}%` : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {p.last_reading_at ? new Date(p.last_reading_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={lifecycleHref} className="text-xs text-primary hover:underline">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
