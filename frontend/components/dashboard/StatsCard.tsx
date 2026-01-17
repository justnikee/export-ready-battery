"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    subtext?: string
    trend?: string
    isPositive?: boolean
}

export function StatsCard({ title, value, subtext, trend, isPositive }: StatsCardProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</CardTitle>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded bg-zinc-800 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trend}
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-zinc-500">{subtext}</p>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </div>
            </CardContent>
        </Card>
    )
}
