"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { CreateBatchDialog } from "@/components/batches/create-batch-dialog"
import api from "@/lib/api"
import { duplicateBatch } from "@/lib/api/batches"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    MoreHorizontal,
    Search,
    Filter,
    ArrowRight,
    Download,
    Copy,
    Trash2,
    Leaf,
    Zap,
    Globe,
    Flag
} from "lucide-react"
import { toast } from "sonner"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"
type FilterType = "ALL" | "DRAFT" | "ACTIVE"

interface Batch {
    id: string
    batch_name: string
    created_at: string
    specs: any
    status?: string // DRAFT, ACTIVE, ARCHIVED
    market_region?: MarketRegion
    pli_compliant?: boolean
    total_passports?: number
    // India compliance fields
    domestic_value_add?: number
    cell_source?: 'IMPORTED' | 'DOMESTIC'
    hsn_code?: string
    bill_of_entry_no?: string
    country_of_origin?: string
}

export default function BatchesPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    const fetchBatches = async () => {
        if (!user) return
        try {
            const response = await api.get(`/batches?tenant_id=${user.tenant_id}`)
            // Ensure we sort by newest first
            const sorted = (response.data.batches || []).sort((a: Batch, b: Batch) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            setBatches(sorted)
        } catch (error) {
            console.error("Failed to fetch batches:", error)
            toast.error("Failed to load batches")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBatches()
    }, [user])

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

    // Filter batches based on search and status
    const filteredBatches = batches.filter(batch => {
        // Status Filter
        if (filter !== "ALL") {
            const status = batch.status || "DRAFT"
            if (status !== filter) return false
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                batch.batch_name.toLowerCase().includes(query) ||
                batch.id.toLowerCase().includes(query)
            )
        }

        return true
    })

    // Helper to get status dot
    const getStatusIndicator = (status: string) => {
        if (status === 'ACTIVE') {
            return (
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50" />
                    <span className="text-emerald-400 font-medium">Active</span>
                </div>
            )
        }
        return (
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-zinc-500" />
                <span className="text-zinc-500 font-medium">Draft</span>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-zinc-500">
                Loading batches...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Batches</h1>
                        <p className="text-zinc-400 text-sm">Manage production runs and compliance data.</p>
                    </div>
                    <CreateBatchDialog onBatchCreated={fetchBatches} />
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by name or ID..."
                            className="bg-black/50 border-zinc-700 pl-9 focus:border-zinc-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="h-4 w-px bg-zinc-800 mx-2" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                                <Filter className="h-4 w-4 mr-2" />
                                {filter === "ALL" ? "All Status" : filter === "ACTIVE" ? "Active" : "Draft"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                            <DropdownMenuItem onClick={() => setFilter("ALL")}>All Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("DRAFT")}>Drafts</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("ACTIVE")}>Active</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Table */}
                <div className="rounded-md border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-900 hover:bg-zinc-900">
                            <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                <TableHead className="text-zinc-400 font-medium w-[300px]">Batch Details</TableHead>
                                <TableHead className="text-zinc-400 font-medium">Market & Compliance</TableHead>
                                <TableHead className="text-zinc-400 font-medium">Specs</TableHead>
                                <TableHead className="text-zinc-400 font-medium">Volume</TableHead>
                                <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                                <TableHead className="text-right text-zinc-400 font-medium">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBatches.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500 border-zinc-800">
                                        No batches found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBatches.map((batch) => (
                                    <TableRow
                                        key={batch.id}
                                        className="border-zinc-800 hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/batches/${batch.id}`)}
                                    >
                                        {/* Column 1: Details */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors text-base">
                                                    {batch.batch_name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-zinc-500 font-mono" title={batch.id}>
                                                        {batch.id}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 text-zinc-600 hover:text-zinc-300 hover:bg-transparent p-0"
                                                        onClick={(e) => copyToClipboard(batch.id, e)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                        <span className="sr-only">Copy ID</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Column 2: Market */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    {batch.market_region === "INDIA" ? (
                                                        <span className="text-xl" title="India">🇮🇳</span>
                                                    ) : batch.market_region === "EU" ? (
                                                        <span className="text-xl" title="European Union">🇪🇺</span>
                                                    ) : (
                                                        <Globe className="h-5 w-5 text-zinc-400" />
                                                    )}

                                                    {batch.pli_compliant && (
                                                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] px-1.5 py-0 h-5 font-medium">
                                                            PLI
                                                        </Badge>
                                                    )}
                                                </div>
                                                {/* Show DVA for India batches */}
                                                {batch.market_region === "INDIA" && batch.domestic_value_add !== undefined && (
                                                    <span className={`text-[10px] font-medium ${batch.domestic_value_add >= 50 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                        DVA: {batch.domestic_value_add.toFixed(1)}%
                                                        {batch.cell_source && <span className="ml-1">({batch.cell_source === 'DOMESTIC' ? '🏭' : '📦'})</span>}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Column 3: Specs */}
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
                                                <span>{batch.specs?.chemistry || "N/A"}</span>
                                                <span className="text-zinc-700">•</span>
                                                <span>{batch.specs?.voltage ? `${batch.specs.voltage}V` : "N/A"}</span>
                                                <span className="text-zinc-700">•</span>
                                                <span>{batch.specs?.capacity || "N/A"}</span>
                                            </div>
                                        </TableCell>

                                        {/* Column 4: Volume */}
                                        <TableCell>
                                            <div className="font-medium text-zinc-300">
                                                {batch.total_passports || 0} Batteries
                                            </div>
                                        </TableCell>

                                        {/* Column 5: Status */}
                                        <TableCell>
                                            {getStatusIndicator(batch.status || 'DRAFT')}
                                        </TableCell>

                                        {/* Column 6: Actions */}
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/batches/${batch.id}`)
                                                        }}
                                                        className="cursor-pointer flex items-center focus:bg-zinc-800 focus:text-white"
                                                    >
                                                        <ArrowRight className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>

                                                    {batch.status !== 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                try {
                                                                    await api.post(`/batches/${batch.id}/activate`)
                                                                    toast.success("Batch activated successfully")
                                                                    fetchBatches()
                                                                } catch (err: any) {
                                                                    console.error(err)
                                                                    toast.error(err.response?.data?.error || "Activation failed or insufficient quota")
                                                                }
                                                            }}
                                                            className="cursor-pointer flex items-center text-amber-400 focus:text-amber-300 focus:bg-amber-400/10"
                                                        >
                                                            <Zap className="mr-2 h-4 w-4" /> Activate Batch
                                                        </DropdownMenuItem>
                                                    )}

                                                    {batch.status === 'ACTIVE' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
                                                                window.open(`${apiUrl}/batches/${batch.id}/labels?tenant_id=${user?.tenant_id}`, '_blank')
                                                            }}
                                                            className="cursor-pointer flex items-center focus:bg-zinc-800 focus:text-white"
                                                        >
                                                            <Download className="mr-2 h-4 w-4" /> Download Labels
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDuplicate(batch.id)
                                                        }}
                                                        className="cursor-pointer flex items-center focus:bg-zinc-800 focus:text-white"
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" /> Duplicate Batch
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-zinc-800" />

                                                    <DropdownMenuItem
                                                        onClick={(e) => e.stopPropagation()} // TODO: Implement delete
                                                        className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer flex items-center"
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
            </div>
        </div>
    )
}
