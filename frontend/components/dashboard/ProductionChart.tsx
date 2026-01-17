"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductionChartProps {
    data: { name: string; value: number }[]
}

export function ProductionChart({ data }: ProductionChartProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Production Overview</CardTitle>
                    <p className="text-xs text-zinc-500">Passport generation over time</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 cursor-pointer">7D</Badge>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 cursor-pointer">30D</Badge>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 cursor-pointer">90D</Badge>
                </div>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[435px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
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
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                itemStyle={{ color: '#e4e4e7' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
