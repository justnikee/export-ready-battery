"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusItem {
  name: string;
  value: number;
}

interface StatusDistributionChartProps {
  data: StatusItem[];
  colors?: string[];
  showTotal?: boolean;
  emptyMessage?: string;
}

const DEFAULT_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border/80 px-2.5 py-1.5 rounded text-xs shadow-xl flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: item.color || item.payload.fill }}
        />
        <span className="text-muted-foreground capitalize">
          {String(item.name).replace(/_/g, " ")}:
        </span>
        <span className="font-bold text-foreground">{item.value}</span>
      </div>
    );
  }
  return null;
}

export function StatusDistributionChart({
  data,
  colors = DEFAULT_COLORS,
  showTotal = true,
  emptyMessage = "No data available",
}: StatusDistributionChartProps) {
  const activeData = data.filter((d) => d.value > 0);
  const total = activeData.reduce((sum, d) => sum + d.value, 0);

  if (activeData.length === 0) {
    return (
      <div className="text-center py-8 text-xs font-medium text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="h-[150px] w-[150px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {activeData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {showTotal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold tracking-tight text-foreground">
              {total}
            </span>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Total
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5 w-full border-t border-border/40 pt-3">
        {activeData.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-muted-foreground capitalize truncate">
                  {item.name.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-foreground">{item.value}</span>
                <span className="text-[10px] text-muted-foreground/80">
                  ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
