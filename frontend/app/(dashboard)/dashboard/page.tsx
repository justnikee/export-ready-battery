"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { StatsCard } from "@/components/dashboard/StatsCard"
import dynamic from 'next/dynamic'
import { QuotaCard } from "@/components/dashboard/QuotaCard"
import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { formatDistanceToNow, format, parseISO } from "date-fns"

const ProductionChart = dynamic(() => import('@/components/dashboard/ProductionChart').then(mod => mod.ProductionChart), { ssr: false })
const BatchStatusChart = dynamic(() => import('@/components/dashboard/BatchStatusChart').then(mod => mod.BatchStatusChart), { ssr: false })

interface DashboardStats {
    total_passports: number
    total_batches: number
    quota_used: number
    quota_limit: number
    carbon_compliance_percentage: number
    passports_this_week: number
    india_batches?: number
    eu_batches?: number
    pending_export_batches?: number
}

interface Batch {
    id: string
    batch_name: string
    market_region: string
    total_passports: number
    status: string // READY, PROCESSING, COMPLETED
    created_at: string
}

interface ScanEvent {
    id: string
    city: string
    country: string
    device_type: string
    scanned_at: string
    batch_name: string
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [batches, setBatches] = useState<Batch[]>([]) // All batches
    const [recentBatches, setRecentBatches] = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = async () => {
        if (!user) return

        try {
            const [statsRes, batchesRes, recentRes, scansRes] = await Promise.all([
                api.get(`/dashboard/stats?tenant_id=${user.tenant_id}`),
                api.get(`/batches?tenant_id=${user.tenant_id}`), // Fetch all for donut & chart
                api.get(`/batches/recent?tenant_id=${user.tenant_id}&limit=5`),
                api.get(`/scans/feed?tenant_id=${user.tenant_id}&limit=6`)
            ])

            setStats(statsRes.data)

            // Process ALL batches from 'batchesRes' (Reliable Source)
            // Backend /batches/recent might be inconsistent, so we prioritize the full list sorted by date.
            const allBatches = batchesRes.data.batches || []

            // Sort by CreatedAt Descending
            const sortedByDateDesc = [...allBatches].sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            setBatches(allBatches)

            // Generate Chart Data (Cumulative Passports by Date | Ascending)
            // ... same chart logic but using allBatches ...
            // (We need sortedAsc for the chart)
            const sortedAsc = [...allBatches].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            const dateMap = new Map<string, number>()
            // ... Logic preserved ...
            if (sortedAsc.length > 0) {
                const today = new Date()
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    const dateStr = format(d, 'MMM d')
                    dateMap.set(dateStr, 0)
                }

                sortedAsc.forEach((batch: any) => {
                    const dateStr = format(parseISO(batch.created_at), 'MMM d')
                    const currentVal = dateMap.get(dateStr) || 0
                    dateMap.set(dateStr, currentVal + (batch.total_passports || 0))
                })

                let runningTotal = 0
                const cData: any[] = []
                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dateKey = format(d, 'MMM d')
                    const added = dateMap.get(dateKey) || 0
                    runningTotal += added
                    cData.push({ name: dateKey, value: runningTotal })
                }
                const lastVal = cData[cData.length - 1].value
                const totalPassports = statsRes.data.total_passports || 0
                const diff = totalPassports - lastVal
                const finalData = cData.map(d => ({
                    name: d.name,
                    value: d.value + diff
                }))
                setChartData(finalData)
            } else {
                setChartData([{ name: 'Today', value: 0 }])
            }

            // Recent Batches (Top 5 from allBatches)
            const recent = sortedByDateDesc.slice(0, 5).map((b: any) => {
                return {
                    id: b.id,
                    name: b.batch_name || b.name,
                    units: b.total_passports || b.total_units || 0,
                    status: b.status || 'DRAFT',
                    specs: {
                        chemistry: b.chemistry || b.battery_chemistry || 'Li-ion',
                        voltage: b.voltage || b.nominal_voltage || '48',
                        capacity: b.capacity || b.rated_capacity || ''
                    },
                    market_region: b.market_region || b.target_market,
                    created_at_relative: formatDistanceToNow(new Date(b.created_at), { addSuffix: true })
                }
            })
            setRecentBatches(recent)


            // Activity Feed (Derived from Recent + Scans)
            const scans = (scansRes.data.scans || [])
            const scanEvents = scans.map((s: any) => ({
                id: `scan-${s.id || Math.random()}`,
                type: 'COMPLETED',
                title: 'Passport Scanned',
                description: `${s.batch_name} in ${s.city}, ${s.country}`,
                time: formatDistanceToNow(new Date(s.scanned_at), { addSuffix: true }),
                sortTime: new Date(s.scanned_at).getTime()
            }))

            const batchEvents = sortedByDateDesc.slice(0, 5).map((b: any) => ({
                id: `batch-${b.id}`,
                type: 'CREATED',
                title: 'Batch Created',
                description: `${b.batch_name || b.name} (${b.total_passports || 0} units)`,
                time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true }),
                sortTime: new Date(b.created_at).getTime()
            }))

            // Merge and Sort
            const allActivity = [...scanEvents, ...batchEvents]
                .sort((a, b) => b.sortTime - a.sortTime)
                .slice(0, 6)

            setActivities(allActivity)

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [user?.tenant_id])

    if (loading) {
        return <DashboardSkeleton />
    }

    // Calculate Dynamic Status Counts from REAL data
    let readyCount = 0      // Drafts
    let processingCount = 0 // Active
    let completedCount = 0  // Completed/Archived

    batches.forEach(b => {
        const s = b.status?.toUpperCase() || 'DRAFT'
        if (s === 'DRAFT') readyCount++
        else if (s === 'ACTIVE') processingCount++
        else if (s === 'COMPLETED' || s === 'ARCHIVED') completedCount++
        else readyCount++ // Default to ready/draft
    })

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header - Industrial Style (no blur) */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-400 mt-1 leading-relaxed">Monitor your passport production and batch status</p>
                </div>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Passports"
                        value={stats?.total_passports?.toLocaleString() || 0}
                        subtext={`+${stats?.passports_this_week || 0} this week`}
                        trend={stats?.passports_this_week && stats?.total_passports
                            ? `+${((stats.passports_this_week / Math.max(stats.total_passports - stats.passports_this_week, 1)) * 100).toFixed(1)}%`
                            : undefined}
                        isPositive={true}
                    />
                    <StatsCard
                        title="In India"
                        value={stats?.india_batches || batches.filter(b => b.market_region === "INDIA").length || 0}
                        subtext="Battery Aadhaar"
                    />
                    <StatsCard
                        title="EU Export"
                        value={stats?.pending_export_batches || batches.filter(b => b.market_region === "EU").length || 0}
                        subtext="Carbon Compliant"
                    />
                    <StatsCard
                        title="Active Batches"
                        value={processingCount}
                        subtext="Processing"
                        trend="Live"
                        isPositive={true}
                    />
                </div>

                {/* Middle Row: Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ProductionChart data={chartData} />
                    </div>

                    <div className="space-y-6">
                        <QuotaCard used={stats?.quota_used || 0} limit={stats?.quota_limit || 5000} />
                        <BatchStatusChart ready={readyCount} processing={processingCount} completed={completedCount} />
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <RecentBatchesTable batches={recentBatches} />
                    </div>
                    <div>
                        <ActivityFeed activities={activities} />
                    </div>
                </div>

            </div>
        </div>
    )
}
