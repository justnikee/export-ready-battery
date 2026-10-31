"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EPRComplianceTrackerProps {
  claimedValue?: number;
  eligibleValue?: number;
}

export function EPRComplianceTracker({
  claimedValue = 0,
  eligibleValue = 0,
}: EPRComplianceTrackerProps) {
  const hasData = claimedValue > 0 || eligibleValue > 0;
  const fulfillmentPct =
    eligibleValue > 0
      ? Math.min(100, Math.round((claimedValue / eligibleValue) * 100))
      : 0;

  return (
    <Card className="bg-card/70 backdrop-blur-md border border-border/80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-4 w-4" />
            </div>
            <span>India EPR ledger</span>
          </div>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            Not a CPCB filing
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Claimed vs eligible (tenant ledger)
            </span>
            <span className="font-bold text-foreground">
              {hasData ? `${fulfillmentPct}%` : "—"}
            </span>
          </div>
          <Progress value={hasData ? fulfillmentPct : 0} className="h-2 bg-muted" />
          <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>Claimed: {claimedValue}</span>
            <span>Eligible: {eligibleValue || "—"}</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Annual Form 3 is filed on the CPCB Battery EPR portal. This card
            shows numbers stored in Anviora only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
