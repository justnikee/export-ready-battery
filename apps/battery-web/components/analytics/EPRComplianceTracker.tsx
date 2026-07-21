"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, ShieldCheck, AlertCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EPRComplianceTrackerProps {
  claimedValue?: number;
  eligibleValue?: number;
}

export function EPRComplianceTracker({
  claimedValue = 0,
  eligibleValue = 0,
}: EPRComplianceTrackerProps) {
  // Calculated EPR recycling fulfillment percentage (simulated target for current FY)
  const targetTonnage = 1250; // Tonnes
  const recycledTonnage = 940; // Tonnes
  const fulfillmentPct = Math.min(
    100,
    Math.round((recycledTonnage / targetTonnage) * 100),
  );

  return (
    <Card className="bg-card/70 backdrop-blur-md border border-border/80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-4 w-4" />
            </div>
            <span>India EPR Compliance Position</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
            CPCB Registered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Annual BWM Target Progress Bar */}
        <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Annual Recycling Target (FY 2025–26)
            </span>
            <span className="font-bold text-emerald-500">{fulfillmentPct}%</span>
          </div>
          <Progress value={fulfillmentPct} className="h-2 bg-muted" />
          <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>Progress: {recycledTonnage} MT</span>
            <span>Target: {targetTonnage} MT</span>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-1">
            <span className="text-muted-foreground text-[11px]">ECC Status</span>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-500 text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Compliant</span>
            </div>
            <p className="text-[10px] text-muted-foreground">No pending deficit</p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-1">
            <span className="text-muted-foreground text-[11px]">Penalty Exposure</span>
            <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
              <span>₹0</span>
            </div>
            <p className="text-[10px] text-emerald-500 font-medium">₹0 shortfall liability</p>
          </div>
        </div>

        {/* Certificate Verification Reminder */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            CPCB quarterly EPR return filing deadline is in <strong>18 days</strong>. Ensure all recycler certificates are uploaded.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
