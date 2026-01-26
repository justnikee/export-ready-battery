"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BatchStatusChartProps {
    ready: number
    processing: number
    completed: number
}

const COLORS = ['#10b981', '#f59e0b', '#64748b'];

export function BatchStatusChart({ ready, processing, completed }: BatchStatusChartProps) {
    const data = [
        { name: 'Ready', value: ready },
        { name: 'Processing', value: processing },
        { name: 'Completed', value: completed },
    ];

    // Filter out zero values
    const activeData = data.filter(d => d.value > 0);

    return (
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
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
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                itemStyle={{ color: '#e2e8f0' }}
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
                                <span className="text-slate-400 truncate">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-200">{item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
