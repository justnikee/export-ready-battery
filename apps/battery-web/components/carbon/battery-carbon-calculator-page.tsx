"use client";

import { Leaf } from "lucide-react";
import { CarbonCalculator } from "@/components/batches/carbon-calculator";

export default function CarbonCalculatorStandalonePage() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div>
        <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-2">
          <Leaf className="h-6 w-6 text-emerald-500" />
          Carbon Calculator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          EU Battery Regulation 2023/1542 Article 7 carbon footprint calculator — run a standalone estimate, then apply the result to any active batch.
        </p>
      </div>

      <CarbonCalculator />
    </div>
  );
}
