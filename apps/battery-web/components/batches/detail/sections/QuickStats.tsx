"use client";

import { Battery, Shield, AlertTriangle, Globe } from "lucide-react";
import type { Batch } from "@/lib/types";
import { StatCard } from "../StatCard";

interface QuickStatsProps {
  batch: Batch;
  passportCount: number;
}

export function QuickStats({ batch, passportCount }: QuickStatsProps) {
  const dva = batch.domestic_value_add;
  const hasDva = dva !== undefined && dva !== null && dva > 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Passports"
        value={passportCount.toLocaleString()}
        icon={<Battery className="h-4 w-4" />}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      />
      <StatCard
        label="Compliance"
        value={`${batch.compliance_score ?? "--"}%`}
        icon={<Shield className="h-4 w-4" />}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-500/10"
      />
      <StatCard
        label={hasDva ? "DVA" : "Region"}
        value={hasDva ? `${dva}%` : batch.market_region}
        icon={<Globe className="h-4 w-4" />}
        iconColor="text-amber-500"
        iconBg="bg-amber-500/10"
      />
      <StatCard
        label="Gaps"
        value={(
          batch.compliance_score !== undefined &&
          batch.compliance_score !== null &&
          batch.compliance_score < 100
            ? 1
            : 0
        ).toString()}
        icon={<AlertTriangle className="h-4 w-4" />}
        iconColor="text-rose-500"
        iconBg="bg-rose-500/10"
      />
    </div>
  );
}
