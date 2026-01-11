"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UploadCSV } from "@/components/batches/upload-csv"
import { ArrowLeft, Download, QrCode, FileSpreadsheet, ChevronLeft, ChevronRight, Leaf, Flag, Globe, AlertTriangle, CheckCircle, Zap, Printer } from "lucide-react"
import { PassportList } from "@/components/batches/passport-list"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
}

export default function BatchDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [batch, setBatch] = useState<any>(null)
    const [passportCount, setPassportCount] = useState<number>(0)
    const [passports, setPassports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false
    })

    const fetchBatch = async () => {
        try {
            const response = await api.get(`/batches/${params.id}`)
            setBatch(response.data.batch)
            setPassportCount(response.data.passport_count || 0)
        } catch (error) {
            console.error("Failed to fetch batch:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPassports = async (page = 1, limit = 50) => {
        try {
            const response = await api.get(`/batches/${params.id}/passports?page=${page}&limit=${limit}`)
            setPassports(response.data.passports || [])
            setPagination({
                page: response.data.page || 1,
                limit: response.data.limit || 50,
                total: response.data.total || 0,
                totalPages: response.data.total_pages || 0,
                hasMore: response.data.has_more || false
            })
        } catch (error) {
            console.error("Failed to fetch passports:", error)
        }
    }

    useEffect(() => {
        fetchBatch()
        fetchPassports(1, 50)
    }, [params.id])

    const handleUploadComplete = () => {
        fetchBatch()
        fetchPassports(1, 50)
    }

    const handlePageChange = (newPage: number) => {
        fetchPassports(newPage, pagination.limit)
    }

    const handleDownloadQR = () => {
        const download = async () => {
            try {
                const response = await api.get(`/batches/${params.id}/download`, {
                    responseType: 'blob'
                })

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${batch.batch_name}_qrcodes.zip`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (error) {
                console.error("Failed to download QR codes", error)
                alert("Failed to download QR codes")
            }
        }
        download()
    }

    const handleDownloadLabels = async () => {
        try {
            const response = await api.get(`/batches/${params.id}/labels`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${batch.batch_name}_labels.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download labels", error)
            alert("Failed to download labels")
        }
    }

    const handleExportCSV = async () => {
        try {
            const response = await api.get(`/batches/${params.id}/export`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${batch.batch_name}_serial_export.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CSV", error)
            alert("Failed to export CSV")
        }
    }

    // Determine compliance status
    const getComplianceBadge = () => {
        const region = batch?.market_region as MarketRegion
        const specs = batch?.specs || {}

        if (region === "INDIA") {
            return (
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-300 text-sm px-3 py-1">
                    🇮🇳 PLI Ready
                </Badge>
            )
        } else if (region === "EU") {
            const hasCarbon = specs.carbon_footprint && specs.carbon_footprint !== ""
            if (hasCarbon) {
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300 text-sm px-3 py-1">
                        🇪🇺 EU Compliant
                    </Badge>
                )
            } else {
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300 text-sm px-3 py-1">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Compliance Pending
                    </Badge>
                )
            }
        } else {
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300 text-sm px-3 py-1">
                    <Globe className="h-3 w-3 mr-1" /> Global
                </Badge>
            )
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    )
    if (!batch) return <div className="p-8">Batch not found</div>

    const region = batch.market_region as MarketRegion
    const isIndia = region === "INDIA"
    const isEU = region === "EU"

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header with Compliance Badge */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{batch.batch_name}</h1>
                            {getComplianceBadge()}
                        </div>
                        <p className="text-muted-foreground text-sm">Created on {new Date(batch.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Common Specifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-slate-600" />
                                Core Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                                <div>
                                    <dt className="text-muted-foreground mb-1">Manufacturer</dt>
                                    <dd className="font-medium">{batch.specs.manufacturer || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Chemistry</dt>
                                    <dd className="font-medium">{batch.specs.chemistry || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Capacity</dt>
                                    <dd className="font-medium">{batch.specs.capacity || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Voltage</dt>
                                    <dd className="font-medium">{batch.specs.voltage || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Weight</dt>
                                    <dd className="font-medium">{batch.specs.weight || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Country of Origin</dt>
                                    <dd className="font-medium">{batch.specs.country_of_origin || 'N/A'}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Market-Specific Compliance Card */}
                    {isIndia && (
                        <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-800">
                                    <Flag className="h-5 w-5" />
                                    🇮🇳 India Compliance (Battery Aadhaar)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                    <div>
                                        <dt className="text-orange-700 mb-1">Domestic Value Add</dt>
                                        <dd className="font-semibold text-orange-900">
                                            {batch.domestic_value_add ? `${batch.domestic_value_add}%` : 'Not specified'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-orange-700 mb-1">Cell Source</dt>
                                        <dd className="font-semibold text-orange-900">
                                            {batch.cell_source === "DOMESTIC" ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    Domestic
                                                </span>
                                            ) : batch.cell_source === "IMPORTED" ? (
                                                "Imported"
                                            ) : 'Not specified'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-orange-700 mb-1">PLI Subsidy Eligible</dt>
                                        <dd className="font-semibold text-orange-900">
                                            {batch.pli_compliant ? (
                                                <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                            ) : (
                                                <Badge variant="secondary">No</Badge>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-orange-700 mb-1">Serial Format</dt>
                                        <dd className="font-mono text-xs bg-orange-100 px-2 py-1 rounded text-orange-900">
                                            IN-NKY-LFP-2026-XXXXX
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    )}

                    {isEU && (
                        <Card className="border-blue-200 bg-blue-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                    <Leaf className="h-5 w-5" />
                                    🇪🇺 EU Compliance (Battery Passport)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                    <div>
                                        <dt className="text-blue-700 mb-1">Carbon Footprint</dt>
                                        <dd className="font-semibold text-blue-900 flex items-center gap-2">
                                            {batch.specs.carbon_footprint || 'Not specified'}
                                            {batch.specs.carbon_footprint && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                    CO₂e Certified
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-blue-700 mb-1">Recyclable</dt>
                                        <dd className="font-semibold text-blue-900">
                                            {batch.specs.recyclable ? (
                                                <Badge className="bg-green-100 text-green-800">♻️ Yes</Badge>
                                            ) : (
                                                <Badge variant="secondary">No</Badge>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-blue-700 mb-1">Certifications</dt>
                                        <dd className="flex gap-1 flex-wrap">
                                            {batch.specs.certifications?.length > 0 ? (
                                                batch.specs.certifications.map((cert: string) => (
                                                    <Badge key={cert} variant="outline" className="text-xs">
                                                        {cert}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge className="bg-blue-100 text-blue-700">CE</Badge>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-blue-700 mb-1">Material Data</dt>
                                        <dd className="font-semibold text-blue-900">
                                            {batch.materials ? 'Available' : (
                                                <span className="text-yellow-600 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upload Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5" />
                                Upload Data
                            </CardTitle>
                            <CardDescription>
                                Upload a CSV file containing passport data for this batch.
                                {isIndia && (
                                    <span className="block mt-1 text-orange-600 font-medium">
                                        💡 Auto-generates BPAN format: IN-NKY-{batch.specs.chemistry}-2026-00001 to ...{passportCount || 'N'}
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UploadCSV batchId={batch.id} onUploadComplete={handleUploadComplete} />
                        </CardContent>
                    </Card>
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full" onClick={handleDownloadQR} variant="outline">
                                <QrCode className="mr-2 h-4 w-4" />
                                Download QR Codes (ZIP)
                            </Button>
                            <Button className="w-full" onClick={handleDownloadLabels} variant="outline">
                                <Printer className="mr-2 h-4 w-4" />
                                Download PDF Labels
                            </Button>
                            <Button className="w-full" onClick={handleExportCSV} variant="outline">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export Serial List (CSV)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className={`${isIndia ? "bg-orange-50/50 border-orange-100" :
                        isEU ? "bg-blue-50/50 border-blue-100" :
                            "bg-green-50/50 border-green-100"
                        }`}>
                        <CardHeader>
                            <CardTitle className={`${isIndia ? "text-orange-900" :
                                isEU ? "text-blue-900" :
                                    "text-green-900"
                                }`}>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${isIndia ? "text-orange-700" :
                                isEU ? "text-blue-700" :
                                    "text-green-700"
                                }`}>
                                {passportCount.toLocaleString()}
                            </div>
                            <p className={`text-xs mt-1 ${isIndia ? "text-orange-600" :
                                isEU ? "text-blue-600" :
                                    "text-green-600"
                                }`}>
                                {isIndia ? "Battery Aadhaar IDs" : isEU ? "EU Passports" : "Total Passports"} Generated
                            </p>
                        </CardContent>
                    </Card>

                    {/* Market Info Badge */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-4xl mb-2">
                                    {isIndia ? "🇮🇳" : isEU ? "🇪🇺" : "🌍"}
                                </div>
                                <p className="font-semibold">
                                    {isIndia ? "India Market" : isEU ? "EU Export" : "Global"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isIndia ? "Battery Aadhaar Compliant" : isEU ? "EU Battery Regulation" : "Multi-Market Ready"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Passports List Table with Pagination */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold tracking-tight">Generated Passports</h2>
                    {pagination.total > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
                        </p>
                    )}
                </div>

                <PassportList passports={passports} />

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum: number
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i
                                } else {
                                    pageNum = pagination.page - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === pagination.page ? "default" : "ghost"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasMore}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
