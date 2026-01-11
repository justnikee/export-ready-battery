"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Circle, CheckCircle, Trash2, AlertTriangle } from "lucide-react"

// Mock Activity type
interface Activity {
    id: string
    type: 'CREATED' | 'DELETED' | 'COMPLETED' | 'WARNING'
    title: string
    description: string
    time: string
}

interface ActivityFeedProps {
    activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {

    const getIcon = (type: string) => {
        switch (type) {
            case 'CREATED': return <Circle className="h-4 w-4 text-blue-500" />
            case 'DELETED': return <Trash2 className="h-4 w-4 text-red-500" />
            case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-emerald-500" />
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            default: return <Circle className="h-4 w-4 text-zinc-500" />
        }
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">Activity</CardTitle>
                <span className="flex items-center gap-2 text-xs text-emerald-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live
                </span>
            </CardHeader>
            <CardContent className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[29px] top-6 bottom-6 w-[1px] bg-zinc-800" />

                {activities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-4">
                        <div className="mt-0.5 relative z-10 bg-zinc-900 p-1">
                            {getIcon(activity.type)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-200">{activity.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{activity.description}</p>
                            <p className="text-[10px] text-zinc-600 mt-2">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
