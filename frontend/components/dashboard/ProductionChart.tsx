"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ProductionChartProps {
    data: { name: string; value: number }[]
}

export function ProductionChart({ data }: ProductionChartProps) {
    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            borderColor: 'var(--border)',
                            borderRadius: '6px',
                            boxShadow: 'none',
                            color: 'var(--popover-foreground)',
                        }}
                        itemStyle={{ color: 'var(--foreground)' }}
                        labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 500 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
