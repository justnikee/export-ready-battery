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
import { ArrowRight, Box, Globe, Leaf, Flag, Battery } from "lucide-react"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"
type FilterType = "ALL" | "INDIA" | "EU"

interface Batch {
    id: string
    batch_name: string
    created_at: string
    specs: any
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

    // Helper to get market badge
    const getMarketBadge = (region?: MarketRegion) => {
        switch (region) {
            case "INDIA":
                return (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                        🇮🇳 India
                    </Badge>
                )
            case "EU":
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                        🇪🇺 EU Export
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        <Globe className="h-3 w-3 mr-1" /> Global
                    </Badge>
                )
        }
    }

    // Helper to get status badge
    const getStatusBadge = (batch: Batch) => {
        const hasPassports = batch.total_passports && batch.total_passports > 0
        if (hasPassports) {
            return (
                <Badge className="bg-green-500 text-white hover:bg-green-500">
                    Ready
                </Badge>
            )
        }
        return (
            <Badge variant="secondary" className="animate-pulse">
                Processing...
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
                    <p className="text-muted-foreground">Manage your production batches</p>
                </div>
                <CreateBatchDialog onBatchCreated={fetchBatches} />
            </div>

            {/* Market Filter Pills */}
            <div className="flex items-center gap-2">
                <Button
                    variant={filter === "ALL" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("ALL")}
                    className="rounded-full"
                >
                    <Box className="h-4 w-4 mr-1.5" />
                    All ({batches.length})
                </Button>
                <Button
                    variant={filter === "INDIA" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("INDIA")}
                    className={`rounded-full ${filter === "INDIA" ? "bg-orange-500 hover:bg-orange-600" : "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"}`}
                >
                    🇮🇳 India ({indiaBatchCount})
                </Button>
                <Button
                    variant={filter === "EU" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("EU")}
                    className={`rounded-full ${filter === "EU" ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"}`}
                >
                    🇪🇺 EU Export ({euBatchCount})
                </Button>
            </div>

            {/* Batches Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBatches.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground">
                        {filter === "ALL"
                            ? "No batches found. Create your first batch to get started."
                            : `No ${filter === "INDIA" ? "India" : "EU"} batches found.`
                        }
                    </div>
                ) : (
                    filteredBatches.map((batch) => (
                        <Card
                            key={batch.id}
                            className={`hover:shadow-md transition-all cursor-pointer ${batch.market_region === "INDIA"
                                    ? "border-l-4 border-l-orange-400"
                                    : batch.market_region === "EU"
                                        ? "border-l-4 border-l-blue-400"
                                        : "border-l-4 border-l-green-400"
                                }`}
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-semibold">
                                        {batch.batch_name}
                                    </CardTitle>
                                    {getMarketBadge(batch.market_region)}
                                </div>
                                {getStatusBadge(batch)}
                            </CardHeader>
                            <CardContent>
                                {/* Batch Info */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                    <div className="flex items-center gap-1">
                                        <Battery className="h-4 w-4" />
                                        <span className="font-medium">{batch.total_passports || 0}</span> units
                                    </div>
                                    <span>•</span>
                                    <span>{format(new Date(batch.created_at), 'MMM d, yyyy')}</span>
                                </div>

                                {/* Specs Preview */}
                                {batch.specs && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {batch.specs.chemistry && (
                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                {batch.specs.chemistry}
                                            </span>
                                        )}
                                        {batch.specs.capacity && (
                                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                                                {batch.specs.capacity}
                                            </span>
                                        )}
                                        {batch.market_region === "EU" && batch.specs.carbon_footprint && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Leaf className="h-3 w-3" />
                                                {batch.specs.carbon_footprint}
                                            </span>
                                        )}
                                        {batch.market_region === "INDIA" && batch.pli_compliant && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Flag className="h-3 w-3" />
                                                PLI Ready
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end">
                                    <Link href={`/batches/${batch.id}`}>
                                        <Button variant="outline" size="sm">
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
