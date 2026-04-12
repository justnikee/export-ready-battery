"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { toast } from "sonner"
import {
 ArrowRight, Package, Truck, Wrench, Recycle,
 AlertTriangle, Loader2, Search, Filter,
 ChevronDown, RefreshCw
} from "lucide-react"

interface PassportSummary {
 uuid: string
 serial_number: string
 status: string
 state_of_health: number | null
 batch_name: string
 updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
 CREATED: "bg-muted text-foreground",
 ACTIVE: "bg-blue-500/15 text-blue-500",
 SHIPPED: "bg-amber-500/15 text-amber-500",
 IN_SERVICE: "bg-emerald-500/15 text-emerald-500",
 RECALLED: "bg-red-500/15 text-red-500",
 RECYCLED: "bg-purple-100 text-purple-700",
 END_OF_LIFE: "bg-muted text-muted-foreground",
}

const STATUS_ICONS: Record<string, typeof Package> = {
 CREATED: Package,
 ACTIVE: Package,
 SHIPPED: Truck,
 IN_SERVICE: Wrench,
 RECALLED: AlertTriangle,
 RECYCLED: Recycle,
 END_OF_LIFE: Recycle,
}

const LIFECYCLE_STATES = ["ALL", "CREATED", "ACTIVE", "SHIPPED", "IN_SERVICE", "RECALLED", "RECYCLED", "END_OF_LIFE"]

export default function LifecyclePage() {
 const [passports, setPassports] = useState<PassportSummary[]>([])
 const [loading, setLoading] = useState(true)
 const [statusFilter, setStatusFilter] = useState("ALL")
 const [searchTerm, setSearchTerm] = useState("")
 const [bulkAction, setBulkAction] = useState("")
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
 const [processing, setProcessing] = useState(false)

 const fetchPassports = useCallback(async () => {
 try {
 const params = new URLSearchParams({ limit: "100" })
 if (statusFilter !== "ALL") params.set("status", statusFilter)
 if (searchTerm) params.set("search", searchTerm)
 const res = await api.get(`/passports?${params.toString()}`)
 setPassports(res.data.passports || [])
 } catch {
 toast.error("Failed to load passports")
 } finally {
 setLoading(false)
 }
 }, [statusFilter, searchTerm])

 useEffect(() => {
 fetchPassports()
 }, [fetchPassports])

 const toggleSelect = (uuid: string) => {
 setSelectedIds(prev => {
 const next = new Set(prev)
 if (next.has(uuid)) next.delete(uuid)
 else next.add(uuid)
 return next
 })
 }

 const toggleAll = () => {
 if (selectedIds.size === passports.length) {
 setSelectedIds(new Set())
 } else {
 setSelectedIds(new Set(passports.map(p => p.uuid)))
 }
 }

 const handleBulkTransition = async () => {
 if (!bulkAction || selectedIds.size === 0) return
 setProcessing(true)
 try {
 await api.post("/passports/bulk/status", {
 passport_ids: Array.from(selectedIds),
 action: bulkAction,
 })
 toast.success(`${selectedIds.size} passport(s) transitioned to ${bulkAction}`)
 setSelectedIds(new Set())
 setBulkAction("")
 fetchPassports()
 } catch (error: unknown) {
 const apiErr = error as { response?: { data?: { error?: string } } }
 toast.error(apiErr?.response?.data?.error || "Bulk transition failed")
 } finally {
 setProcessing(false)
 }
 }

 // Status funnel counts
 const statusCounts = LIFECYCLE_STATES.slice(1).reduce((acc, s) => {
 acc[s] = passports.filter(p => p.status === s).length
 return acc
 }, {} as Record<string, number>)

 return (
 <div className="min-h-screen bg-background p-6">
 <div className="max-w-7xl mx-auto space-y-6">
 {/* Header */}
 <div>
 <h1 className="text-2xl text-foreground">Lifecycle Operations</h1>
 <p className="text-sm text-muted-foreground mt-1">
 Track, transition, and manage battery passports across their lifecycle
 </p>
 </div>

 {/* Status Funnel */}
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
 {LIFECYCLE_STATES.slice(1).map(status => {
 const Icon = STATUS_ICONS[status] || Package
 const isActive = statusFilter === status
 return (
 <button
 key={status}
 onClick={() => setStatusFilter(isActive ? "ALL" : status)}
 className={`p-3 rounded-lg border text-left transition-all ${
 isActive
 ? "border-foreground bg-muted ring-1 ring-border"
 : "border-border bg-card hover:border-border"
 }`}
 >
 <div className="flex items-center gap-1.5 mb-1">
 <Icon className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="text-xs font-medium text-muted-foreground">{status.replace(/_/g, " ")}</span>
 </div>
 <span className="text-lg text-foreground">{statusCounts[status] || 0}</span>
 </button>
 )
 })}
 </div>

 {/* Controls Bar */}
 <div className="flex items-center gap-3 flex-wrap">
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search by serial number or UUID..."
 className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>

 {selectedIds.size > 0 && (
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
 <select
 className="border border-border rounded-lg px-3 py-2 text-sm"
 value={bulkAction}
 onChange={(e) => setBulkAction(e.target.value)}
 >
 <option value="">Bulk action...</option>
 <option value="ACTIVATE">Activate</option>
 <option value="SHIP">Ship</option>
 <option value="INSTALL">Install</option>
 <option value="RECALL">Recall</option>
 <option value="RECYCLE">Recycle</option>
 </select>
 <button
 onClick={handleBulkTransition}
 disabled={!bulkAction || processing}
 className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
 >
 {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
 Apply
 </button>
 </div>
 )}

 <button onClick={fetchPassports} className="p-2 border border-border rounded-lg hover:bg-muted">
 <RefreshCw className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>

 {/* Passport Table */}
 <div className="bg-card border border-border rounded-lg overflow-hidden">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 ) : passports.length === 0 ? (
 <div className="text-center py-12">
 <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-foreground text-sm font-medium">No passports found</p>
 <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
 {statusFilter !== "ALL"
 ? `No passports with "${statusFilter.replace(/_/g, " ")}" status. Try a different filter.`
 : "Generate passports from a batch first, then manage their lifecycle here."}
 </p>
 {statusFilter === "ALL" && (
 <Link
 href="/batches"
 className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-medium text-white bg-[#171717] rounded-lg hover:bg-primary/90 transition-colors"
 >
 <Package className="h-4 w-4" />
 Go to Batches
 </Link>
 )}
 </div>
 ) : (
 <table className="w-full">
 <thead className="bg-muted border-b border-border">
 <tr>
 <th className="px-4 py-3 text-left">
 <input
 type="checkbox"
 checked={selectedIds.size === passports.length && passports.length > 0}
 onChange={toggleAll}
 className="rounded border-border"
 />
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Serial</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Batch</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SoH</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Updated</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {passports.map(p => {
 const colorClass = STATUS_COLORS[p.status] || STATUS_COLORS.CREATED
 return (
 <tr key={p.uuid} className="hover:bg-accent">
 <td className="px-4 py-3">
 <input
 type="checkbox"
 checked={selectedIds.has(p.uuid)}
 onChange={() => toggleSelect(p.uuid)}
 className="rounded border-border"
 />
 </td>
 <td className="px-4 py-3">
 <a href={`/p/${p.uuid}`} className="text-sm font-mono text-blue-500 hover:underline">
 {p.serial_number || p.uuid.slice(0, 12) + "…"}
 </a>
 </td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{p.batch_name || "—"}</td>
 <td className="px-4 py-3">
 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
 {p.status.replace(/_/g, " ")}
 </span>
 </td>
 <td className="px-4 py-3">
 {p.state_of_health != null ? (
 <span className={`text-sm font-medium ${
 p.state_of_health >= 80 ? "text-emerald-500" : p.state_of_health >= 60 ? "text-amber-500" : "text-red-500"
 }`}>
 {p.state_of_health}%
 </span>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </td>
 <td className="px-4 py-3 text-xs text-muted-foreground">
 {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </div>
 )
}
