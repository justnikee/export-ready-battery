"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { Globe } from "lucide-react";

interface CountryChartProps {
  data: { country: string; count: number }[];
}

const COLORS = [
  "#10b981", // emerald
  "#059669", // emerald dark
  "#34d399", // emerald light
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ec4899", // pink
];

function CustomCountryTooltip({ active, payload, totalScans }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const pct = totalScans > 0 ? ((item.count / totalScans) * 100).toFixed(1) : "0.0";
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/80 p-2.5 rounded text-xs shadow-xl space-y-1">
        <p className="font-semibold text-foreground border-b border-border/50 pb-1">
          {item.country}
        </p>
        <div className="flex items-center justify-between gap-3 text-muted-foreground pt-0.5">
          <span>Scans:</span>
          <span className="font-bold text-emerald-500">{item.count}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Share:</span>
          <span className="font-medium text-foreground">{pct}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export function CountryChart({ data }: CountryChartProps) {
  const totalScans = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground space-y-2">
        <Globe className="h-8 w-8 text-purple-500/50" />
        <span>No geographic scan data available.</span>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 25, left: 45, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="country"
            type="category"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip
            content={<CustomCountryTooltip totalScans={totalScans} />}
            cursor={{ fill: "rgba(255, 255, 255, 0.04)", radius: 4 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="transition-opacity duration-300 hover:opacity-80 cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
