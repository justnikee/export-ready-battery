"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  type LegendPayload,
} from "recharts";

interface DeviceChartProps {
  data: { device: string; count: number }[];
}

const DEVICE_COLORS: Record<string, string> = {
  Mobile: "#3ecf8e", // brand
  Desktop: "#2db87a", // brand dark
  Tablet: "#5ae4a8", // brand light
  Bot: "#1a9e63", // deep green
  Unknown: "#898989", // muted
};

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

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d0d0d",
              border: "1px solid #222225",
              borderRadius: "0px",
              color: "#fafafa",
            }}
            formatter={(value, name) => [`${value ?? 0} scans`, String(name)]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry: LegendPayload) => {
              const percentage =
                (entry.payload as { percentage?: string } | undefined)
                  ?.percentage ?? "0.0";
              return (
                <span className="text-foreground text-sm">
                  {value}{" "}
                  <span className="text-muted-foreground">({percentage}%)</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
