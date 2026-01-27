"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { CreateBatchDialog } from "@/components/batches/create-batch-dialog"
import api from "@/lib/api"
import { duplicateBatch } from "@/lib/api/batches"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import {
    MoreHorizontal,
    Search,
    Filter,
    ArrowRight,
    Download,
    Copy,
    Trash2,
    Zap,
    Globe,
    ChevronLeft,
    ChevronRight,
    Battery,
    Package
} from "lucide-react"
import { toast } from "sonner"

// Types
type MarketRegion = "INDIA" | "EU" | "GLOBAL"
type FilterType = "ALL" | "DRAFT" | "ACTIVE"

interface Batch {
    id: string
    batch_name: string
    created_at: string
    specs: any
    status?: string
    market_region?: MarketRegion
    pli_compliant?: boolean
    total_passports?: number
    domestic_value_add?: number
    cell_source?: 'IMPORTED' | 'DOMESTIC'
    hsn_code?: string
    bill_of_entry_no?: string
    country_of_origin?: string
}

const ITEMS_PER_PAGE = 50 // Server-side pagination limit

export default function BatchesPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [currentPage, setCurrentPage] = useState(1)
    const [isDeleting, setIsDeleting] = useState(false)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    const fetchBatches = async (page = 1) => {
        if (!user) return
        try {
            setLoading(true)
            const response = await api.get(`/batches?tenant_id=${user.tenant_id}&page=${page}&limit=${ITEMS_PER_PAGE}`)
            setBatches(response.data.batches || [])
            setTotalCount(response.data.total || 0)
            setTotalPages(response.data.total_pages || 1)
        } catch (error) {
            console.error("Failed to fetch batches:", error)
            toast.error("Failed to load batches")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBatches(currentPage)
    }, [user?.tenant_id, currentPage])

    // Filter batches client-side for search (server already sorts by created_at DESC)
    const filteredBatches = batches.filter(batch => {
        if (filter !== "ALL") {
            const status = batch.status || "DRAFT"
            if (status !== filter) return false
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                batch.batch_name.toLowerCase().includes(query) ||
                batch.id.toLowerCase().includes(query)
            )
        }
        return true
    })

    // Use server-provided pagination, client filtering is just for search within current page
    const paginatedBatches = filteredBatches

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [filter, searchQuery])

    // Selection handlers
    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedBatches.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(paginatedBatches.map(b => b.id)))
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return

        const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} batch(es)? This action cannot be undone.`)
        if (!confirmed) return

        setIsDeleting(true)
        try {
            // Delete one by one (or implement bulk endpoint if available)
            const deletePromises = Array.from(selectedIds).map(id =>
                api.delete(`/batches/${id}`)
            )
            await Promise.all(deletePromises)
            toast.success(`Successfully deleted ${selectedIds.size} batch(es)`)
            setSelectedIds(new Set())
            fetchBatches()
        } catch (error) {
            console.error("Delete failed:", error)
            toast.error("Failed to delete some batches")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDuplicate = async (batchId: string) => {
        try {
            await duplicateBatch(batchId)
            toast.success("Batch duplicated successfully")
            fetchBatches()
        } catch (error) {
            console.error("Duplicate failed:", error)
            toast.error("Failed to duplicate batch")
        }
    }

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        toast.success("ID copied to clipboard")
    }

    const getStatusBadge = (status: string) => {
        if (status === 'ACTIVE') {
            return (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium px-3 py-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_6px] shadow-emerald-500/50" />
                    Active
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="text-slate-400 border-slate-600 font-medium px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-slate-500 mr-2" />
                Draft
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    Loading batches...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                <Battery className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Production Batches</h1>
                                <p className="text-slate-400 mt-1">Manage battery production runs and passport generation</p>
                            </div>
                        </div>
                        <CreateBatchDialog onBatchCreated={fetchBatches} />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{batches.length}</p>
                            <p className="text-sm text-slate-500">Total Batches</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_10px] shadow-emerald-500/60" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-emerald-400">{batches.filter(b => b.status === 'ACTIVE').length}</p>
                            <p className="text-sm text-slate-500">Active</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full bg-slate-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-300">{batches.filter(b => b.status !== 'ACTIVE').length}</p>
                            <p className="text-sm text-slate-500">Drafts</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search batches..."
                                className="bg-slate-900 border-slate-700 pl-10 h-10 focus:border-emerald-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-10">
                                    <Filter className="h-4 w-4 mr-2" />
                                    {filter === "ALL" ? "All Status" : filter === "ACTIVE" ? "Active" : "Draft"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-200">
                                <DropdownMenuItem onClick={() => setFilter("ALL")}>All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter("DRAFT")}>Drafts Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter("ACTIVE")}>Active Only</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">
                                {selectedIds.size} selected
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting ? "Deleting..." : "Delete Selected"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                                <TableHead className="w-12 pl-4">
                                    <Checkbox
                                        checked={paginatedBatches.length > 0 && selectedIds.size === paginatedBatches.length}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                </TableHead>
                                <TableHead className="text-slate-300 font-semibold text-sm py-4">Batch Name</TableHead>
                                <TableHead className="text-slate-300 font-semibold text-sm py-4">Market</TableHead>
                                <TableHead className="text-slate-300 font-semibold text-sm py-4">Specifications</TableHead>
                                <TableHead className="text-slate-300 font-semibold text-sm py-4">Passports</TableHead>
                                <TableHead className="text-slate-300 font-semibold text-sm py-4">Status</TableHead>
                                <TableHead className="text-right text-slate-300 font-semibold text-sm py-4 pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBatches.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="h-32 text-center text-slate-500 border-slate-800">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="h-8 w-8 text-slate-600" />
                                            <span>No batches found</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedBatches.map((batch) => (
                                    <TableRow
                                        key={batch.id}
                                        className={`border-slate-800 hover:bg-slate-800/50 transition-colors group cursor-pointer ${selectedIds.has(batch.id) ? 'bg-emerald-500/5' : ''
                                            }`}
                                        onClick={() => router.push(`/batches/${batch.id}`)}
                                    >
                                        {/* Checkbox */}
                                        <TableCell className="pl-4 py-5" onClick={(e) => toggleSelect(batch.id, e)}>
                                            <Checkbox
                                                checked={selectedIds.has(batch.id)}
                                                className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                            />
                                        </TableCell>

                                        {/* Batch Name */}
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-white text-base group-hover:text-emerald-400 transition-colors">
                                                    {batch.batch_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-0.5 rounded">
                                                        {batch.id.substring(0, 8)}...
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                                        onClick={(e) => copyToClipboard(batch.id, e)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Market */}
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-3">
                                                {/* SVG Flag Icons */}
                                                {batch.market_region === "INDIA" ? (
                                                    <span className="fi fi-in text-2xl rounded shadow-sm" title="India" />
                                                ) : batch.market_region === "EU" ? (
                                                    <span className="fi fi-eu text-2xl rounded shadow-sm" title="European Union" />
                                                ) : (
                                                    <Globe className="h-6 w-6 text-slate-400" />
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-white font-medium">
                                                        {batch.market_region === "INDIA" ? "India" :
                                                            batch.market_region === "EU" ? "European Union" : "Global"}
                                                    </span>
                                                    {batch.pli_compliant && (
                                                        <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/25 text-xs px-2 py-0 h-5 w-fit mt-1">
                                                            PLI Eligible
                                                        </Badge>
                                                    )}
                                                    {batch.domestic_value_add !== undefined && batch.market_region === "INDIA" && (
                                                        <span className={`text-xs mt-1 ${batch.domestic_value_add >= 50 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                            DVA: {batch.domestic_value_add.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Specs */}
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm text-white font-medium">
                                                    {batch.specs?.chemistry || "N/A"}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {batch.specs?.voltage ? `${batch.specs.voltage}V` : ""}
                                                    {batch.specs?.voltage && batch.specs?.capacity ? " • " : ""}
                                                    {batch.specs?.capacity || ""}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Passports */}
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-white">
                                                    {(batch.total_passports || 0).toLocaleString()}
                                                </span>
                                                <span className="text-sm text-slate-500">units</span>
                                            </div>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="py-5">
                                            {getStatusBadge(batch.status || 'DRAFT')}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right pr-4 py-5">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 min-w-[180px]">
                                                    <DropdownMenuLabel className="text-slate-400">Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/batches/${batch.id}`)
                                                        }}
                                                        className="cursor-pointer focus:bg-slate-800"
                                                    >
                                                        <ArrowRight className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>

                                                    {batch.status !== 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                try {
                                                                    await api.post(`/batches/${batch.id}/activate`)
                                                                    toast.success("Batch activated!")
                                                                    fetchBatches()
                                                                } catch (err: any) {
                                                                    toast.error(err.response?.data?.error || "Activation failed")
                                                                }
                                                            }}
                                                            className="cursor-pointer text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10"
                                                        >
                                                            <Zap className="mr-2 h-4 w-4" /> Activate
                                                        </DropdownMenuItem>
                                                    )}

                                                    {batch.status === 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
                                                                window.open(`${apiUrl}/batches/${batch.id}/labels?tenant_id=${user?.tenant_id}`, '_blank')
                                                            }}
                                                            className="cursor-pointer focus:bg-slate-800"
                                                        >
                                                            <Download className="mr-2 h-4 w-4" /> Download Labels
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDuplicate(batch.id)
                                                        }}
                                                        className="cursor-pointer focus:bg-slate-800"
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-slate-800" />

                                                    <DropdownMenuItem
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            if (confirm("Delete this batch?")) {
                                                                try {
                                                                    await api.delete(`/batches/${batch.id}`)
                                                                    toast.success("Batch deleted")
                                                                    fetchBatches()
                                                                } catch (err) {
                                                                    toast.error("Failed to delete batch")
                                                                }
                                                            }
                                                        }}
                                                        className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                        <p className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredBatches.length)} of {filteredBatches.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number
                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = currentPage - 2 + i
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === currentPage ? "default" : "ghost"}
                                            size="sm"
                                            className={`w-9 h-9 p-0 ${pageNum === currentPage
                                                ? "bg-emerald-500 hover:bg-emerald-600"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                                }`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
