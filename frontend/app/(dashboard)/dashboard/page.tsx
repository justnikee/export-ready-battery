"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import dynamic from 'next/dynamic'
import { formatDistanceToNow, format, parseISO } from "date-fns"
import { Package, Globe, Zap, AlertCircle, QrCode, FolderPlus, MoreHorizontal, ArrowUpRight, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"

const ProductionChart = dynamic(() => import('@/components/dashboard/ProductionChart').then(mod => mod.ProductionChart), { ssr: false })
const BatchStatusChart = dynamic(() => import('@/components/dashboard/BatchStatusChart').then(mod => mod.BatchStatusChart), { ssr: false })

interface DashboardStats {
    total_passports: number
    total_batches: number
    quota_used: number
    quota_limit: number
    passports_this_week: number
}

interface Batch {
    id: string
    batch_name: string
    market_region: string
    total_passports: number
    status: string
    created_at: string
}

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [batches, setBatches] = useState<Batch[]>([])
    const [recentBatches, setRecentBatches] = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = async () => {
        if (!user) return

        try {
            const [statsRes, batchesRes, scansRes] = await Promise.all([
                api.get(`/dashboard/stats?tenant_id=${user.tenant_id}`),
                api.get(`/batches?tenant_id=${user.tenant_id}`),
                api.get(`/scans/feed?tenant_id=${user.tenant_id}&limit=6`)
            ])

            setStats(statsRes.data)
            const allBatches = batchesRes.data.batches || []
            const sortedByDateDesc = [...allBatches].sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setBatches(allBatches)

            // Chart Data
            const sortedAsc = [...allBatches].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            const dateMap = new Map<string, number>()
            if (sortedAsc.length > 0) {
                const today = new Date()
                for (let i = 60; i >= 0; i -= 10) {
                    const d = new Date(today)
                    d.setDate(d.getDate() - i)
                    dateMap.set(format(d, 'MMM d'), 0)
                }
                sortedAsc.forEach((batch: any) => {
                    const dateStr = format(parseISO(batch.created_at), 'MMM d')
                    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + (batch.total_passports || 0))
                })
                let runningTotal = 0
                const cData: any[] = []
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
            setRecentBatches(sortedByDateDesc.slice(0, 5).map((b: any) => ({
                id: b.id,
                name: b.batch_name || b.name,
                units: b.total_passports || 0,
                status: b.status || 'DRAFT',
                market_region: b.market_region,
                created_at: formatDistanceToNow(new Date(b.created_at), { addSuffix: true })
            })))

            // Audit Log
            const scans = (scansRes.data.scans || [])
            const scanEvents = scans.map((s: any) => ({
                id: `scan-${s.id || Math.random()}`,
                type: 'SCAN',
                title: `QR Scan: ${s.batch_name}`,
                location: `${s.city}, ${s.country}`,
                time: formatDistanceToNow(new Date(s.scanned_at), { addSuffix: true })
            }))
            const batchEvents = sortedByDateDesc.slice(0, 3).map((b: any) => ({
                id: `batch-${b.id}`,
                type: 'BATCH',
                title: `Batch Created: ${b.batch_name || b.name}`,
                location: b.market_region === 'INDIA' ? 'Local' : 'EU Export',
                time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true })
            }))
            setActivities([...scanEvents, ...batchEvents].slice(0, 5))
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDashboardData() }, [user?.tenant_id])

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

    if (loading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Overview of your battery compliance operations</p>
                    </div>
                    <Link
                        href="/batches"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
                    >
                        <Package className="h-4 w-4" />
                        Create Batch
                    </Link>
                </div>

                {/* Stats Row - 5 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Passports */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Passports</span>
                            <Package className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-semibold text-slate-900 tracking-tight">{stats?.total_passports?.toLocaleString() || 0}</div>
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">+{stats?.passports_this_week || 0}</span> this week
                        </div>
                    </div>

                    {/* India */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-green-500 shrink-0" />
                                India
                            </span>
                            <Zap className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="text-2xl font-semibold text-slate-900">{batches.filter(b => b.market_region === "INDIA").length || 0}</div>
                        <div className="text-xs text-slate-500 mt-2">Battery Aadhaar Compliant</div>
                    </div>

                    {/* EU Export */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shrink-0" />
                                EU
                            </span>
                            <Globe className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-semibold text-slate-900">{batches.filter(b => b.market_region === "EU").length || 0}</div>
                        <div className="text-xs text-slate-500 mt-2">Carbon Regulation Ready</div>
                    </div>

                    {/* Active Batches */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Batches</span>
                            <Package className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-semibold text-slate-900">{processingCount}</div>
                        <div className="text-xs text-slate-500 mt-2">Currently Processing</div>
                    </div>

                    {/* Passport Quota */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Passport Quota</span>
                            <span className="text-xs font-medium text-slate-600">{quotaPercent}%</span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">{quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}</div>
                        <div className="w-full bg-slate-100 rounded h-1.5">
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
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Production Overview */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-base font-medium text-slate-900">Production Overview</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Passport generation over time</p>
                        </div>
                        <div className="p-6">
                            <ProductionChart data={chartData} />
                        </div>
                    </div>

                    {/* Batch Status */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-base font-medium text-slate-900">Batch Status</h3>
                        </div>
                        <div className="p-6">
                            <BatchStatusChart ready={readyCount} processing={processingCount} completed={completedCount} />
                        </div>
                    </div>
                </div>

                {/* Data Tables Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent Batches - Industrial Data Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-base font-medium text-slate-900">Recent Batches</h3>
                            <Link href="/batches" className="text-xs text-blue-600 hover:underline font-medium">View All →</Link>
                        </div>
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Volume</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBatches.map(batch => (
                                    <tr key={batch.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/batches/${batch.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-600">{batch.name}</Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{batch.units} units</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${batch.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                batch.status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                {batch.status === 'ACTIVE' ? 'Active' : batch.status === 'DRAFT' ? 'Draft' : batch.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{batch.created_at}</td>
                                        <td className="px-4 py-3">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg min-w-[160px]">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/batches/${batch.id}`)}
                                                        className="cursor-pointer text-slate-700 hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900"
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
                                                                } catch (err: any) {
                                                                    toast.error(err.response?.data?.error || "Activation failed")
                                                                }
                                                            }}
                                                            className="cursor-pointer text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700"
                                                        >
                                                            <Zap className="mr-2 h-4 w-4" /> Activate
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator className="bg-slate-200" />

                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            if (confirm("Delete this batch?")) {
                                                                try {
                                                                    await api.delete(`/batches/${batch.id}`)
                                                                    toast.success("Batch deleted")
                                                                    fetchDashboardData()
                                                                } catch (err) {
                                                                    toast.error("Failed to delete batch")
                                                                }
                                                            }
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
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No batches yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Audit Log */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="text-base font-medium text-slate-900">Audit Log</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {activities.map(activity => (
                                <div key={activity.id} className="px-6 py-4 flex items-start gap-3 hover:bg-slate-50">
                                    <div className={`p-2 rounded-md ${activity.type === 'SCAN' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                        {activity.type === 'SCAN' ? (
                                            <QrCode className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <FolderPlus className="h-4 w-4 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-900 truncate">{activity.title}</p>
                                        <p className="text-xs text-slate-500">{activity.location}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="px-6 py-8 text-center text-sm text-slate-500">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
