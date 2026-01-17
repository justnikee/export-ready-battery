"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, Factory, Printer, Shield, Circle } from "lucide-react"

interface Activity {
    id: string
    type: 'CREATED' | 'DELETED' | 'COMPLETED' | 'WARNING' | 'SCAN' | 'BATCH_CREATE' | 'LABEL_PRINT' | 'DOC_UPLOAD'
    title: string
    description: string
    time: string
    sortTime?: number
}

interface ActivityFeedProps {
    activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {

    const getAuditData = (type: string, originalTitle: string) => {
        if (type === 'SCAN' || type === 'COMPLETED' || originalTitle.toLowerCase().includes('scan')) {
            return { icon: <Radar className="h-3.5 w-3.5" />, color: 'blue', formalTitle: 'Public QR Scan Detected' }
        }
        if (type === 'BATCH_CREATE' || type === 'CREATED' || originalTitle.toLowerCase().includes('batch')) {
            return { icon: <Factory className="h-3.5 w-3.5" />, color: 'emerald', formalTitle: 'Production Run Initialized' }
        }
        if (type === 'LABEL_PRINT' || originalTitle.toLowerCase().includes('label') || originalTitle.toLowerCase().includes('download')) {
            return { icon: <Printer className="h-3.5 w-3.5" />, color: 'orange', formalTitle: 'Label Sheet Exported' }
        }
        if (type === 'DOC_UPLOAD' || originalTitle.toLowerCase().includes('doc') || originalTitle.toLowerCase().includes('upload')) {
            return { icon: <Shield className="h-3.5 w-3.5" />, color: 'purple', formalTitle: 'Compliance Document Uploaded' }
        }
        return { icon: <Circle className="h-3.5 w-3.5" />, color: 'zinc', formalTitle: originalTitle }
    }

    const getIconStyles = (color: string) => {
        const styles: Record<string, string> = {
            blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
            emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
            orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
            purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
            zinc: 'bg-zinc-800 border-zinc-700 text-zinc-400'
        }
        return styles[color] || styles.zinc
    }

    const formatLogTime = (timeStr: string) => {
        return timeStr.replace('about ', '~').replace(' ago', '')
    }

    // Icon box: p-1.5 (6px) padding + 14px icon = 26px total width. Center = 13px from left edge of icon box.
    // Container px-4 = 16px. So line should be at 16px + 13px = 29px from card edge.
    // But we removed the outer px and put it on inner, so recalculating...

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Live Audit Log</CardTitle>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-medium text-emerald-400 uppercase">Real-time</span>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-full max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {activities.length === 0 ? (
                        <div className="text-center text-zinc-600 py-12 text-xs font-mono uppercase tracking-wider">
                            No events recorded
                        </div>
                    ) : (
                        <div className="py-3">
                            {activities.map((activity, index) => {
                                const auditData = getAuditData(activity.type, activity.title)
                                const isFirst = index === 0
                                const isLast = index === activities.length - 1

                                return (
                                    <div
                                        key={activity.id}
                                        className="relative flex items-start gap-3 py-2 px-4 hover:bg-zinc-800/40 transition-colors group"
                                    >
                                        {/* Timeline connector line - goes through center of icon */}
                                        {!isLast && (
                                            <div
                                                className="absolute left-[28px] top-[calc(50%+13px)] w-px h-full bg-zinc-800"
                                                style={{ height: 'calc(100% - 13px)' }}
                                            />
                                        )}

                                        {/* Icon Node */}
                                        <div className={`relative z-10 shrink-0 p-1.5 rounded border bg-zinc-900 ${getIconStyles(auditData.color)}`}>
                                            {auditData.icon}
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                                                    {auditData.formalTitle}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                                                    {formatLogTime(activity.time)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5 truncate">
                                                {activity.description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
