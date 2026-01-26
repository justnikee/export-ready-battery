"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductionChartProps {
    data: { name: string; value: number }[]
}

export function ProductionChart({ data }: ProductionChartProps) {
    return (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Production Overview</CardTitle>
                    <p className="text-xs text-slate-500">Passport generation over time</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-800 cursor-pointer">7D</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-600 hover:text-slate-400 hover:bg-slate-800 cursor-pointer">30D</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-600 hover:text-slate-400 hover:bg-slate-800 cursor-pointer">90D</Badge>
                </div>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[435px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#52525b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                domain={[0, 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
