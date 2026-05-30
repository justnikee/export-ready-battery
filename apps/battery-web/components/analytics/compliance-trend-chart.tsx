"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ComplianceTrendPoint {
  period: string;
  avg_score: number;
  batch_count: number;
}

interface ComplianceTrendChartProps {
  data: ComplianceTrendPoint[];
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No compliance data available yet. Create batches to see trends.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              borderColor: "var(--border)",
              borderRadius: "6px",
              boxShadow: "none",
              color: "var(--popover-foreground)",
            }}
            itemStyle={{ color: "var(--foreground)" }}
            labelStyle={{ color: "var(--muted-foreground)", fontWeight: 500 }}
            formatter={(value, name) => {
              if (name === "avg_score") return [`${value}%`, "Avg Score"];
              return [value, name];
            }}
          />
          <Area
            type="monotone"
            dataKey="avg_score"
            stroke="#059669"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCompliance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
