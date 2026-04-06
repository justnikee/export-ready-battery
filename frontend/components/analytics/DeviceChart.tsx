"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, type LegendPayload } from "recharts"

interface DeviceChartProps {
    data: { device: string; count: number }[]
}

const DEVICE_COLORS: Record<string, string> = {
    Mobile: "#10b981",    // emerald
    Desktop: "#3b82f6",   // blue
    Tablet: "#f97316",    // orange
    Bot: "#6b7280",       // gray
    Unknown: "#52525b",   // zinc
}

export function DeviceChart({ data }: DeviceChartProps) {
    // Calculate total for percentage
    const total = data.reduce((sum, item) => sum + item.count, 0)

    // Transform data with colors
    const chartData = data.map((item) => ({
        name: item.device,
        value: item.count,
        color: DEVICE_COLORS[item.device] || DEVICE_COLORS.Unknown,
        percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0",
    }))

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
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            color: "#0f172a",
                        }}
                        formatter={(value, name) => [
                            `${value ?? 0} scans`,
                            String(name),
                        ]}
                    />
                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        formatter={(value, entry: LegendPayload) => {
                            const percentage = (entry.payload as { percentage?: string } | undefined)?.percentage ?? "0.0"
                            return (
                                <span className="text-slate-700 text-sm">
                                    {value}{" "}
                                    <span className="text-slate-400">
                                        ({percentage}%)
                                    </span>
                                </span>
                            )
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
