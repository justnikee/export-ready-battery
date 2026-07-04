"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEuActiveBatches } from "@/hooks/use-queries";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
import { dashboardPathFromPathname } from "@/lib/routes";
import { Calculator, AlertTriangle } from "lucide-react";

// JRC-aligned carbon class thresholds — mirrors services/carbon_calculator.go's
// ClassifyCarbonClass so the table here can't drift from what the backend
// actually assigns.
const CARBON_CLASS_THRESHOLDS: { class: string; maxKgCO2ePerKwh: number | null }[] = [
  { class: "A", maxKgCO2ePerKwh: 40 },
  { class: "B", maxKgCO2ePerKwh: 60 },
  { class: "C", maxKgCO2ePerKwh: 80 },
  { class: "D", maxKgCO2ePerKwh: 100 },
  { class: "E", maxKgCO2ePerKwh: 120 },
  { class: "F", maxKgCO2ePerKwh: 150 },
  { class: "G", maxKgCO2ePerKwh: null },
];

export default function CarbonTab() {
  const pathname = usePathname();
  const carbonCalculatorHref = dashboardPathFromPathname(pathname, "carbon-calculator");
  const { data: euBatches = [], isLoading } = useEuActiveBatches();

  const withFootprint = euBatches.filter((b) => b.carbon_footprint_result && Object.keys(b.carbon_footprint_result).length > 0);
  const missingDeclaration = euBatches.filter((b) => !b.carbon_footprint_result || Object.keys(b.carbon_footprint_result).length === 0);

  const perKwhValues = withFootprint
    .map((b) => (b.carbon_footprint_result as Record<string, unknown> | null)?.per_kwh_kg_co2e)
    .filter((v): v is number => typeof v === "number");
  const avgPerKwh = perKwhValues.length > 0 ? perKwhValues.reduce((a, b) => a + b, 0) / perKwhValues.length : null;

  const distribution = Array.from(
    euBatches
      .reduce((map, b) => {
        const cls = b.carbon_performance_class || "Not calculated";
        map.set(cls, (map.get(cls) || 0) + 1);
        return map;
      }, new Map<string, number>())
      .entries(),
  ).map(([name, value]) => ({ name, value }));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading carbon data...</p>;
  }

  if (euBatches.length === 0) {
    return (
      <div className="bg-muted rounded-md p-12 text-center">
        <p className="text-sm text-muted-foreground">No active EU/GLOBAL batches yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-muted rounded-md p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Carbon Class Distribution</h3>
          <StatusDistributionChart data={distribution} emptyMessage="No carbon class data" />
        </div>

        <div className="bg-muted rounded-md p-5 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Average Footprint</h3>
            <p className="text-2xl text-foreground">
              {avgPerKwh !== null ? `${avgPerKwh.toFixed(1)} kg CO₂e/kWh` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Across {withFootprint.length} batches with a calculated footprint</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">EU JRC carbon class thresholds</p>
            <div className="grid grid-cols-7 gap-1">
              {CARBON_CLASS_THRESHOLDS.map((t) => (
                <div key={t.class} className="text-center">
                  <div className="text-xs font-medium text-foreground bg-background rounded py-1">{t.class}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {t.maxKgCO2ePerKwh !== null ? `≤${t.maxKgCO2ePerKwh}` : ">150"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {missingDeclaration.length > 0 && (
        <div className="border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-medium text-foreground">
              {missingDeclaration.length} batch{missingDeclaration.length === 1 ? "" : "es"} missing a carbon declaration
            </h3>
          </div>
          <ul className="space-y-1.5">
            {missingDeclaration.slice(0, 10).map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{b.batch_name || b.model_name}</span>
                <Link href={dashboardPathFromPathname(pathname, `batches/${b.id}`)} className="text-primary hover:underline text-xs">
                  Fix →
                </Link>
              </li>
            ))}
          </ul>
          {missingDeclaration.length > 10 && (
            <p className="text-xs text-muted-foreground mt-2">+{missingDeclaration.length - 10} more</p>
          )}
        </div>
      )}

      <Link
        href={carbonCalculatorHref}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Calculator className="w-4 h-4" />
        Calculate Carbon for a Batch
      </Link>
    </div>
  );
}
