"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ShieldCheck } from "lucide-react";

interface ComplianceTrendPoint {
  period: string;
  avg_score: number;
  batch_count: number;
}

interface ComplianceTrendChartProps {
  data: ComplianceTrendPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const point: ComplianceTrendPoint = payload[0].payload;
    const score = point.avg_score;
    const isOptimal = score >= 80;

    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[140px]">
        <p className="font-semibold text-foreground border-b border-border/50 pb-1">
          {label}
        </p>
        <div className="flex items-center justify-between text-muted-foreground pt-0.5">
          <span>Avg Score:</span>
          <span className="font-bold text-foreground">{score}%</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Batches:</span>
          <span className="font-medium text-foreground">{point.batch_count}</span>
        </div>
        <div className="pt-1">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              isOptimal
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            {isOptimal ? "Target Met (≥80%)" : "Needs Review (<80%)"}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground space-y-2">
        <ShieldCheck className="h-8 w-8 text-emerald-500/50" />
        <span>No compliance trend data available yet.</span>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorComplianceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#059669" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.3}
            vertical={false}
          />

          <XAxis
            dataKey="period"
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
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />

          <ReferenceLine
            y={80}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{
              value: "80% Target",
              fill: "#10b981",
              fontSize: 10,
              position: "insideTopRight",
            }}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(16, 185, 129, 0.3)", strokeDasharray: "3 3" }}
          />

          <Area
            type="monotone"
            dataKey="avg_score"
            stroke="#10b981"
            strokeWidth={2.5}
            activeDot={{
              r: 6,
              fill: "#10b981",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            fillOpacity={1}
            fill="url(#colorComplianceGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
