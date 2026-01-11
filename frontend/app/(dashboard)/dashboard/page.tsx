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
    Activity
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DashboardStats {
    total_passports: number
    total_batches: number
    quota_used: number
    quota_limit: number
    carbon_compliance_percentage: number
    passports_this_week: number
}

interface BatchSummary {
    id: string
    name: string
    created_at: string
    total_units: number
    status: string
    download_url: string
}

interface ScanFeedItem {
    city: string
    country: string
    device_type: string
    scanned_at: string
    serial_number: string
    batch_name: string
}

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
            setScanFeed(scansRes.data.scans || [])
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
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
    const carbonColor = stats && stats.carbon_compliance_percentage >= 90
        ? "text-green-600"
        : stats && stats.carbon_compliance_percentage >= 70
            ? "text-yellow-600"
            : "text-red-600"

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
                    {/* Metric Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
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

                        {/* Active Batches */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                                <Box className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_batches || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    All batches ready
                                </p>
                            </CardContent>
                        </Card>

                        {/* Carbon Compliance */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Carbon Data</CardTitle>
                                <Leaf className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${carbonColor}`}>
                                    {stats?.carbon_compliance_percentage?.toFixed(0) || 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats && stats.carbon_compliance_percentage >= 90
                                        ? "Fully compliant"
                                        : "Add carbon data to batches"}
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
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{batch.name}</p>
                                                    {batch.status === "READY" ? (
                                                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                            Ready
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            {batch.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span>{batch.total_units} units</span>
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
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                <MapPin className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    {scan.city}, {scan.country}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Smartphone className="h-3 w-3" />
                                                    <span>{scan.device_type}</span>
                                                    <span>•</span>
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {formatDistanceToNow(new Date(scan.scanned_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {scan.batch_name}
                                                </p>
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
