"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CreditCard } from "lucide-react"
import Link from "next/link"

interface QuotaCardProps {
 used: number
 limit: number
}

export function QuotaCard({ used, limit }: QuotaCardProps) {
 const percentage = Math.min((used / limit) * 100, 100)
 const isOverLimit = used > limit
 const isLow = percentage >= 80

 return (
 <Card className="bg-card border-border">
 <CardHeader className="pb-2">
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg ">Passport Quota</CardTitle>
 <Link
 href="/billing"
 className="text-xs text-[var(--brand)] hover:text-[var(--brand)]/80 flex items-center gap-1 transition-colors font-medium"
 >
 <CreditCard className="h-3 w-3" />
 Buy More
 </Link>
 </div>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex justify-between items-end">
 <div>
 <p className="text-xs text-muted-foreground mb-1">Used</p>
 <p className="text-2xl ">{used.toLocaleString()}</p>
 </div>
 <div className="text-right">
 <p className="text-xs text-muted-foreground mb-1">Limit</p>
 <p className="text-2xl ">{limit.toLocaleString()}</p>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-xs">
 <span className="text-muted-foreground">Usage</span>
 <span className={percentage >= 90 ? "text-red-500" : "text-emerald-500"}>{percentage.toFixed(1)}%</span>
 </div>
 <Progress value={percentage} className="h-2 bg-muted" indicatorClassName={percentage >= 90 ? "bg-red-500/100" : "bg-emerald-500/100"} />
 </div>

 {isOverLimit && (
 <Link href="/billing" className="block">
 <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-between text-xs text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer">
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-4 w-4" />
 Over limit by {used - limit} passports
 </div>
 <span className="text-red-400 font-medium">Top Up →</span>
 </div>
 </Link>
 )}
 {!isOverLimit && isLow && (
 <Link href="/billing" className="block">
 <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center justify-between text-xs text-yellow-500 hover:bg-yellow-500/20 transition-colors cursor-pointer">
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-4 w-4" />
 Approaching plan limit
 </div>
 <span className="text-yellow-400 font-medium">Upgrade →</span>
 </div>
 </Link>
 )}
 </CardContent>
 </Card>
 )
}
