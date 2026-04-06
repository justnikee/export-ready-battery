"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { CreateBatchDialog } from "@/components/batches/create-batch-dialog"
import { TemplatesDialog } from "@/components/batches/templates-dialog"
import api from "@/lib/api"
import { duplicateBatch } from "@/lib/api/batches"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    Package,
    Archive
} from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Batch } from "@/lib/types"

import { BatchesListSkeleton } from "@/components/batches/BatchesListSkeleton"

// Types
type MarketRegion = "INDIA" | "EU" | "GLOBAL"
type FilterType = "ALL" | "DRAFT" | "ACTIVE" | "ARCHIVED"

interface BatchesResponse {
    batches: Batch[]
    total?: number
    total_pages?: number
}

interface ApiError {
    response?: {
        data?: {
            error?: string
        }
    }
}

const toApiError = (error: unknown): ApiError => {
    if (typeof error === "object" && error !== null) {
        return error as ApiError
    }
    return {}
}

const ITEMS_PER_PAGE = 50

export default function BatchesPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [batchToArchive, setBatchToArchive] = useState<Batch | null>(null)
    const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null)

    const fetchBatches = useCallback(async (page = 1) => {
        if (!user) return
        try {
            setLoading(true)
            const response = await api.get<BatchesResponse>(`/batches?tenant_id=${user.tenant_id}&page=${page}&limit=${ITEMS_PER_PAGE}`)
            setBatches(response.data.batches || [])
            setTotalCount(response.data.total || 0)
            setTotalPages(response.data.total_pages || 1)
        } catch (error: unknown) {
            console.error("Failed to fetch batches:", error)
            toast.error("Failed to load batches")
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchBatches(currentPage)
    }, [currentPage, fetchBatches])

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

    const paginatedBatches = filteredBatches

    useEffect(() => {
        setCurrentPage(1)
    }, [filter, searchQuery])



    const handleDuplicate = async (batchId: string) => {
        try {
            await duplicateBatch(batchId)
            toast.success("Batch duplicated successfully")
            fetchBatches()
        } catch (error: unknown) {
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                </span>
            )
        }
        if (status === 'ARCHIVED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Archived
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                Draft
            </span>
        )
    }

    const getMarketBadge = (region: MarketRegion | undefined) => {
        if (region === 'INDIA') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                    <span className="w-3 h-3 rounded-full bg-linear-to-br from-orange-400 to-green-500 shrink-0" />
                    India
                </span>
            )
        }
        if (region === 'EU') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-3 h-3 rounded-full bg-linear-to-br from-blue-400 to-blue-600 shrink-0" />
                    EU
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <Globe className="h-3 w-3" />
                Global
            </span>
        )
    }

    if (loading) {
        return <BatchesListSkeleton />
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Production Batches</h1>
                        <p className="text-sm text-zinc-500 mt-1">Manage battery production runs and passport generation</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <TemplatesDialog />
                        <CreateBatchDialog onBatchCreated={fetchBatches} />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-zinc-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-zinc-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-zinc-900">{totalCount}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Batches</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-emerald-600">{batches.filter(b => b.status === 'ACTIVE').length}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Active</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-zinc-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                            <Battery className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-zinc-600">{batches.filter(b => b.status !== 'ACTIVE').length}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">Drafts</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search batches..."
                                className="bg-white border-zinc-200 pl-10 h-9 text-sm focus:border-zinc-400 focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 h-9 text-sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    {filter === "ALL" ? "All Status" : filter === "ACTIVE" ? "Active" : filter === "ARCHIVED" ? "Archived" : "Draft"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-white border border-zinc-200 shadow-lg min-w-[140px]">
                                <DropdownMenuItem
                                    onClick={() => setFilter("ALL")}
                                    className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                >
                                    All Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilter("DRAFT")}
                                    className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                >
                                    Drafts Only
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilter("ACTIVE")}
                                    className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                >
                                    Active Only
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilter("ARCHIVED")}
                                    className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                >
                                    Archived
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>


                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Batch Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Market</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Specifications</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Passports</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {paginatedBatches.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="h-48 text-center text-zinc-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package className="h-10 w-10 text-zinc-300" />
                                            <div>
                                                <p className="text-sm font-medium text-zinc-700">No batches found</p>
                                                <p className="text-xs text-zinc-500 mt-1">Create your first production batch to start generating battery passports</p>
                                            </div>
                                            <CreateBatchDialog onBatchCreated={fetchBatches} />
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedBatches.map((batch) => (
                                    <tr
                                        key={batch.id}
                                        className="hover:bg-zinc-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/batches/${batch.id}`)}
                                    >

                                        {/* Batch Name */}
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-zinc-900 hover:text-zinc-700">
                                                    {batch.batch_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs text-zinc-600 font-mono bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
                                                        {batch.id.substring(0, 14)}...
                                                    </code>
                                                    <button
                                                        className="text-zinc-400 hover:text-zinc-600"
                                                        onClick={(e) => copyToClipboard(batch.id, e)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Market */}
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {getMarketBadge(batch.market_region)}
                                                {batch.pli_compliant && (
                                                    <span className="text-xs text-orange-600 font-medium">PLI Eligible</span>
                                                )}
                                                {batch.domestic_value_add !== undefined && batch.market_region === "INDIA" && (
                                                    <span className={`text-xs ${batch.domestic_value_add >= 50 ? 'text-emerald-600' : 'text-zinc-500'}`}>
                                                        DVA: {batch.domestic_value_add.toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Specs */}
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm text-zinc-900 font-medium">
                                                    {batch.specs?.chemistry || "N/A"}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {batch.specs?.voltage ? `${batch.specs.voltage}V` : ""}
                                                    {batch.specs?.voltage && batch.specs?.capacity ? " • " : ""}
                                                    {batch.specs?.capacity || ""}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Passports */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-semibold text-zinc-900">
                                                    {(batch.total_passports || 0).toLocaleString()}
                                                </span>
                                                <span className="text-xs text-zinc-500">units</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4">
                                            {getStatusBadge(batch.status || 'DRAFT')}
                                        </td>

                                        {/* Actions */}
                                        <td className="text-right pr-4 py-4">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <button className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-zinc-200 shadow-lg min-w-[180px]">
                                                    <DropdownMenuLabel className="text-zinc-500 text-xs uppercase tracking-wider">Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/batches/${batch.id}`)
                                                        }}
                                                        className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
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
                                                                } catch (err: unknown) {
                                                                    const apiError = toApiError(err)
                                                                    toast.error(apiError.response?.data?.error || "Activation failed")
                                                                }
                                                            }}
                                                            className="cursor-pointer text-emerald-600 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700"
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
                                                            className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                                        >
                                                            <Download className="mr-2 h-4 w-4" /> Download Labels
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDuplicate(batch.id)
                                                        }}
                                                        className="cursor-pointer text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900"
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-zinc-200" />

                                                    {/* Archive - only for ACTIVE batches */}
                                                    {batch.status === 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setBatchToArchive(batch)
                                                            }}
                                                            className="cursor-pointer text-amber-600 hover:bg-amber-50 focus:bg-amber-50 focus:text-amber-700"
                                                        >
                                                            <Archive className="mr-2 h-4 w-4" /> Archive
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* Delete Draft - only for DRAFT batches with 0 passports */}
                                                    {batch.status !== 'ACTIVE' && batch.status !== 'ARCHIVED' && (batch.total_passports || 0) === 0 && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setBatchToDelete(batch)
                                                            }}
                                                            className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 h-8"
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
                                            className={`w-8 h-8 p-0 ${pageNum === currentPage
                                                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
                                className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 h-8"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={!!batchToArchive}
                onOpenChange={(open) => !open && setBatchToArchive(null)}
                title="Archive this batch?"
                description="Archived batches remain available for audit and compliance purposes but cannot generate new passports."
                confirmText="Archive Batch"
                onConfirm={async () => {
                    if (batchToArchive) {
                        try {
                            await api.post(`/batches/${batchToArchive.id}/archive`)
                            toast.success("Batch archived successfully")
                            fetchBatches()
                        } catch (err: unknown) {
                            const apiError = toApiError(err)
                            toast.error(apiError.response?.data?.error || "Failed to archive batch")
                        } finally {
                            setBatchToArchive(null)
                        }
                    }
                }}
            />

            <ConfirmDialog
                open={!!batchToDelete}
                onOpenChange={(open) => !open && setBatchToDelete(null)}
                title="Delete this draft batch?"
                description="This action cannot be undone. All data associated with this draft will be permanently removed."
                confirmText="Delete Draft"
                variant="destructive"
                onConfirm={async () => {
                    if (batchToDelete) {
                        try {
                            await api.delete(`/batches/${batchToDelete.id}/draft`)
                            toast.success("Draft batch deleted")
                            fetchBatches()
                        } catch (err: unknown) {
                            const apiError = toApiError(err)
                            toast.error(apiError.response?.data?.error || "Failed to delete batch")
                        } finally {
                            setBatchToDelete(null)
                        }
                    }
                }}
            />
        </div>
    )
}
