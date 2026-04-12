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
 <Card className="bg-card border-border hover:border-[var(--border-prominent)] transition-colors cursor-pointer group">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="code-label">{title}</CardTitle>
 {trend && (
 <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
 {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
 {trend}
 </span>
 )}
 </CardHeader>
 <CardContent>
 <div className="stat-value text-3xl tracking-tight text-foreground">{value}</div>
 <div className="flex items-center justify-between mt-2">
 <p className="text-xs text-muted-foreground leading-relaxed">{subtext}</p>
 <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-[var(--brand)] transition-colors duration-200" />
 </div>
 </CardContent>
 </Card>
 )
}

