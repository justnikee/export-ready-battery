"use client";

import { Leaf, Recycle, AlertTriangle } from "lucide-react";
import type { Batch } from "@/lib/types";
import { DashboardPanel } from "../DashboardPanel";

interface SustainabilityCardProps {
  batch: Batch;
}

function SustainRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );
}

export function SustainabilityCard({ batch }: SustainabilityCardProps) {
  const s = batch.specs;
  const cf = batch.carbon_footprint_result;

  const hasCarbonResult = cf && Object.keys(cf).length > 0;

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="h-4 w-4 text-emerald-500" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Sustainability
        </h3>
      </div>
      <div className="space-y-0">
        {s.carbon_footprint ? (
          <SustainRow
            label="Carbon Footprint"
            value={
              <span className="font-mono text-xs">{s.carbon_footprint}</span>
            }
          />
        ) : (
          <SustainRow
            label="Carbon Footprint"
            value={<span className="text-muted-foreground">Not calculated</span>}
          />
        )}

        {hasCarbonResult && (
          <SustainRow
            label="Carbon Result"
            value={
              <span className="text-emerald-500 text-xs">Calculated</span>
            }
          />
        )}

        <SustainRow
          label="Recyclable"
          value={
            s.recyclable ? (
              <span className="text-emerald-500">Yes</span>
            ) : (
              <span className="text-muted-foreground">No</span>
            )
          }
        />

        {s.recycled_content_pct !== undefined &&
          s.recycled_content_pct !== null && (
            <SustainRow
              label="Recycled Content"
              value={
                <span className="font-mono text-emerald-500">
                  {s.recycled_content_pct}%
                </span>
              }
            />
          )}

        {s.hazardous_substances && (
          <div className="py-2.5 border-b border-border last:border-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              Hazardous Substances
            </span>
            <div className="flex flex-wrap gap-2">
              {s.hazardous_substances.lead_present && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] uppercase border border-amber-500/30">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Lead Present
                </span>
              )}
              {s.hazardous_substances.mercury_present && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] uppercase border border-amber-500/30">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Mercury Present
                </span>
              )}
              {s.hazardous_substances.cadmium_present && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] uppercase border border-amber-500/30">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Cadmium Present
                </span>
              )}
              {!s.hazardous_substances.lead_present &&
                !s.hazardous_substances.mercury_present &&
                !s.hazardous_substances.cadmium_present && (
                  <span className="text-xs text-emerald-500">
                    No hazardous substances declared
                  </span>
                )}
            </div>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
