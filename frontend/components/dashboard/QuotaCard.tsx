"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle } from "lucide-react"

interface QuotaCardProps {
    used: number
    limit: number
}

export function QuotaCard({ used, limit }: QuotaCardProps) {
    const percentage = Math.min((used / limit) * 100, 100)
    const isOverLimit = used > limit

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Passport Quota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-zinc-400 mb-1">Used</p>
                        <p className="text-2xl font-bold">{used.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-zinc-400 mb-1">Limit</p>
                        <p className="text-2xl font-bold">{limit.toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Usage</span>
                        <span className={percentage >= 90 ? "text-red-500" : "text-emerald-500"}>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-zinc-800" indicatorClassName={percentage >= 90 ? "bg-red-500" : "bg-emerald-500"} />
                </div>

                {isOverLimit && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-xs text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        Over limit by {used - limit} passports
                    </div>
                )}
                {!isOverLimit && percentage >= 80 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-2 text-xs text-yellow-500">
                        <AlertTriangle className="h-4 w-4" />
                        Approaching plan limit. Upgrade advised.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
