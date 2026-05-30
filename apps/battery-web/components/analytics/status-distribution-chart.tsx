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
  "#059669", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#84cc16", // lime
];

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
      <div className="text-center py-8 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="h-[160px] w-[160px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {activeData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "6px",
                boxShadow: "none",
                color: "var(--popover-foreground)",
              }}
              itemStyle={{ color: "var(--foreground)" }}
              formatter={(value, name) => [value, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {showTotal && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2 w-full">
        {activeData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-muted-foreground capitalize">
                {item.name.replace(/_/g, " ")}
              </span>
            </div>
            <span className="text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
