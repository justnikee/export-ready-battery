"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Smartphone } from "lucide-react";

interface DeviceChartProps {
  data: { device: string; count: number }[];
}

const DEVICE_COLORS: Record<string, string> = {
  Mobile: "#10b981", // emerald
  Desktop: "#3b82f6", // blue
  Tablet: "#8b5cf6", // purple
  Bot: "#f59e0b", // amber
  Unknown: "#6b7280", // gray
};

function CustomDeviceTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/80 p-2.5 rounded text-xs shadow-xl space-y-1">
        <p className="font-semibold text-foreground border-b border-border/50 pb-1 flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name} Device
        </p>
        <div className="flex items-center justify-between gap-3 text-muted-foreground pt-0.5">
          <span>Scans:</span>
          <span className="font-bold text-foreground">{item.value}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span>Percentage:</span>
          <span className="font-medium text-emerald-400">{item.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export function DeviceChart({ data }: DeviceChartProps) {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Transform data with colors
  const chartData = data.map((item) => ({
    name: item.device,
    value: item.count,
    color: DEVICE_COLORS[item.device] || DEVICE_COLORS.Unknown,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0",
  }));

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground space-y-2">
        <Smartphone className="h-8 w-8 text-amber-500/50" />
        <span>No device scan data available.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-[250px] w-full p-2">
      {/* Left Container: Perfectly Centered Donut Pie Chart & Center Text */}
      <div className="relative h-full aspect-square shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-opacity duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomDeviceTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count Overlay — Dead Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Scans
          </span>
        </div>
      </div>

      {/* Right Container: Custom Legend Breakdown List */}
      <div className="flex-1 space-y-2.5 w-full max-w-[220px] sm:border-l border-border/40 sm:pl-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/40">
          Device Breakdown
        </p>
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="font-semibold text-foreground">{item.value}</span>
              <span className="text-muted-foreground text-[10px]">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
