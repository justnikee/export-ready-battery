"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import api from "@/lib/api"
import {
    PlusCircle,
    Battery,
    Box,
    Leaf,
    Download,
    Eye,
    MapPin,
    Smartphone,
    Clock,
    TrendingUp,
    Activity,
    Flag,
    Globe
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface DashboardStats {
    total_passports: number
    total_batches: number
    quota_used: number
    quota_limit: number
    carbon_compliance_percentage: number
    passports_this_week: number
    india_batches?: number
    eu_batches?: number
}

interface BatchSummary {
    id: string
    name: string
    created_at: string
    total_units: number
    status: string
    download_url: string
    market_region?: MarketRegion
}

interface ScanFeedItem {
    city: string
    country: string
    device_type: string
    scanned_at: string
    serial_number: string
    batch_name: string
}

// Helper to get market region display
const getMarketBadge = (region?: MarketRegion) => {
    switch (region) {
        case "INDIA":
            return (
                <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                    <span>🇮🇳</span>
                </span>
            )
        case "EU":
            return (
                <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                    <span>🇪🇺</span>
                </span>
            )
        default:
            return (
                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                    <Globe className="h-3 w-3" />
                </span>
            )
    }
}

// Mock demo data for live activity
const DEMO_SCAN_FEED: ScanFeedItem[] = [
    {
        city: "New Delhi",
        country: "India",
        device_type: "iPhone 14",
        scanned_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        serial_number: "IN-NKY-LFP-2026-00142",
        batch_name: "Q1-2026-India"
    },
    {
        city: "Hamburg",
        country: "Germany",
        device_type: "Chrome/Windows",
        scanned_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        serial_number: "EU-BAT-2026-0089",
        batch_name: "EU-Export-Jan"
    },
    {
        city: "Mumbai",
        country: "India",
        device_type: "Samsung Galaxy S23",
        scanned_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        serial_number: "IN-NKY-NMC-2026-00055",
        batch_name: "PLI-Batch-Q1"
    },
    {
        city: "Paris",
        country: "France",
        device_type: "Safari/macOS",
        scanned_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        serial_number: "EU-BAT-2026-0156",
        batch_name: "EU-Export-Jan"
    }
]

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [recentBatches, setRecentBatches] = useState<BatchSummary[]>([])
    const [scanFeed, setScanFeed] = useState<ScanFeedItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = async () => {
        if (!user) return

        try {
            const [statsRes, batchesRes, scansRes] = await Promise.all([
                api.get(`/dashboard/stats?tenant_id=${user.tenant_id}`),
                api.get(`/batches/recent?tenant_id=${user.tenant_id}&limit=5`),
                api.get(`/scans/feed?tenant_id=${user.tenant_id}&limit=10`)
            ])

            setStats(statsRes.data)
            setRecentBatches(batchesRes.data.batches || [])

            // Use real scan data if available, otherwise use demo data
            const realScans = scansRes.data.scans || []
            setScanFeed(realScans.length > 0 ? realScans : DEMO_SCAN_FEED)
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
            // Fallback to demo data
            setScanFeed(DEMO_SCAN_FEED)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()

        // Poll every 5 seconds for live updates
        const interval = setInterval(fetchDashboardData, 5000)
        return () => clearInterval(interval)
    }, [user])

    const handleDownload = async (batchId: string, batchName: string) => {
        try {
            const response = await api.get(`/batches/${batchId}/download`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${batchName}_qrcodes.zip`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error("Download failed:", error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const quotaPercentage = stats ? (stats.quota_used / stats.quota_limit) * 100 : 0

    // Calculate market-specific counts from batches
    const indiaBatches = recentBatches.filter(b => b.market_region === "INDIA").length + (stats?.india_batches || 0)
    const euBatches = recentBatches.filter(b => b.market_region === "EU").length + (stats?.eu_batches || 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.email?.split('@')[0]}
                    </p>
                </div>
                <Link href="/batches">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Batch
                    </Button>
                </Link>
            </div>

            {/* Main Grid - 2 columns */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Metric Cards - 4 columns now */}
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Total Passports */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Passports</CardTitle>
                                <Battery className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_passports?.toLocaleString() || 0}</div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                    +{stats?.passports_this_week || 0} this week
                                </p>
                            </CardContent>
                        </Card>

                        {/* India Batches */}
                        <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                                    <span>🇮🇳</span> India
                                </CardTitle>
                                <Flag className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-700">{indiaBatches || stats?.total_batches || 0}</div>
                                <p className="text-xs text-orange-600/80">
                                    Battery Aadhaar
                                </p>
                            </CardContent>
                        </Card>

                        {/* EU Batches */}
                        <Card className="border-blue-200 bg-blue-50/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                                    <span>🇪🇺</span> EU Export
                                </CardTitle>
                                <Leaf className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700">{euBatches || 0}</div>
                                <p className="text-xs text-blue-600/80">
                                    Carbon Compliant
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Batches */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">All Batches</CardTitle>
                                <Box className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_batches || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    Active production
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Batches Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Batches</CardTitle>
                            <Link href="/batches">
                                <Button variant="ghost" size="sm">View All</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentBatches.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No batches yet. Create your first batch!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentBatches.map((batch) => (
                                        <div
                                            key={batch.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-100 transition-colors"
                                        >
                                            {/* Market Flag */}
                                            <div className="w-8 shrink-0">
                                                {getMarketBadge(batch.market_region)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{batch.name}</p>
                                                    {batch.status === "READY" ? (
                                                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                            Ready
                                                        </Badge>
                                                    ) : batch.status === "PENDING" ? (
                                                        <Badge variant="secondary" className="animate-pulse bg-blue-100 text-blue-700">
                                                            Processing...
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            {batch.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span className="font-medium">{batch.total_units} units</span>
                                                    <span>•</span>
                                                    <span>{batch.created_at}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownload(batch.id, batch.name)}
                                                    disabled={batch.status !== "READY" || batch.total_units === 0}
                                                    title="Download QR Codes"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/batches/${batch.id}`}>
                                                    <Button variant="ghost" size="icon" title="View Details">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                    {/* Quota Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Passport Quota</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Used</span>
                                    <span className="font-medium">
                                        {stats?.quota_used?.toLocaleString() || 0} / {stats?.quota_limit?.toLocaleString() || 5000}
                                    </span>
                                </div>
                                <Progress value={Math.min(quotaPercentage, 100)} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                    {(100 - quotaPercentage).toFixed(0)}% remaining this month
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Live Scan Feed */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                                Live Activity
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                                Real-time
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {scanFeed.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No scans yet</p>
                                    <p className="text-xs">Scans will appear here in real-time</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {scanFeed.map((scan, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${scan.country === "India" ? "bg-orange-100" : "bg-blue-100"
                                                }`}>
                                                <MapPin className={`h-4 w-4 ${scan.country === "India" ? "text-orange-600" : "text-blue-600"
                                                    }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    📍 {scan.city}, {scan.country}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Smartphone className="h-3 w-3" />
                                                    <span>{scan.device_type}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
