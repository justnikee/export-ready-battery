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
 Mobile: "text-emerald-500 bg-emerald-500/10",
 Desktop: "text-blue-500 bg-blue-500/10",
 Tablet: "text-orange-600 bg-orange-500/10",
 Bot: "text-muted-foreground bg-muted",
 Unknown: "text-muted-foreground bg-muted",
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
 <div className="text-center py-12 text-muted-foreground">
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
 className="flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-accent transition-colors"
 >
 {/* Device Icon */}
 <div className={`p-2 rounded-lg ${colorClass}`}>
 {icon}
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-medium text-foreground text-sm truncate">
 {scan.city || "Unknown"}, {scan.country || "Unknown"}
 </span>
 <span className="text-xs text-muted-foreground">
 {formatRelativeTime(scan.scanned_at)}
 </span>
 </div>
 <p className="text-xs text-muted-foreground truncate mt-1">
 {scan.batch_name}
 </p>
 <p className="text-xs text-muted-foreground font-mono truncate">
 {scan.serial_number}
 </p>
 </div>
 </div>
 )
 })}
 </div>
 )
}
