"use client";

import { FlaskConical, Recycle } from "lucide-react";
import type { Batch } from "@/lib/types";
import { DashboardPanel } from "../DashboardPanel";

interface MaterialCompositionProps {
  batch: Batch;
}

function MaterialBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="py-2 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm text-foreground font-mono">{value}%</span>
      </div>
      <div className="w-full h-1 bg-muted mt-1">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function MaterialComposition({ batch }: MaterialCompositionProps) {
  const s = batch.specs;
  const mc = s.material_composition;

  const materialItems = mc
    ? [
        { label: "Cobalt", value: mc.cobalt_pct, color: "bg-blue-500" },
        { label: "Lithium", value: mc.lithium_pct, color: "bg-emerald-500" },
        { label: "Nickel", value: mc.nickel_pct, color: "bg-amber-500" },
        { label: "Lead", value: mc.lead_pct, color: "bg-slate-500" },
        { label: "Manganese", value: mc.manganese_pct, color: "bg-violet-500" },
        { label: "Graphite", value: mc.graphite_pct, color: "bg-rose-500" },
      ].filter((i) => i.value !== undefined && i.value !== null) as {
        label: string;
        value: number;
        color: string;
      }[]
    : [];

  const hasRecycledContent =
    s.recycled_content_pct !== undefined && s.recycled_content_pct !== null;
  const hasAny = materialItems.length > 0 || hasRecycledContent;

  if (!hasAny) {
    return (
      <DashboardPanel>
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Materials
          </h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No material data recorded
        </p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Material Composition
        </h3>
      </div>

      {materialItems.length > 0 && (
        <div className="space-y-0">
          {materialItems.map((item) => (
            <MaterialBar
              key={item.label}
              label={item.label}
              value={item.value}
              color={item.color}
            />
          ))}
        </div>
      )}

      {hasRecycledContent && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Recycled Content
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(s.recycled_content_pct!, 100)}%` }}
              />
            </div>
            <span className="text-sm font-mono text-emerald-500">
              {s.recycled_content_pct}%
            </span>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
