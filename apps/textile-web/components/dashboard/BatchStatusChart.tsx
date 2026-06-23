"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface BatchStatusChartProps {
  ready: number;
  processing: number;
  completed: number;
}

const COLORS = ["#3ecf8e", "#a78bfa", "#fb923c"];

export function BatchStatusChart({
  ready,
  processing,
  completed,
}: BatchStatusChartProps) {
  const data = [
    { name: "Ready", value: ready },
    { name: "Processing", value: processing },
    { name: "Completed", value: completed },
  ];

  const total = ready + processing + completed;
  const activeData = data.filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center">
      {/* Donut Chart */}
      <div className="h-[160px] w-[160px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                activeData.length > 0
                  ? activeData
                  : [{ name: "None", value: 1 }]
              }
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {activeData.length > 0 ? (
                activeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[data.findIndex((d) => d.name === entry.name)]}
                  />
                ))
              ) : (
                <Cell fill="var(--border)" />
              )}
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
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Total Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 w-full">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className=" text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
