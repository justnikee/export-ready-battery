"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radar, Factory, Printer, Shield, Activity } from "lucide-react"

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

    const getEventData = (type: string, originalTitle: string) => {
        if (type === 'SCAN' || type === 'COMPLETED' || originalTitle.toLowerCase().includes('scan')) {
            return {
                icon: <Radar className="h-3.5 w-3.5" />,
                accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                title: 'QR Scan'
            }
        }
        if (type === 'BATCH_CREATE' || type === 'CREATED' || originalTitle.toLowerCase().includes('batch')) {
            return {
                icon: <Factory className="h-3.5 w-3.5" />,
                accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                title: 'Batch Created'
            }
        }
        if (type === 'LABEL_PRINT' || originalTitle.toLowerCase().includes('label') || originalTitle.toLowerCase().includes('download')) {
            return {
                icon: <Printer className="h-3.5 w-3.5" />,
                accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                title: 'Labels Exported'
            }
        }
        if (type === 'DOC_UPLOAD' || originalTitle.toLowerCase().includes('doc') || originalTitle.toLowerCase().includes('upload')) {
            return {
                icon: <Shield className="h-3.5 w-3.5" />,
                accent: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
                title: 'Doc Uploaded'
            }
        }
        return {
            icon: <Activity className="h-3.5 w-3.5" />,
            accent: 'text-slate-400 bg-slate-800 border-slate-700',
            title: originalTitle
        }
    }

    const formatTime = (timeStr: string) => {
        return timeStr
            .replace('about ', '')
            .replace('less than a minute', '<1m')
            .replace(' minutes', 'm')
            .replace(' minute', 'm')
            .replace(' hours', 'h')
            .replace(' hour', 'h')
            .replace(' days', 'd')
            .replace(' day', 'd')
            .replace(' ago', '')
    }

    return (
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 h-full flex flex-col">
            {/* Header - Matches RecentBatches */}
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-slate-800">
                <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">
                    Audit Log
                </CardTitle>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-medium text-emerald-400 uppercase">Live</span>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-hidden">
                {activities.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-sm">
                        No activity yet
                    </div>
                ) : (
                    <div className="overflow-y-auto max-h-[380px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                        {activities.map((activity, idx) => {
                            const data = getEventData(activity.type, activity.title)

                            return (
                                <div
                                    key={activity.id}
                                    className={`flex items-start gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors ${idx !== activities.length - 1 ? 'border-b border-slate-800/30' : ''
                                        }`}
                                >
                                    {/* Icon - Compact, color-coded */}
                                    <div className={`flex-shrink-0 w-7 h-7 rounded-md border flex items-center justify-center mt-0.5 ${data.accent}`}>
                                        {data.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-slate-100">
                                                {data.title}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                                                {formatTime(activity.time)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                                            {activity.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
