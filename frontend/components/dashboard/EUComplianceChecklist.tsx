"use client"

import { useEffect, useState } from "react"
import { Shield, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Loader2 } from "lucide-react"
import api from "@/lib/api"
import Link from "next/link"
import type { Batch } from "@/lib/types"

interface EUAttribute {
    id: string
    name: string
    category: string
    reg_ref: string
    filled: boolean
}

interface EUScoreData {
    batch_id: string
    score: number
    filled: number
    total: number
    attributes: EUAttribute[]
}

interface EUComplianceWidgetProps {
    batches: Batch[]
}

export function EUComplianceChecklist({ batches }: EUComplianceWidgetProps) {
    const [scoreData, setScoreData] = useState<EUScoreData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

    // Pick first EU/GLOBAL active batch
    const euBatches = batches.filter(
        b => (b.market_region === "EU" || b.market_region === "GLOBAL") && b.status === "ACTIVE"
    )

    useEffect(() => {
        const targetBatch = selectedBatchId
            ? euBatches.find(b => b.id === selectedBatchId)
            : euBatches[0]

        if (!targetBatch) {
            setLoading(false)
            return
        }

        setSelectedBatchId(targetBatch.id)

        const fetchScore = async () => {
            try {
                const res = await api.get<EUScoreData>(`/batches/${targetBatch.id}/eu-attribute-score`)
                setScoreData(res.data)
            } catch {
                console.warn("EU attribute score not available")
            } finally {
                setLoading(false)
            }
        }
        fetchScore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBatchId, batches])

    if (euBatches.length === 0) {
        return null // Don't show widget if no EU batches
    }

    // Group missing attributes by category
    const missingByCategory: Record<string, EUAttribute[]> = {}
    if (scoreData?.attributes) {
        scoreData.attributes.filter(a => !a.filled).forEach(a => {
            if (!missingByCategory[a.category]) missingByCategory[a.category] = []
            missingByCategory[a.category].push(a)
        })
    }

    const scoreColor = !scoreData ? "text-slate-400"
        : scoreData.score >= 80 ? "text-emerald-600"
            : scoreData.score >= 50 ? "text-amber-500"
                : "text-red-500"

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        EU Battery Passport Checklist
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        BatteryPass consortium attribute coverage
                    </p>
                </div>
                {euBatches.length > 1 && (
                    <select
                        className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600"
                        value={selectedBatchId || ""}
                        onChange={(e) => { setSelectedBatchId(e.target.value); setLoading(true) }}
                    >
                        {euBatches.map(b => (
                            <option key={b.id} value={b.id}>{b.batch_name || b.model_name}</option>
                        ))}
                    </select>
                )}
            </div>
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : !scoreData ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                        EU attribute scoring not available for this batch
                    </p>
                ) : (
                    <>
                        {/* Score Summary */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`text-3xl font-bold ${scoreColor}`}>
                                {Math.round(scoreData.score)}%
                            </div>
                            <div className="text-sm text-slate-600">
                                <span className="font-medium">{scoreData.filled}</span> of{" "}
                                <span className="font-medium">{scoreData.total}</span> attributes filled
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                            <div
                                className={`h-2 rounded-full transition-all ${
                                    scoreData.score >= 80 ? "bg-emerald-500" : scoreData.score >= 50 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${scoreData.score}%` }}
                            />
                        </div>

                        {/* Missing attributes by category */}
                        {Object.keys(missingByCategory).length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {Object.entries(missingByCategory).map(([category, attrs]) => (
                                    <div key={category}>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                                            <XCircle className="h-3 w-3 text-red-400" />
                                            {category} — {attrs.length} missing
                                        </div>
                                        <div className="flex flex-wrap gap-1 ml-4">
                                            {attrs.map(a => (
                                                <span key={a.id} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                                    {a.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                All EU attributes are filled!
                            </div>
                        )}

                        {/* Feb 2027 deadline */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                EU Battery Regulation deadline: Feb 18, 2027
                            </div>
                            {selectedBatchId && (
                                <Link
                                    href={`/batches/${selectedBatchId}`}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                    Fix gaps <ChevronRight className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
