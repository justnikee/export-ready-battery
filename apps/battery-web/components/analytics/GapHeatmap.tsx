"use client";

import { RegulationGapCount } from "@/lib/types";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface GapHeatmapProps {
  data: RegulationGapCount[];
}

export function GapHeatmap({ data }: GapHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
        <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h4 className="text-foreground font-medium">Perfect Compliance</h4>
          <p className="text-xs text-muted-foreground mt-1">
            No open regulation gaps detected in active battery batches.
          </p>
        </div>
      </div>
    );
  }

  // Group by regulation name
  const grouped = data.reduce((acc, curr) => {
    if (!acc[curr.regulation]) {
      acc[curr.regulation] = { regulation: curr.regulation, errors: 0, warnings: 0 };
    }
    if (curr.severity === "ERROR") {
      acc[curr.regulation].errors += curr.count;
    } else {
      acc[curr.regulation].warnings += curr.count;
    }
    return acc;
  }, {} as Record<string, { regulation: string; errors: number; warnings: number }>);

  const items = Object.values(grouped).sort(
    (a, b) => b.errors + b.warnings - (a.errors + a.warnings),
  );

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const total = item.errors + item.warnings;
        const errPercent = total > 0 ? (item.errors / total) * 100 : 0;
        const warnPercent = total > 0 ? (item.warnings / total) * 100 : 0;

        return (
          <div
            key={item.regulation}
            className="p-3.5 rounded-lg border border-border/80 bg-card/40 hover:bg-card/70 transition-all space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  {item.regulation}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.errors > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    <AlertCircle className="h-3 w-3" />
                    <span>{item.errors} Errors</span>
                  </div>
                )}
                {item.warnings > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <AlertCircle className="h-3 w-3" />
                    <span>{item.warnings} Warnings</span>
                  </div>
                )}
              </div>
            </div>

            {/* Split Progress Bar */}
            <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {item.errors > 0 && (
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${errPercent}%` }}
                  title={`${item.errors} Errors (${errPercent.toFixed(0)}%)`}
                />
              )}
              {item.warnings > 0 && (
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${warnPercent}%` }}
                  title={`${item.warnings} Warnings (${warnPercent.toFixed(0)}%)`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
