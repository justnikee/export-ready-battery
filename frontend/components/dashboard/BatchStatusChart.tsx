"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BatchStatusChartProps {
    ready: number
    processing: number
    completed: number
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

export function BatchStatusChart({ ready, processing, completed }: BatchStatusChartProps) {
    const data = [
        { name: 'Ready', value: ready },
        { name: 'Processing', value: processing },
        { name: 'Completed', value: completed },
    ];

    const total = ready + processing + completed;
    const activeData = data.filter(d => d.value > 0);

    return (
        <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div className="h-[160px] w-[160px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData.length > 0 ? activeData : [{ name: 'None', value: 1 }]}
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
                                    <Cell key={`cell-${index}`} fill={COLORS[data.findIndex(d => d.name === entry.name)]} />
                                ))
                            ) : (
                                <Cell fill="#e2e8f0" />
                            )}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#e2e8f0',
                                borderRadius: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            itemStyle={{ color: '#334155' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Total Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{total}</span>
                    <span className="text-xs text-slate-500">Total</span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2 w-full">
                {data.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                            <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
