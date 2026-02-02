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
        <Card className="bg-white border-slate-200 text-slate-900 transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</CardTitle>
                {trend && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {trend}
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div className="stat-value text-3xl font-bold tracking-tight text-slate-900">{value}</div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500 leading-relaxed">{subtext}</p>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
                </div>
            </CardContent>
        </Card>
    )
}

