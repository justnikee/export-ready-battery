"use client";

import { DGFTValueSummary } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Landmark } from "lucide-react";

interface MoneyFunnelChartProps {
  data: DGFTValueSummary;
}

// Format currency in Indian Rupees
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

function CustomMoneyTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const eligible = payload.find((p: any) => p.dataKey === "Eligible")?.value || 0;
    const claimed = payload.find((p: any) => p.dataKey === "Claimed")?.value || 0;
    const realization = eligible > 0 ? ((claimed / eligible) * 100).toFixed(1) : "0.0";

    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-xl text-xs space-y-2 min-w-[170px]">
        <p className="font-semibold text-foreground border-b border-border/50 pb-1">
          {label} Scheme
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Eligible:
            </span>
            <span className="font-bold text-foreground">{formatCurrency(eligible)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Claimed:
            </span>
            <span className="font-bold text-emerald-500">{formatCurrency(claimed)}</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-border/40 flex items-center justify-between">
          <span className="text-muted-foreground">Realization Rate:</span>
          <span className="font-bold text-purple-400">{realization}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export function MoneyFunnelChart({ data }: MoneyFunnelChartProps) {
  const chartData = data.scheme_breakdown.map((s) => ({
    name: s.scheme,
    Claimed: s.claimed_value,
    Eligible: s.eligible_value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground space-y-2">
        <Landmark className="h-8 w-8 text-blue-500/50" />
        <span>No DGFT scheme incentive data available.</span>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="eligibleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="claimedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={5}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 10000000
                ? `₹${(v / 10000000).toFixed(1)}Cr`
                : `₹${(v / 100000).toFixed(1)}L`
            }
          />
          <Tooltip
            content={<CustomMoneyTooltip />}
            cursor={{ fill: "rgba(255, 255, 255, 0.04)", radius: 4 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
            iconType="circle"
          />
          <Bar
            dataKey="Eligible"
            fill="url(#eligibleGrad)"
            radius={[4, 4, 0, 0]}
            name="Eligible Incentives"
            maxBarSize={36}
          />
          <Bar
            dataKey="Claimed"
            fill="url(#claimedGrad)"
            radius={[4, 4, 0, 0]}
            name="Claimed Incentives"
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
