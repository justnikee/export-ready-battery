"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import dynamic from 'next/dynamic'
import { formatDistanceToNow, format, parseISO } from "date-fns"
import { Package, Zap, AlertCircle, QrCode, FolderPlus, MoreHorizontal, ArrowUpRight, ArrowRight, Trash2, Shield, Upload, FileDown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Batch } from "@/lib/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"
import { ComplianceScoreCard } from "@/components/dashboard/ComplianceScoreCard"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const ProductionChart = dynamic(() => import('@/components/dashboard/ProductionChart').then(mod => mod.ProductionChart), { ssr: false })
const BatchStatusChart = dynamic(() => import('@/components/dashboard/BatchStatusChart').then(mod => mod.BatchStatusChart), { ssr: false })
const ScanMap = dynamic(() => import('@/components/dashboard/ScanMap').then(mod => mod.ScanMap), { ssr: false })

interface DashboardStats {
    total_passports: number
    total_batches: number
    quota_used: number
    quota_limit: number
    passports_this_week: number
}

interface ScanFeedItem {
    id?: string
    batch_name?: string
    city?: string
    country?: string
    latitude?: number
    longitude?: number
    scanned_at: string
}

interface ScanLocation {
    city: string
    country: string
    latitude: number
    longitude: number
    scanned_at: string
}

interface ActivityItem {
    id: string
    type: 'SCAN' | 'BATCH'
    title: string
    location: string
    time: string
}

interface ChartPoint {
    name: string
    value: number
}

interface RecentBatch {
    id: string
    name: string
    units: number
    status: string
    market_region?: string
    created_at: string
}

interface BatchesResponse {
    batches?: Batch[]
}

interface ScansResponse {
    scans?: ScanFeedItem[]
}

function getComplianceBadge(status: string | undefined) {
    const s = status?.toUpperCase()
    if (s === "VERIFIED") {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
    }
    if (s === "PENDING") {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
    }
    if (s === "REJECTED") {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Rejected</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">Not Uploaded</span>
}

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [batches, setBatches] = useState<Batch[]>([])
    const [recentBatches, setRecentBatches] = useState<RecentBatch[]>([])
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [scanLocations, setScanLocations] = useState<ScanLocation[]>([])
    const [chartData, setChartData] = useState<ChartPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [batchToDelete, setBatchToDelete] = useState<string | null>(null)

    const fetchDashboardData = useCallback(async () => {
        if (!user) return

        try {
            // Fetch stats and batches together (critical)
            const [statsRes, batchesRes] = await Promise.all([
                api.get<DashboardStats>(`/dashboard/stats?tenant_id=${user.tenant_id}`),
                api.get<BatchesResponse>(`/batches?tenant_id=${user.tenant_id}`),
            ])

            // Fetch scans separately — non-critical, shouldn't break dashboard
            let scansRes: { data: ScansResponse } = { data: { scans: [] } }
            try {
                scansRes = await api.get<ScansResponse>(`/scans/feed?tenant_id=${user.tenant_id}&limit=20`)
            } catch (scanError) {
                console.warn("Scan feed unavailable:", scanError)
            }

            setStats(statsRes.data)
            const allBatches = batchesRes.data.batches || []
            const sortedByDateDesc = [...allBatches].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setBatches(allBatches)

            // Chart Data
            const sortedAsc = [...allBatches].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            const dateMap = new Map<string, number>()
            if (sortedAsc.length > 0) {
                const today = new Date()
                for (let i = 60; i >= 0; i -= 10) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    dateMap.set(format(d, 'MMM d'), 0)
                }
                sortedAsc.forEach((batch) => {
                    const dateStr = format(parseISO(batch.created_at), 'MMM d')
                    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + (batch.total_passports || 0))
                })
                let runningTotal = 0
                const cData: ChartPoint[] = []
                for (let i = 60; i >= 0; i -= 10) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dateKey = format(d, 'MMM d')
                    runningTotal += dateMap.get(dateKey) || 0
                    cData.push({ name: dateKey, value: runningTotal })
                }
                const lastVal = cData[cData.length - 1]?.value || 0
                const diff = (statsRes.data.total_passports || 0) - lastVal
                setChartData(cData.map(d => ({ name: d.name, value: d.value + diff })))
            } else {
                setChartData([{ name: 'Today', value: 0 }])
            }

            // Recent Batches
            setRecentBatches(sortedByDateDesc.slice(0, 5).map((b) => ({
                id: b.id,
                name: b.batch_name || "Batch",
                units: b.total_passports || 0,
                status: b.status || 'DRAFT',
                market_region: b.market_region,
                created_at: formatDistanceToNow(new Date(b.created_at), { addSuffix: true })
            })))

            // Store scan locations for the map
            const scans = (scansRes.data.scans || [])
            setScanLocations(scans.map((s) => ({
                city: s.city || "Unknown",
                country: s.country || "Unknown",
                latitude: s.latitude ?? 0,
                longitude: s.longitude ?? 0,
                scanned_at: s.scanned_at,
            })))

            // Audit Log
            const scanEvents: ActivityItem[] = scans.map((s) => ({
                id: `scan-${s.id || Math.random()}`,
                type: 'SCAN',
                title: `QR Scan: ${s.batch_name}`,
                location: `${s.city || "Unknown"}, ${s.country || "Unknown"}`,
                time: formatDistanceToNow(new Date(s.scanned_at), { addSuffix: true })
            }))
            const batchEvents: ActivityItem[] = sortedByDateDesc.slice(0, 3).map((b) => ({
                id: `batch-${b.id}`,
                type: 'BATCH',
                title: `Batch Created: ${b.batch_name || "Batch"}`,
                location: b.market_region === 'INDIA' ? 'Local' : 'EU Export',
                time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true })
            }))
            setActivities([...scanEvents, ...batchEvents].slice(0, 5))
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

    // Calculate Status Counts
    let readyCount = 0, processingCount = 0, completedCount = 0
    batches.forEach(b => {
        const s = b.status?.toUpperCase() || 'DRAFT'
        if (s === 'DRAFT') readyCount++
        else if (s === 'ACTIVE') processingCount++
        else if (s === 'COMPLETED' || s === 'ARCHIVED') completedCount++
        else readyCount++
    })

    const quotaUsed = stats?.quota_used || 0
    const quotaLimit = stats?.quota_limit || 5000
    const quotaPercent = Math.round((quotaUsed / quotaLimit) * 100)
    const isOverLimit = quotaUsed > quotaLimit

    const allVerified =
        user?.epr_status?.toUpperCase() === "VERIFIED" &&
        user?.bis_status?.toUpperCase() === "VERIFIED" &&
        user?.pli_status?.toUpperCase() === "VERIFIED"

    if (loading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Section 1: Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Dashboard</h1>
                        <p className="text-sm text-zinc-500 mt-1">Overview of your battery passport operations</p>
                    </div>
                    <Link
                        href="/batches"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
                    >
                        <Package className="h-4 w-4" />
                        Create Batch
                    </Link>
                </div>

                {/* Section 2: India Compliance Status Banner */}
                <div className="bg-white border border-zinc-200 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="p-2 rounded-md bg-zinc-100">
                                <Shield className="h-5 w-5 text-zinc-700" />
                            </div>
                            <span className="text-sm font-medium text-zinc-900">India Compliance</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 sm:ml-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">EPR</span>
                                {getComplianceBadge(user?.epr_status)}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">BIS</span>
                                {getComplianceBadge(user?.bis_status)}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">PLI</span>
                                {getComplianceBadge(user?.pli_status)}
                            </div>
                        </div>
                        <div className="sm:ml-auto shrink-0">
                            {allVerified ? (
                                <span className="text-sm text-emerald-600 font-medium">✓ All India compliance documents verified</span>
                            ) : (
                                <Link href="/settings" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                    Complete your compliance setup →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Quick Actions Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/batches" className="bg-white border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                            <Package className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">Create Batch</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Start a new production batch</div>
                    </Link>
                    <Link href="/batches" className="bg-white border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                            <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">Upload CSV</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Bulk import serial numbers</div>
                    </Link>
                    <Link href="/compliance" className="bg-white border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                            <Shield className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">View Compliance</div>
                        <div className="text-xs text-zinc-500 mt-0.5">EPR obligations & certificates</div>
                    </Link>
                    <Link href="/compliance" className="bg-white border border-zinc-200 rounded-lg p-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                            <FileDown className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 group-hover:text-zinc-700">CPCB Report</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Generate CPCB Form 3 export</div>
                    </Link>
                </div>

                {/* Section 4: Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Passports */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Passports</span>
                            <Package className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-semibold text-zinc-900 tracking-tight">{stats?.total_passports?.toLocaleString() || 0}</div>
                        <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">+{stats?.passports_this_week || 0}</span> this week
                        </div>
                    </div>

                    {/* Active Batches */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Batches</span>
                            <Package className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-semibold text-zinc-900">{processingCount}</div>
                        <div className="text-xs text-zinc-500 mt-2">Currently Processing</div>
                    </div>

                    {/* Passport Quota */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Passport Quota</span>
                            <span className="text-xs font-medium text-zinc-600">{quotaPercent}%</span>
                        </div>
                        <div className="text-xs text-zinc-600 mb-2">{quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}</div>
                        <div className="w-full bg-zinc-100 rounded h-1.5">
                            <div
                                className={`h-1.5 rounded ${isOverLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(quotaPercent, 100)}%` }}
                            />
                        </div>
                        {isOverLimit && (
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />
                                    Over by {(quotaUsed - quotaLimit).toLocaleString()}
                                </div>
                                <Link href="/billing" className="text-xs text-blue-600 hover:underline font-medium">Top Up →</Link>
                            </div>
                        )}
                    </div>

                    {/* Compliance Score */}
                    <ComplianceScoreCard batches={batches} />
                </div>

                {/* Section 5: Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Production Overview */}
                    <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100">
                            <h3 className="text-base font-medium text-zinc-900">Production Overview</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Passport generation over time</p>
                        </div>
                        <div className="p-6">
                            <ProductionChart data={chartData} />
                        </div>
                    </div>

                    {/* Batch Status */}
                    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100">
                            <h3 className="text-base font-medium text-zinc-900">Batch Status</h3>
                        </div>
                        <div className="p-6">
                            <BatchStatusChart ready={readyCount} processing={processingCount} completed={completedCount} />
                        </div>
                    </div>
                </div>

                {/* Section 6: Recent Batches + Audit Log */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent Batches */}
                    <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="text-base font-medium text-zinc-900">Recent Batches</h3>
                            <Link href="/batches" className="text-xs text-blue-600 hover:underline font-medium">View All →</Link>
                        </div>
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Batch</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Volume</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBatches.map(batch => (
                                    <tr key={batch.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/batches/${batch.id}`} className="text-sm font-medium text-zinc-900 hover:text-blue-600">{batch.name}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-600">{batch.units} units</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${batch.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                batch.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-600 border-zinc-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                {batch.status === 'ACTIVE' ? 'Active' : batch.status === 'DRAFT' ? 'Draft' : batch.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-500">{batch.created_at}</td>
                                        <td className="px-4 py-3">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="text-zinc-400 hover:text-zinc-600 p-1 rounded hover:bg-zinc-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-lg min-w-[160px]">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/batches/${batch.id}`)}
                                                        className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                                    >
                                                        <ArrowRight className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>

                                                    {batch.status !== 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post(`/batches/${batch.id}/activate`)
                                                                    toast.success("Batch activated!")
                                                                    fetchDashboardData()
                                                                } catch (err: unknown) {
                                                                    const apiError = err as { response?: { data?: { error?: string } } }
                                                                    toast.error(apiError.response?.data?.error || "Activation failed")
                                                                }
                                                            }}
                                                            className="cursor-pointer text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700"
                                                        >
                                                            <Zap className="mr-2 h-4 w-4" /> Activate
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator className="bg-zinc-200" />

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setBatchToDelete(batch.id)
                                                        }}
                                                        className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {recentBatches.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">No batches yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Audit Log */}
                    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100">
                            <h3 className="text-base font-medium text-zinc-900">Audit Log</h3>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {activities.map(activity => (
                                <div key={activity.id} className="px-6 py-4 flex items-start gap-3 hover:bg-zinc-50">
                                    <div className={`p-2 rounded-md ${activity.type === 'SCAN' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                        {activity.type === 'SCAN' ? (
                                            <QrCode className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <FolderPlus className="h-4 w-4 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-900 truncate">{activity.title}</p>
                                        <p className="text-xs text-zinc-500">{activity.location}</p>
                                    </div>
                                    <span className="text-xs text-zinc-400 whitespace-nowrap">{activity.time}</span>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="px-6 py-8 text-center text-sm text-zinc-500">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 7: Global Scan Activity */}
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-medium text-zinc-900">Global Scan Activity</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Real-time QR code scans worldwide</p>
                        </div>
                    </div>
                    <ScanMap scans={scanLocations} height={400} />
                </div>

            </div>
            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={!!batchToDelete}
                onOpenChange={(open) => !open && setBatchToDelete(null)}
                title="Delete this batch?"
                description="This action cannot be undone. The batch and all its data will be permanently removed."
                confirmText="Delete Batch"
                variant="destructive"
                onConfirm={async () => {
                    if (batchToDelete) {
                        try {
                            await api.delete(`/batches/${batchToDelete}`)
                            toast.success("Batch deleted")
                            fetchDashboardData()
                        } catch {
                            toast.error("Failed to delete batch")
                        } finally {
                            setBatchToDelete(null)
                        }
                    }
                }}
            />
        </div>
    )
}
