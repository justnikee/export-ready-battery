"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"

interface CountryChartProps {
    data: { country: string; count: number }[]
}

const COLORS = [
    "#8b5cf6", // purple
    "#6366f1", // indigo
    "#3b82f6", // blue
    "#0ea5e9", // sky
    "#14b8a6", // teal
    "#10b981", // emerald
    "#22c55e", // green
    "#84cc16", // lime
    "#eab308", // yellow
    "#f97316", // orange
]

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
                        stroke="#cbd5e1"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                        dataKey="country"
                        type="category"
                        stroke="#cbd5e1"
                        tick={{ fill: "#334155", fontSize: 12 }}
                        width={80}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            color: "#0f172a",
                        }}
                        formatter={(value) => [`${value ?? 0} scans`, "Count"]}
                        labelStyle={{ color: "#475569" }}
                    />
                    <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                    >
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
    )
}
