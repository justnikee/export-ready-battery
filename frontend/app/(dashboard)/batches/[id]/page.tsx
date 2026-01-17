"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UploadCSV } from "@/components/batches/upload-csv"
import { ArrowLeft, Download, QrCode, FileSpreadsheet, ChevronLeft, ChevronRight, Leaf, Flag, Globe, AlertTriangle, CheckCircle, Zap, Printer, Factory, Scale, Atom, Battery, FileText, Lock, Unlock, Clock } from "lucide-react"
import { PassportList } from "@/components/batches/passport-list"
import { DownloadLabelsDialog } from "@/components/batches/DownloadLabelsDialog"
import { toast } from "sonner"

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
    const { refreshUser } = useAuth()
    const [batch, setBatch] = useState<any>(null)
    const [activating, setActivating] = useState(false)
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
    const [labelsDialogOpen, setLabelsDialogOpen] = useState(false)

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
        } catch (error: any) {
            console.error("Failed to download labels", error)
            if (error.response?.status === 403) {
                toast.error("⚠️ You must Activate this batch before downloading labels.", {
                    description: "Click 'Activate Batch' to unlock downloads.",
                    duration: 5000
                })
            } else {
                toast.error(error.response?.data?.error || "Failed to download labels")
            }
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

    // Determine compliance status - DARK THEME
    const getComplianceBadge = () => {
        const region = batch?.market_region as MarketRegion
        const specs = batch?.specs || {}

        if (region === "INDIA") {
            return (
                <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30 text-sm px-3 py-1">
                    🇮🇳 PLI Ready
                </Badge>
            )
        } else if (region === "EU") {
            const hasCarbon = specs.carbon_footprint && specs.carbon_footprint !== ""
            if (hasCarbon) {
                return (
                    <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30 text-sm px-3 py-1">
                        🇪🇺 EU Compliant
                    </Badge>
                )
            } else {
                return (
                    <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 text-sm px-3 py-1">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Compliance Pending
                    </Badge>
                )
            }
        } else {
            return (
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 text-sm px-3 py-1">
                    <Globe className="h-3 w-3 mr-1" /> Global
                </Badge>
            )
        }
    }

    // Batch status badge
    const getStatusBadge = () => {
        const status = batch?.status || 'DRAFT'
        if (status === 'ACTIVE') {
            return (
                <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30 text-sm px-3 py-1">
                    <Unlock className="h-3 w-3 mr-1" />
                    Active
                </Badge>
            )
        } else if (status === 'ARCHIVED') {
            return (
                <Badge className="bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 border-zinc-500/30 text-sm px-3 py-1">
                    Archived
                </Badge>
            )
        } else {
            return (
                <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 text-sm px-3 py-1">
                    <Lock className="h-3 w-3 mr-1" />
                    Draft
                </Badge>
            )
        }
    }

    const handleActivateBatch = async () => {
        setActivating(true)
        try {
            const response = await api.post(`/batches/${params.id}/activate`)
            toast.success('Batch activated successfully!')
            await fetchBatch()
            await refreshUser()
        } catch (error: any) {
            console.error('Failed to activate batch:', error)
            if (error.response?.status === 402) {
                toast.error('Insufficient quota. Please purchase more quota units.')
                router.push('/billing')
            } else {
                toast.error(error.response?.data?.error || 'Failed to activate batch')
            }
        } finally {
            setActivating(false)
        }
    }

    const isDraft = batch?.status !== 'ACTIVE' && batch?.status !== 'ARCHIVED'

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
    )
    if (!batch) return <div className="p-8 text-zinc-400">Batch not found</div>

    const region = batch.market_region as MarketRegion
    const isIndia = region === "INDIA"
    const isEU = region === "EU"

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header with Compliance Badge */}
                <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-linear-to-r from-emerald-900/20 via-zinc-900 to-zinc-900 p-6">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/batches')} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{batch.batch_name}</h1>
                                    {getStatusBadge()}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {getComplianceBadge()}
                                    <span className="text-zinc-500 text-sm flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Created {new Date(batch.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {isDraft ? (
                                <Button
                                    onClick={handleActivateBatch}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    disabled={activating}
                                >
                                    {activating ? (
                                        <>
                                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Activating...
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="mr-2 h-4 w-4" />
                                            Activate Batch
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setLabelsDialogOpen(true)}
                                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Labels
                                    </Button>
                                    <Button
                                        onClick={handleDownloadQR}
                                        className="bg-zinc-100 text-zinc-900 hover:bg-white"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download QR Codes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Common Specifications - DARK THEME */}
                        <Card className="bg-zinc-900/80 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Battery className="h-5 w-5 text-blue-400" />
                                    </div>
                                    Core Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                        <dt className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Manufacturer</dt>
                                        <dd className="font-semibold text-white">{batch.specs.manufacturer || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                        <dt className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Chemistry</dt>
                                        <dd className="font-semibold text-white">{batch.specs.chemistry || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                        <dt className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Capacity</dt>
                                        <dd className="font-semibold text-emerald-400">{batch.specs.capacity || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                        <dt className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Voltage</dt>
                                        <dd className="font-semibold text-white">{batch.specs.voltage || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                        <dt className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Weight</dt>
                                        <dd className="font-semibold text-white">{batch.specs.weight || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                        <dt className="text-zinc-500 mb-1 text-xs uppercase tracking-wider">Country of Origin</dt>
                                        <dd className="font-semibold text-white">{batch.specs.country_of_origin || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Market-Specific Compliance Card - INDIA DARK THEME */}
                        {isIndia && (
                            <Card className="bg-zinc-900/80 border-zinc-800 border-l-4 border-l-orange-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <div className="p-2 rounded-lg bg-orange-500/10">
                                            <Flag className="h-5 w-5 text-orange-400" />
                                        </div>
                                        🇮🇳 India Compliance (Battery Aadhaar)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Scale className="h-3.5 w-3.5 text-orange-400" />
                                                Domestic Value Add
                                            </dt>
                                            <dd className="font-bold text-2xl text-orange-400">
                                                {batch.domestic_value_add ? `${batch.domestic_value_add}%` : 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Factory className="h-3.5 w-3.5 text-orange-400" />
                                                Cell Source
                                            </dt>
                                            <dd className="font-semibold text-white">
                                                {batch.cell_source === "DOMESTIC" ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                                                        <span className="text-emerald-400">Domestic</span>
                                                    </span>
                                                ) : batch.cell_source === "IMPORTED" ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <span className="text-amber-400">Imported</span>
                                                    </span>
                                                ) : 'Not specified'}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider">PLI Subsidy Eligible</dt>
                                            <dd className="font-semibold">
                                                {batch.pli_compliant ? (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Yes</Badge>
                                                ) : (
                                                    <Badge className="bg-zinc-700 text-zinc-400">No</Badge>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider">Serial Format</dt>
                                            <dd className="font-mono text-sm bg-orange-500/10 text-orange-400 px-3 py-2 rounded-lg border border-orange-500/20 inline-block">
                                                IN-NKY-LFP-2026-XXXXX
                                            </dd>
                                        </div>
                                    </dl>

                                    {/* Import Details Section (for IMPORTED cells) */}
                                    {batch.cell_source === "IMPORTED" && batch.bill_of_entry_no && (
                                        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="h-4 w-4 text-amber-400" />
                                                <span className="text-sm font-medium text-amber-400">Customs Declaration</span>
                                            </div>
                                            <dl className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <dt className="text-zinc-500 mb-1 text-xs">Bill of Entry</dt>
                                                    <dd className="font-mono text-white">{batch.bill_of_entry_no}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-zinc-500 mb-1 text-xs">Cell Country of Origin</dt>
                                                    <dd className="font-semibold text-white">{batch.country_of_origin || 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-zinc-500 mb-1 text-xs">Customs Clearance Date</dt>
                                                    <dd className="font-semibold text-white">
                                                        {batch.customs_date
                                                            ? new Date(batch.customs_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                            : 'N/A'
                                                        }
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Market-Specific Compliance Card - EU DARK THEME */}
                        {isEU && (
                            <Card className="bg-zinc-900/80 border-zinc-800 border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <Leaf className="h-5 w-5 text-blue-400" />
                                        </div>
                                        🇪🇺 EU Compliance (Battery Passport)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                                                Carbon Footprint
                                            </dt>
                                            <dd className="font-semibold text-white flex items-center gap-2">
                                                <span className="text-xl text-emerald-400">{batch.specs.carbon_footprint || 'N/A'}</span>
                                                {batch.specs.carbon_footprint && (
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                                                        CO₂e Certified
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider">Recyclable</dt>
                                            <dd className="font-semibold">
                                                {batch.specs.recyclable ? (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">♻️ Yes</Badge>
                                                ) : (
                                                    <Badge className="bg-zinc-700 text-zinc-400">No</Badge>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider">Certifications</dt>
                                            <dd className="flex gap-2 flex-wrap">
                                                {batch.specs.certifications?.length > 0 ? (
                                                    batch.specs.certifications.map((cert: string) => (
                                                        <Badge key={cert} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                            {cert}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">CE</Badge>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                                            <dt className="text-zinc-500 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Atom className="h-3.5 w-3.5 text-purple-400" />
                                                Material Data
                                            </dt>
                                            <dd className="font-semibold">
                                                {batch.materials ? (
                                                    <span className="text-emerald-400">Available</span>
                                                ) : (
                                                    <span className="text-amber-400 flex items-center gap-1.5">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Pending
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                        {/* Upload Section - DARK THEME */}
                        <Card className="bg-zinc-900/80 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <FileSpreadsheet className="h-5 w-5 text-purple-400" />
                                    </div>
                                    Upload Data
                                </CardTitle>
                                <CardDescription className="text-zinc-500">
                                    Upload a CSV file containing passport data for this batch.
                                    {isIndia && (
                                        <span className="block mt-2 text-orange-400 font-medium">
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

                    {/* Actions Sidebar - DARK THEME */}
                    <div className="space-y-6">
                        <Card className="bg-zinc-900/80 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50"
                                    onClick={handleDownloadQR}
                                    disabled={isDraft}
                                >
                                    <QrCode className="mr-2 h-4 w-4 text-emerald-400" />
                                    Download QR Codes (ZIP)
                                    {isDraft && <Lock className="ml-auto h-3 w-3 text-zinc-500" />}
                                </Button>
                                <Button
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50"
                                    onClick={() => setLabelsDialogOpen(true)}
                                    disabled={isDraft}
                                >
                                    <Printer className="mr-2 h-4 w-4 text-blue-400" />
                                    Download PDF Labels
                                    {isDraft && <Lock className="ml-auto h-3 w-3 text-zinc-500" />}
                                </Button>
                                <Button
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:opacity-50"
                                    onClick={handleExportCSV}
                                    disabled={isDraft}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-purple-400" />
                                    Export Serial List (CSV)
                                    {isDraft && <Lock className="ml-auto h-3 w-3 text-zinc-500" />}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Summary Card - DARK THEME */}
                        <Card className={`bg-zinc-900/80 border-zinc-800 ${isIndia ? "border-l-4 border-l-orange-500" :
                            isEU ? "border-l-4 border-l-blue-500" :
                                "border-l-4 border-l-emerald-500"
                            }`}>
                            <CardHeader>
                                <CardTitle className="text-white">Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-4xl font-bold ${isIndia ? "text-orange-400" :
                                    isEU ? "text-blue-400" :
                                        "text-emerald-400"
                                    }`}>
                                    {passportCount.toLocaleString()}
                                </div>
                                <p className="text-sm mt-1 text-zinc-500">
                                    {isIndia ? "Battery Aadhaar IDs" : isEU ? "EU Passports" : "Total Passports"} Generated
                                </p>
                            </CardContent>
                        </Card>

                        {/* Market Info Badge - DARK THEME */}
                        <Card className="bg-zinc-900/80 border-zinc-800">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-5xl mb-3">
                                        {isIndia ? "🇮🇳" : isEU ? "🇪🇺" : "🌍"}
                                    </div>
                                    <p className="font-bold text-xl text-white">
                                        {isIndia ? "India Market" : isEU ? "EU Export" : "Global"}
                                    </p>
                                    <p className="text-sm text-zinc-500 mt-1">
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
                        <h2 className="text-xl font-semibold tracking-tight text-white">Generated Passports</h2>
                        {pagination.total > 0 && (
                            <p className="text-sm text-zinc-500">
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
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
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
                                            className={`w-8 h-8 p-0 ${pageNum === pagination.page ? "" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
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
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
                {/* Labels Download Dialog */}
                <DownloadLabelsDialog
                    open={labelsDialogOpen}
                    onOpenChange={setLabelsDialogOpen}
                    batchName={batch?.batch_name || ""}
                    passportCount={passportCount}
                    onDownload={handleDownloadLabels}
                />
            </div>
        </div>
    )
}
