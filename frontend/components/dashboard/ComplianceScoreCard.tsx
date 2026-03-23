"use client"

import { useEffect, useState } from "react"
import { Shield, AlertTriangle, CheckCircle } from "lucide-react"
import api from "@/lib/api"
import type { Batch, ComplianceGap } from "@/lib/types"

interface ComplianceData {
    batch_id: string
    compliance_score: number
    compliance_gaps: ComplianceGap[]
}

interface ComplianceScoreCardProps {
    batches: Batch[]
}

export function ComplianceScoreCard({ batches }: ComplianceScoreCardProps) {
    const [avgScore, setAvgScore] = useState<number | null>(null)
    const [totalGaps, setTotalGaps] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const activeBatches = batches.filter(b => b.status === "ACTIVE")
        if (activeBatches.length === 0) {
            setAvgScore(null)
            setLoading(false)
            return
        }

        const fetchCompliance = async () => {
            try {
                const results = await Promise.allSettled(
                    activeBatches.slice(0, 10).map(b =>
                        api.get<ComplianceData>(`/batches/${b.id}/compliance`)
                    )
                )

                let scoreSum = 0
                let scoreCount = 0
                let gaps = 0

                results.forEach(r => {
                    if (r.status === "fulfilled" && r.value.data.compliance_score > 0) {
                        scoreSum += r.value.data.compliance_score
                        scoreCount++
                        gaps += (r.value.data.compliance_gaps?.length ?? 0)
                    }
                })

                setAvgScore(scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null)
                setTotalGaps(gaps)
            } catch {
                console.warn("Compliance data unavailable")
            } finally {
                setLoading(false)
            }
        }

        fetchCompliance()
    }, [batches])

    const scoreColor = avgScore === null ? "text-slate-400"
        : avgScore >= 80 ? "text-emerald-600"
            : avgScore >= 50 ? "text-amber-500"
                : "text-red-500"

    const barColor = avgScore === null ? "bg-slate-200"
        : avgScore >= 80 ? "bg-emerald-500"
            : avgScore >= 50 ? "bg-amber-500"
                : "bg-red-500"

    const StatusIcon = avgScore === null ? Shield
        : avgScore >= 80 ? CheckCircle
            : AlertTriangle

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compliance</span>
                <StatusIcon className={`h-4 w-4 ${scoreColor}`} />
            </div>

            {loading ? (
                <div className="h-8 bg-slate-100 rounded animate-pulse" />
            ) : avgScore === null ? (
                <>
                    <div className="text-2xl font-semibold text-slate-400">—</div>
                    <div className="text-xs text-slate-500 mt-2">No active batches</div>
                </>
            ) : (
                <>
                    <div className={`text-2xl font-semibold ${scoreColor}`}>{avgScore}%</div>
                    <div className="w-full bg-slate-100 rounded h-1.5 mt-2">
                        <div className={`h-1.5 rounded ${barColor}`} style={{ width: `${avgScore}%` }} />
                    </div>
                    {totalGaps > 0 && (
                        <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {totalGaps} gap{totalGaps !== 1 ? "s" : ""} to resolve
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
