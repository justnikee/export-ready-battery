"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

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
        percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
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
                            backgroundColor: "#18181b",
                            border: "1px solid #27272a",
                            borderRadius: "8px",
                            color: "#fff",
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
                        formatter={(value, entry: any) => (
                            <span className="text-zinc-300 text-sm">
                                {value}{" "}
                                <span className="text-zinc-500">
                                    ({entry.payload?.percentage}%)
                                </span>
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
