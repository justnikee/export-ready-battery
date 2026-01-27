"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanStatsCard } from "@/components/analytics/ScanStatsCard"
import { DeviceChart } from "@/components/analytics/DeviceChart"
import { CountryChart } from "@/components/analytics/CountryChart"
import { LiveScanFeed } from "@/components/analytics/LiveScanFeed"
import { BarChart3, Globe, Smartphone, Activity, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ScanFeedItem {
    city: string
    country: string
    device_type: string
    scanned_at: string
    serial_number: string
    batch_name: string
}

interface AnalyticsData {
    scans: ScanFeedItem[]
    totalScans: number
    countryBreakdown: { country: string; count: number }[]
    deviceBreakdown: { device: string; count: number }[]
    todayScans: number
}

export default function AnalyticsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [data, setData] = useState<AnalyticsData>({
        scans: [],
        totalScans: 0,
        countryBreakdown: [],
        deviceBreakdown: [],
        todayScans: 0,
    })

    const fetchAnalytics = async (showRefresh = false) => {
        if (!user) return
        if (showRefresh) setRefreshing(true)

        try {
            const response = await api.get(`/scans/feed?tenant_id=${user.tenant_id}&limit=50`)
            const scans: ScanFeedItem[] = response.data.scans || []

            // Process data for charts
            const countryMap = new Map<string, number>()
            const deviceMap = new Map<string, number>()
            const today = new Date().toDateString()
            let todayCount = 0

            scans.forEach((scan) => {
                // Country breakdown
                const country = scan.country || "Unknown"
                countryMap.set(country, (countryMap.get(country) || 0) + 1)

                // Device breakdown
                const device = scan.device_type || "Unknown"
                deviceMap.set(device, (deviceMap.get(device) || 0) + 1)

                // Today's scans
                if (new Date(scan.scanned_at).toDateString() === today) {
                    todayCount++
                }
            })

            // Convert maps to arrays and sort
            const countryBreakdown = Array.from(countryMap.entries())
                .map(([country, count]) => ({ country, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

            const deviceBreakdown = Array.from(deviceMap.entries())
                .map(([device, count]) => ({ device, count }))
                .sort((a, b) => b.count - a.count)

            setData({
                scans,
                totalScans: scans.length,
                countryBreakdown,
                deviceBreakdown,
                todayScans: todayCount,
            })
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
            toast.error("Failed to load analytics")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchAnalytics(), 30000)
        return () => clearInterval(interval)
    }, [user?.tenant_id])

    // Calculate unique countries
    const uniqueCountries = data.countryBreakdown.length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-600/20">
                            <BarChart3 className="h-6 w-6 text-emerald-400" />
                        </div>
                        Scan Analytics
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Track QR code scans and passport verifications
                    </p>
                </div>
                <Button
                    onClick={() => fetchAnalytics(true)}
                    disabled={refreshing}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <ScanStatsCard
                    icon={<Activity className="h-5 w-5" />}
                    label="Total Scans"
                    value={data.totalScans}
                    iconColor="text-teal-400"
                    bgColor="bg-teal-600/20"
                />
                <ScanStatsCard
                    icon={<BarChart3 className="h-5 w-5" />}
                    label="Today's Scans"
                    value={data.todayScans}
                    iconColor="text-emerald-400"
                    bgColor="bg-emerald-600/20"
                />
                <ScanStatsCard
                    icon={<Globe className="h-5 w-5" />}
                    label="Countries"
                    value={uniqueCountries}
                    iconColor="text-blue-400"
                    bgColor="bg-blue-600/20"
                />
                <ScanStatsCard
                    icon={<Smartphone className="h-5 w-5" />}
                    label="Device Types"
                    value={data.deviceBreakdown.length}
                    iconColor="text-orange-400"
                    bgColor="bg-orange-600/20"
                />
            </div>

            {/* Charts and Feed Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Charts Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Country Chart */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-400" />
                                Scans by Country
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.countryBreakdown.length > 0 ? (
                                <CountryChart data={data.countryBreakdown} />
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No scan data available yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Device Chart */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-orange-400" />
                                Device Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.deviceBreakdown.length > 0 ? (
                                <DeviceChart data={data.deviceBreakdown} />
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No scan data available yet
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Live Feed Column */}
                <div>
                    <Card className="bg-slate-900/50 border-slate-800 h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-400" />
                                Live Scan Feed
                                <span className="ml-auto flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[600px] overflow-y-auto">
                            <LiveScanFeed scans={data.scans} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
