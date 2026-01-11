"use client"

import Link from "next/link"
import { Download, ExternalLink, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

// Mock type for component props
interface Batch {
    id: string
    name: string
    units: number
    status: string
    progress?: number
    created_at_relative: string
}

interface RecentBatchesTableProps {
    batches: Batch[]
}

export function RecentBatchesTable({ batches }: RecentBatchesTableProps) {

    const getStatusColor = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'PROCESSING': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            case 'READY': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default: return 'bg-zinc-800 text-zinc-400'
        }
    }

    const getProgress = (batch: Batch) => {
        if (batch.progress !== undefined) return batch.progress;
        const s = batch.status.toUpperCase();
        switch (s) {
            case 'COMPLETED': return 100
            case 'PROCESSING': return 60 // Default if unknown
            case 'READY': return 100
            default: return 0
        }
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Batches</CardTitle>
                <Link href="/batches" className="text-xs text-purple-500 hover:text-purple-400 font-medium">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-3">Batch Name</th>
                                <th className="px-6 py-3">Units</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 w-32">Progress</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-purple-600 flex items-center justify-center text-xs font-bold uppercase text-white">
                                            {batch.name.substring(0, 2)}
                                        </div>
                                        {batch.name}
                                    </td>
                                    <td className="px-6 py-4">{batch.units}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(batch.status)}`}>
                                            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1).toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Progress value={getProgress(batch)} className="h-1.5 bg-zinc-800" indicatorClassName={batch.status === 'PROCESSING' ? 'bg-purple-500' : 'bg-emerald-500'} />
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{batch.created_at_relative}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <a href={`/api/v1/batches/${batch.id}/download?format=csv`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                            <Link href={`/batches/${batch.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
