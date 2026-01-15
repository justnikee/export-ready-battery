"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { CreateBatchDialog } from "@/components/batches/create-batch-dialog"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, Box, Globe, Leaf, Flag, Battery, Lock, Unlock } from "lucide-react"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"
type FilterType = "ALL" | "INDIA" | "EU"

interface Batch {
    id: string
    batch_name: string
    created_at: string
    specs: any
    status?: string // DRAFT, ACTIVE, ARCHIVED
    market_region?: MarketRegion
    pli_compliant?: boolean
    total_passports?: number
}

export default function BatchesPage() {
    const { user } = useAuth()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>("ALL")

    const fetchBatches = async () => {
        if (!user) return
        try {
            const response = await api.get(`/batches?tenant_id=${user.tenant_id}`)
            setBatches(response.data.batches || [])
        } catch (error) {
            console.error("Failed to fetch batches:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBatches()
    }, [user])

    // Filter batches based on selected market
    const filteredBatches = batches.filter(batch => {
        if (filter === "ALL") return true
        return batch.market_region === filter
    })

    // Get counts for filter pills
    const indiaBatchCount = batches.filter(b => b.market_region === "INDIA").length
    const euBatchCount = batches.filter(b => b.market_region === "EU").length

    // Helper to get market badge - DARK THEME OPTIMIZED
    const getMarketBadge = (region?: MarketRegion) => {
        switch (region) {
            case "INDIA":
                return (
                    <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30">
                        🇮🇳 India
                    </Badge>
                )
            case "EU":
                return (
                    <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30">
                        🇪🇺 EU Export
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30">
                        <Globe className="h-3 w-3 mr-1" /> Global
                    </Badge>
                )
        }
    }

    // Helper to get status badge - DARK THEME OPTIMIZED
    const getStatusBadge = (batch: Batch) => {
        const status = batch.status || 'DRAFT'
        if (status === 'ACTIVE') {
            return (
                <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                    <Unlock className="h-3 w-3 mr-1" />
                    Active
                </Badge>
            )
        } else if (status === 'ARCHIVED') {
            return (
                <Badge className="bg-zinc-600 text-zinc-300 hover:bg-zinc-500">
                    Archived
                </Badge>
            )
        }
        return (
            <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                <Lock className="h-3 w-3 mr-1" />
                Draft
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Batches</h1>
                    <p className="text-zinc-400">Manage your production batches</p>
                </div>
                <CreateBatchDialog onBatchCreated={fetchBatches} />
            </div>

            {/* Market Filter Pills */}
            <div className="flex items-center gap-2">
                <Button
                    variant={filter === "ALL" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("ALL")}
                    className={`rounded-full ${filter === "ALL" ? "" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
                >
                    <Box className="h-4 w-4 mr-1.5" />
                    All ({batches.length})
                </Button>
                <Button
                    variant={filter === "INDIA" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("INDIA")}
                    className={`rounded-full ${filter === "INDIA" ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-zinc-700 text-zinc-300 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50"}`}
                >
                    🇮🇳 India ({indiaBatchCount})
                </Button>
                <Button
                    variant={filter === "EU" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("EU")}
                    className={`rounded-full ${filter === "EU" ? "bg-blue-500 hover:bg-blue-600 text-white" : "border-zinc-700 text-zinc-300 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50"}`}
                >
                    🇪🇺 EU Export ({euBatchCount})
                </Button>
            </div>

            {/* Batches Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBatches.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-zinc-500">
                        {filter === "ALL"
                            ? "No batches found. Create your first batch to get started."
                            : `No ${filter === "INDIA" ? "India" : "EU"} batches found.`
                        }
                    </div>
                ) : (
                    filteredBatches.map((batch) => (
                        <Card
                            key={batch.id}
                            className={`hover:shadow-lg hover:shadow-black/20 transition-all cursor-pointer bg-zinc-900/80 border-zinc-800 ${batch.market_region === "INDIA"
                                ? "border-l-4 border-l-orange-500"
                                : batch.market_region === "EU"
                                    ? "border-l-4 border-l-blue-500"
                                    : "border-l-4 border-l-emerald-500"
                                }`}
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-2">
                                    <CardTitle className="text-lg font-semibold text-white">
                                        {batch.batch_name}
                                    </CardTitle>
                                    {getMarketBadge(batch.market_region)}
                                </div>
                                {getStatusBadge(batch)}
                            </CardHeader>
                            <CardContent>
                                {/* Batch Info */}
                                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-2">
                                    <div className="flex items-center gap-1">
                                        <Battery className="h-4 w-4" />
                                        <span className="font-medium text-zinc-300">{batch.total_passports || 0}</span> units
                                    </div>
                                    <span className="text-zinc-600">•</span>
                                    <span>{format(new Date(batch.created_at), 'MMM d, yyyy')}</span>
                                </div>

                                {/* Specs Preview - DARK THEME */}
                                {batch.specs && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {batch.specs.chemistry && (
                                            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                                                {batch.specs.chemistry}
                                            </span>
                                        )}
                                        {batch.specs.capacity && (
                                            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                                                {batch.specs.capacity}
                                            </span>
                                        )}
                                        {batch.market_region === "EU" && batch.specs.carbon_footprint && (
                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1 border border-emerald-500/30">
                                                <Leaf className="h-3 w-3" />
                                                {batch.specs.carbon_footprint}
                                            </span>
                                        )}
                                        {batch.market_region === "INDIA" && batch.pli_compliant && (
                                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded flex items-center gap-1 border border-orange-500/30">
                                                <Flag className="h-3 w-3" />
                                                PLI Ready
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <Link href={`/batches/${batch.id}`}>
                                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            View Details
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
