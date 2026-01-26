"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    subtext?: string
    trend?: string
    isPositive?: boolean
}

export function StatsCard({ title, value, subtext, trend, isPositive }: StatsCardProps) {
    return (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 transition-all duration-200 hover:border-slate-700 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</CardTitle>
                {trend && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trend}
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div className="stat-value text-3xl font-bold tracking-tight">{value}</div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500 leading-relaxed">{subtext}</p>
                    <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-teal-400 transition-colors duration-200" />
                </div>
            </CardContent>
        </Card>
    )
}
