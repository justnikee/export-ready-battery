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

interface CountryChartProps {
  data: { country: string; count: number }[];
}

const COLORS = [
  "#3ecf8e", // brand
  "#2db87a", // brand dark
  "#5ae4a8", // brand light
  "#1a9e63", // deep green
  "#7eedc0", // mint
  "#0d7a4a", // forest
  "#a3f0d0", // pale mint
  "#25c97a", // mid green
  "#4fd49a", // soft green
  "#10b981", // emerald
];

export function CountryChart({ data }: CountryChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <XAxis
            type="number"
            stroke="#222225"
            tick={{ fill: "#898989", fontSize: 12 }}
          />
          <YAxis
            dataKey="country"
            type="category"
            stroke="#222225"
            tick={{ fill: "#898989", fontSize: 12 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d0d0d",
              border: "1px solid #222225",
              borderRadius: "0px",
              color: "#fafafa",
            }}
            formatter={(value) => [`${value ?? 0} scans`, "Count"]}
            labelStyle={{ color: "#898989" }}
          />
          <Bar dataKey="count" radius={[0, 0, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
