"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react"

interface ScanStatsCardProps {
    icon: ReactNode
    label: string
    value: number
    iconColor: string
    bgColor: string
}

export function ScanStatsCard({ icon, label, value, iconColor, bgColor }: ScanStatsCardProps) {
    return (
        <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${bgColor}`}>
                        <div className={iconColor}>{icon}</div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">
                            {value.toLocaleString()}
                        </p>
                        <p className="text-sm text-zinc-400">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
