"use client";

import { RegulationGapCount } from "@/lib/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface GapHeatmapProps {
  data: RegulationGapCount[];
}

export function GapHeatmap({ data }: GapHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
        <div className="p-3 bg-emerald-500/10 rounded-full">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h4 className="text-foreground font-medium">Perfect compliance</h4>
          <p className="text-sm text-muted-foreground mt-1">No open compliance gaps found in active batches.</p>
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

  const items = Object.values(grouped).sort((a, b) => (b.errors + b.warnings) - (a.errors + a.warnings));

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const total = item.errors + item.warnings;
        const errPercent = total > 0 ? (item.errors / total) * 100 : 0;
        const warnPercent = total > 0 ? (item.warnings / total) * 100 : 0;

        return (
          <div key={item.regulation} className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="space-y-1">
                <span className="text-sm font-medium text-foreground">{item.regulation}</span>
              </div>
              <div className="flex items-center gap-3">
                {item.errors > 0 && (
                  <div className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                    <AlertCircle className="h-3 w-3" />
                    <span>{item.errors} Errors</span>
                  </div>
                )}
                {item.warnings > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    <AlertCircle className="h-3 w-3" />
                    <span>{item.warnings} Warnings</span>
                  </div>
                )}
              </div>
            </div>

            {/* Split Progress Bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              {item.errors > 0 && (
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${errPercent}%` }}
                />
              )}
              {item.warnings > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${warnPercent}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
