"use client"

import Link from "next/link"
import { Download, Globe } from "lucide-react"
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

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase() || 'DRAFT'
        if (s === 'ACTIVE' || s === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Draft
            </span>
        )
    }

    const getMarketFlag = (region?: string) => {
        if (region === 'INDIA') return '🇮🇳'
        if (region === 'EU') return '🇪🇺'
        return null
    }

    const getSpecs = (batch: Batch) => {
        const chemistry = batch.specs?.chemistry || 'Li-ion'
        const voltage = batch.specs?.voltage || '48'
        return `${chemistry} • ${voltage}V`
    }

    const isActive = (status: string) => {
        const s = status?.toUpperCase() || 'DRAFT'
        return s === 'ACTIVE' || s === 'COMPLETED'
    }

    const handleDownload = (batchId: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
        window.open(`${apiUrl}/batches/${batchId}/labels?tenant_id=${user?.tenant_id}`, '_blank')
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Recent Batches</CardTitle>
                <Link href="/batches" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                    View all →
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <table className="w-full text-sm">
                        <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-900/80 border-b border-zinc-800">
                            <tr>
                                <th className="px-4 py-2.5 text-left font-medium w-10"></th>
                                <th className="px-4 py-2.5 text-left font-medium">Batch</th>
                                <th className="px-4 py-2.5 text-left font-medium">Volume</th>
                                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                                <th className="px-4 py-2.5 text-right font-medium w-16">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {batches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-xs">
                                        No batches yet
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr
                                        key={batch.id}
                                        className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                                        onClick={() => window.location.href = `/batches/${batch.id}`}
                                    >
                                        {/* Market Flag */}
                                        <td className="px-4 py-3">
                                            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm">
                                                {getMarketFlag(batch.market_region) || <Globe className="h-3.5 w-3.5 text-zinc-500" />}
                                            </div>
                                        </td>

                                        {/* Batch Info */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate max-w-[180px]">
                                                    {batch.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                                    {getSpecs(batch)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Volume */}
                                        <td className="px-4 py-3">
                                            <span className="text-zinc-300 font-medium">{batch.units}</span>
                                            <span className="text-zinc-500 ml-1">Units</span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {getStatusBadge(batch.status)}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-7 w-7 ${isActive(batch.status) ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
                                                disabled={!isActive(batch.status)}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (isActive(batch.status)) {
                                                        handleDownload(batch.id)
                                                    }
                                                }}
                                                title={isActive(batch.status) ? "Download Labels" : "Activate batch to download"}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
