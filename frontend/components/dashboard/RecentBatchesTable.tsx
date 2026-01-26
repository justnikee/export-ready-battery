"use client"

import Link from "next/link"
import { Download, ArrowUpRight, Globe, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

interface Batch {
    id: string
    name: string
    units: number
    status: string
    specs?: {
        chemistry?: string
        voltage?: number | string
        capacity?: string
    }
    market_region?: string
    created_at_relative: string
}

interface RecentBatchesTableProps {
    batches: Batch[]
}

export function RecentBatchesTable({ batches }: RecentBatchesTableProps) {
    const { user } = useAuth()

    const isActive = (status: string) => {
        const s = status?.toUpperCase() || 'DRAFT'
        return s === 'ACTIVE' || s === 'COMPLETED'
    }

    const handleDownload = (batchId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
        window.open(`${apiUrl}/batches/${batchId}/labels?tenant_id=${user?.tenant_id}`, '_blank')
    }

    return (
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 h-full">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-slate-800">
                <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">
                    Recent Batches
                </CardTitle>
                <Link
                    href="/batches"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                    View all
                    <ArrowUpRight className="h-3 w-3" />
                </Link>
            </CardHeader>

            <CardContent className="p-0">
                {/* Table header */}
                <div className="flex items-center px-5 py-2.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800/50">
                    <span className="flex-1">Batch</span>
                    <span className="w-20 text-right">Volume</span>
                    <span className="w-20 text-center">Status</span>
                    <span className="w-10"></span>
                </div>

                {batches.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-sm">
                        No batches created yet
                    </div>
                ) : (
                    <div>
                        {batches.map((batch, idx) => (
                            <div
                                key={batch.id}
                                className={`flex items-center px-5 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer group ${idx !== batches.length - 1 ? 'border-b border-slate-800/30' : ''
                                    }`}
                                onClick={() => window.location.href = `/batches/${batch.id}`}
                            >
                                {/* Batch Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {batch.market_region === 'INDIA' ? (
                                        <span className="fi fi-in text-base rounded shrink-0" />
                                    ) : batch.market_region === 'EU' ? (
                                        <span className="fi fi-eu text-base rounded shrink-0" />
                                    ) : (
                                        <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-100 group-hover:text-white truncate text-sm">
                                            {batch.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {batch.specs?.chemistry || 'Li-ion'} · {batch.specs?.voltage || '48'}V
                                        </p>
                                    </div>
                                </div>

                                {/* Volume */}
                                <div className="w-20 text-right shrink-0">
                                    <span className="text-sm font-semibold text-white">{batch.units}</span>
                                    <span className="text-xs text-slate-500 ml-1">units</span>
                                </div>

                                {/* Status Badge */}
                                <div className="w-20 flex justify-center shrink-0">
                                    {isActive(batch.status) ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-400 border border-slate-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                            Draft
                                        </span>
                                    )}
                                </div>

                                {/* Action */}
                                <div className="w-10 flex justify-center shrink-0">
                                    {isActive(batch.status) ? (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                                            onClick={(e) => handleDownload(batch.id, e)}
                                            title="Download Labels"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
