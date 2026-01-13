"use client"

import { Smartphone, Monitor, Tablet, Bot, HelpCircle } from "lucide-react"

interface ScanFeedItem {
    city: string
    country: string
    device_type: string
    scanned_at: string
    serial_number: string
    batch_name: string
}

interface LiveScanFeedProps {
    scans: ScanFeedItem[]
}

const deviceIcons: Record<string, React.ReactNode> = {
    Mobile: <Smartphone className="h-4 w-4" />,
    Desktop: <Monitor className="h-4 w-4" />,
    Tablet: <Tablet className="h-4 w-4" />,
    Bot: <Bot className="h-4 w-4" />,
    Unknown: <HelpCircle className="h-4 w-4" />,
}

const deviceColors: Record<string, string> = {
    Mobile: "text-emerald-400 bg-emerald-900/30",
    Desktop: "text-blue-400 bg-blue-900/30",
    Tablet: "text-orange-400 bg-orange-900/30",
    Bot: "text-zinc-400 bg-zinc-800",
    Unknown: "text-zinc-500 bg-zinc-800",
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString()
}

export function LiveScanFeed({ scans }: LiveScanFeedProps) {
    if (scans.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No scans recorded yet</p>
                <p className="text-sm mt-1">Scans will appear here in real-time</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {scans.map((scan, index) => {
                const device = scan.device_type || "Unknown"
                const colorClass = deviceColors[device] || deviceColors.Unknown
                const icon = deviceIcons[device] || deviceIcons.Unknown

                return (
                    <div
                        key={`${scan.serial_number}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                        {/* Device Icon */}
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                            {icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm truncate">
                                    {scan.city || "Unknown"}, {scan.country || "Unknown"}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {formatRelativeTime(scan.scanned_at)}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate mt-1">
                                {scan.batch_name}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono truncate">
                                {scan.serial_number}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
