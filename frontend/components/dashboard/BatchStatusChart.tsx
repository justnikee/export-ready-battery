"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BatchStatusChartProps {
    ready: number
    processing: number
    completed: number
}

const COLORS = ['#10b981', '#8b5cf6', '#64748b'];

export function BatchStatusChart({ ready, processing, completed }: BatchStatusChartProps) {
    const data = [
        { name: 'Ready', value: ready },
        { name: 'Processing', value: processing },
        { name: 'Completed', value: completed },
    ];

    // Filter out zero values
    const activeData = data.filter(d => d.value > 0);

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Batch Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                {/* Donut Chart */}
                <div className="h-[120px] w-[120px] relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={activeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {activeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#e4e4e7' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Total Center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold">{ready + processing + completed}</span>
                    </div>
                </div>

                {/* Legend (Right Side) */}
                <div className="space-y-2 flex-1 min-w-0">
                    {data.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index] }} />
                                <span className="text-zinc-400 truncate">{item.name}</span>
                            </div>
                            <span className="font-bold text-zinc-200">{item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
