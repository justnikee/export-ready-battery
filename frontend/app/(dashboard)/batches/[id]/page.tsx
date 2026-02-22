"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { createExportJob } from "@/lib/api/exports"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UploadCSV } from "@/components/batches/upload-csv"
import { CarbonCalculator } from "@/components/batches/carbon-calculator"
import { ArrowLeft, QrCode, FileSpreadsheet, ChevronLeft, ChevronRight, Leaf, Globe, AlertTriangle, CheckCircle, Printer, Factory, Scale, Atom, Battery, FileText, Lock, Unlock, Clock, Shield, FileCheck, Archive, Trash2 } from "lucide-react"
import { PassportList } from "@/components/batches/passport-list"
import { DownloadLabelsDialog } from "@/components/batches/DownloadLabelsDialog"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Batch, Passport } from "@/lib/types"

import { BatchDetailSkeleton } from "@/components/batches/BatchDetailSkeleton"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
}

interface BatchResponse {
    batch: Batch
    passport_count?: number
}

interface PassportsResponse {
    passports: Passport[]
    page?: number
    limit?: number
    total?: number
    total_pages?: number
    has_more?: boolean
}

interface ApiError {
    response?: {
        data?: {
            error?: string
        }
        status?: number
    }
}

const toApiError = (error: unknown): ApiError => {
    if (typeof error === "object" && error !== null) {
        return error as ApiError
    }
    return {}
}

export default function BatchDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { refreshUser } = useAuth()
    const [batch, setBatch] = useState<Batch | null>(null)
    const [activating, setActivating] = useState(false)
    const [archiving, setArchiving] = useState(false)
    const [deletingDraft, setDeletingDraft] = useState(false)
    const [passportCount, setPassportCount] = useState<number>(0)
    const [passports, setPassports] = useState<Passport[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false
    })
    const [labelsDialogOpen, setLabelsDialogOpen] = useState(false)
    const [confirmArchive, setConfirmArchive] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const fetchBatch = useCallback(async () => {
        try {
            const response = await api.get<BatchResponse>(`/batches/${params.id}`)
            setBatch(response.data.batch)
            setPassportCount(response.data.passport_count || 0)
        } catch (error: unknown) {
            console.error("Failed to fetch batch:", error)
        } finally {
            setLoading(false)
        }
    }, [params.id])

    const fetchPassports = useCallback(async (page = 1, limit = 50) => {
        try {
            const response = await api.get<PassportsResponse>(`/batches/${params.id}/passports?page=${page}&limit=${limit}`)
            setPassports(response.data.passports || [])
            setPagination({
                page: response.data.page || 1,
                limit: response.data.limit || 50,
                total: response.data.total || 0,
                totalPages: response.data.total_pages || 0,
                hasMore: response.data.has_more || false
            })
        } catch (error: unknown) {
            console.error("Failed to fetch passports:", error)
        }
    }, [params.id])

    useEffect(() => {
        fetchBatch()
        fetchPassports(1, 50)
    }, [fetchBatch, fetchPassports])

    const handleUploadComplete = () => {
        fetchBatch()
        fetchPassports(1, 50)
    }

    const handlePageChange = (newPage: number) => {
        fetchPassports(newPage, pagination.limit)
    }

    const handleDownloadQR = async () => {
        if (!batch) return
        const MAX_DIRECT_DOWNLOAD = 500;

        if (passportCount > MAX_DIRECT_DOWNLOAD) {
            // Use async export for large batches
            try {
                toast.loading("Creating export job... This may take a few minutes for large batches.", { id: 'qr-export' });
                const job = await createExportJob({
                    batch_id: params.id as string,
                    job_type: 'QR_ZIP'
                });
                toast.success(`Export job created! Go to Exports page to download when ready.`, {
                    id: 'qr-export',
                    description: `Job ID: ${job.id}`,
                    duration: 10000,
                    action: {
                        label: 'View Exports',
                        onClick: () => router.push('/exports')
                    }
                });
            } catch (error: unknown) {
                const apiError = toApiError(error)
                console.error("Failed to create export job", error);
                toast.error(apiError.response?.data?.error || "Failed to create export job", { id: 'qr-export' });
            }
        } else {
            // Direct download for small batches
            try {
                toast.loading("Generating QR codes...", { id: 'qr-download' });
                const response = await api.get(`/batches/${params.id}/download`, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${batch.batch_name}_qrcodes.zip`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success("QR codes downloaded successfully!", { id: 'qr-download' });
            } catch (error: unknown) {
                const apiError = toApiError(error)
                console.error("Failed to download QR codes", error);
                toast.error(apiError.response?.data?.error || "Failed to download QR codes", { id: 'qr-download' });
            }
        }
    };

    const handleDownloadLabels = async () => {
        if (!batch) return
        const MAX_DIRECT_DOWNLOAD = 500;

        if (passportCount > MAX_DIRECT_DOWNLOAD) {
            // Use async export for large batches
            try {
                toast.loading("Creating export job... This may take a few minutes for large batches.", { id: 'labels-export' });
                const job = await createExportJob({
                    batch_id: params.id as string,
                    job_type: 'LABELS_PDF'
                });
                toast.success(`Export job created! Go to Exports page to download when ready.`, {
                    id: 'labels-export',
                    description: `Job ID: ${job.id}`,
                    duration: 10000,
                    action: {
                        label: 'View Exports',
                        onClick: () => router.push('/exports')
                    }
                });
            } catch (error: unknown) {
                const apiError = toApiError(error)
                console.error("Failed to create export job", error);
                toast.error(apiError.response?.data?.error || "Failed to create export job", { id: 'labels-export' });
            }
        } else {
            // Direct download for small batches
            try {
                toast.loading("Generating PDF labels...", { id: 'labels-download' });
                const response = await api.get(`/batches/${params.id}/labels`, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${batch.batch_name}_labels.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success("Labels downloaded successfully!", { id: 'labels-download' });
            } catch (error: unknown) {
                const apiError = toApiError(error)
                console.error("Failed to download labels", error);
                if (apiError.response?.status === 403) {
                    toast.error("⚠️ You must Activate this batch before downloading labels.", {
                        id: 'labels-download',
                        description: "Click 'Activate Batch' to unlock downloads.",
                        duration: 5000
                    });
                } else {
                    toast.error(apiError.response?.data?.error || "Failed to download labels", { id: 'labels-download' });
                }
            }
        }
    };

    const handleExportCSV = async () => {
        if (!batch) return
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

    const handleExportAuditCSV = async () => {
        try {
            toast.loading("Queuing audit log export...");
            await api.post(`/batches/${params.id}/exports`, { format: "csv", type: "AUDIT_CSV" });
            toast.dismiss();
            toast.success("Audit export queued! Check the Export Jobs page.");
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to queue audit export");
            console.error("Export error:", error);
        }
    }

    const handleExportDueDiligence = async () => {
        if (!batch) return
        try {
            toast.loading("Creating Due Diligence Report...", { id: 'dd-export' });
            const job = await createExportJob({
                batch_id: params.id as string,
                job_type: 'DUE_DILIGENCE'
            });
            toast.success(`Due Diligence Report export job created!`, {
                id: 'dd-export',
                description: `Go to Exports page to download when ready.`,
                duration: 10000,
                action: {
                    label: 'View Exports',
                    onClick: () => router.push('/exports')
                }
            });
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error("Failed to create DD report export", error);
            toast.error(apiError.response?.data?.error || "Failed to create Due Diligence export job", { id: 'dd-export' });
        }
    }

    const handleExportComplianceDeclaration = async () => {
        if (!batch) return
        try {
            toast.loading("Creating Compliance Declaration...", { id: 'cd-export' });
            const job = await createExportJob({
                batch_id: params.id as string,
                job_type: 'COMPLIANCE_DECLARATION'
            });
            toast.success(`Compliance Declaration export job created!`, {
                id: 'cd-export',
                description: `Go to Exports page to download when ready.`,
                duration: 10000,
                action: {
                    label: 'View Exports',
                    onClick: () => router.push('/exports')
                }
            });
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error("Failed to create compliance declaration export", error);
            toast.error(apiError.response?.data?.error || "Failed to create Compliance Declaration export job", { id: 'cd-export' });
        }
    }

    // Determine compliance status - DARK THEME
    const getComplianceBadge = () => {
        const region = batch?.market_region as MarketRegion

        if (region === "INDIA") {
            return (
                <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30 text-sm px-3 py-1">
                    🇮🇳 India Market
                </Badge>
            )
        } else if (region === "EU") {
            return (
                <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30 text-sm px-3 py-1">
                    🇪🇺 EU Market
                </Badge>
            )
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
                <Badge className="bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 border-slate-500/30 text-sm px-3 py-1">
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
            await api.post(`/batches/${params.id}/activate`)
            toast.success('Batch activated successfully!')
            await fetchBatch()
            await refreshUser()
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error('Failed to activate batch:', error)
            if (apiError.response?.status === 402) {
                toast.error('Insufficient quota. Please purchase more quota units.')
                router.push('/billing')
            } else {
                toast.error(apiError.response?.data?.error || 'Failed to activate batch')
            }
        } finally {
            setActivating(false)
        }
    }

    // Archive batch handler (for ACTIVE batches)
    const handleArchiveBatch = async () => {
        if (!batch) return
        setConfirmArchive(false)

        setArchiving(true)
        try {
            await api.post(`/batches/${params.id}/archive`)
            toast.success('Batch archived successfully')
            await fetchBatch()
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error('Failed to archive batch:', error)
            toast.error(apiError.response?.data?.error || 'Failed to archive batch')
        } finally {
            setArchiving(false)
        }
    }

    // Delete draft batch handler (for DRAFT batches with 0 passports)
    const handleDeleteDraft = async () => {
        if (!batch) return
        setConfirmDelete(false)

        setDeletingDraft(true)
        try {
            await api.delete(`/batches/${params.id}/draft`)
            toast.success('Draft batch deleted successfully')
            router.push('/batches')
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error('Failed to delete draft batch:', error)
            toast.error(apiError.response?.data?.error || 'Failed to delete draft batch')
        } finally {
            setDeletingDraft(false)
        }
    }

    const isDraft = batch?.status !== 'ACTIVE' && batch?.status !== 'ARCHIVED'

    if (loading) return <BatchDetailSkeleton />
    if (!batch) return <div className="p-8 text-slate-400">Batch not found</div>

    const region = batch.market_region as MarketRegion
    const isIndia = region === "INDIA"
    const isEU = region === "EU"

    const hasWarrantyMonths = batch.specs.warranty_months !== null && batch.specs.warranty_months !== undefined
    const expectedLifetimeCycles = batch.specs.expected_lifetime_cycles ?? null
    const hasExpectedLifetime = expectedLifetimeCycles !== null
    const hasRecycledContent = batch.specs.recycled_content_pct !== null && batch.specs.recycled_content_pct !== undefined
    const certifications = batch.specs.certifications ?? []
    const materialComposition = batch.specs.material_composition

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
            <div className="w-full mx-auto space-y-8">
                {/* Header with Compliance Badge */}
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/batches')} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{batch.batch_name}</h1>
                                    {getStatusBadge()}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {getComplianceBadge()}
                                    <span className="text-slate-500 text-sm flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Created {new Date(batch.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* Draft batch actions */}
                            {isDraft && (
                                <>
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
                                    {/* Delete Draft - only if no passports */}
                                    {(batch?.total_passports === 0) && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setConfirmDelete(true)}
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            disabled={deletingDraft}
                                        >
                                            {deletingDraft ? (
                                                <>
                                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Draft
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Active batch actions */}
                            {batch?.status === 'ACTIVE' && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setLabelsDialogOpen(true)}
                                        className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Labels
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmArchive(true)}
                                        className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                        disabled={archiving}
                                    >
                                        {archiving ? (
                                            <>
                                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                                                Archiving...
                                            </>
                                        ) : (
                                            <>
                                                <Archive className="mr-2 h-4 w-4" />
                                                Archive Batch
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}

                            {/* Archived batch - read only */}
                            {batch?.status === 'ARCHIVED' && (
                                <Button
                                    variant="outline"
                                    disabled
                                    className="border-slate-200 text-slate-400 cursor-not-allowed"
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Archived (Read Only)
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Common Specifications - LIGHT THEME */}
                        <Card className="bg-white border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-900">
                                    <div className="p-2 rounded-lg bg-blue-50">
                                        <Battery className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Core Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Manufacturer</dt>
                                        <dd className="font-semibold text-slate-900">{batch.specs.manufacturer || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Chemistry</dt>
                                        <dd className="font-semibold text-slate-900">{batch.specs.chemistry || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Capacity</dt>
                                        <dd className="font-semibold text-emerald-400">{batch.specs.capacity || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Voltage</dt>
                                        <dd className="font-semibold text-slate-900">{batch.specs.voltage || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Weight</dt>
                                        <dd className="font-semibold text-slate-900">{batch.specs.weight || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Country of Origin</dt>
                                        <dd className="font-semibold text-slate-900">{batch.specs.country_of_origin || 'N/A'}</dd>
                                    </div>

                                    {/* Manufacturer Contact Info - Full Width */}
                                    {batch.specs.manufacturer_address && (
                                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
                                            <dt className="text-slate-600 mb-1 text-xs uppercase tracking-wider">Manufacturer Address</dt>
                                            <dd className="font-semibold text-slate-900 text-sm">{batch.specs.manufacturer_address}</dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Market-Specific Compliance Card - INDIA LIGHT THEME */}
                        {isIndia && (
                            <Card className="bg-white border-slate-200 border-l-4 border-l-orange-500">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-slate-900">
                                        <span className="text-2xl">🇮🇳</span>
                                        <span>India Compliance</span>
                                        <span className="text-xs font-normal text-slate-500 bg-orange-50 px-2 py-1 rounded">Battery Aadhaar</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Scale className="h-3.5 w-3.5 text-orange-400" />
                                                Domestic Value Add
                                            </dt>

                                            {/* DVA Value Display */}
                                            <dd className="font-bold text-2xl text-orange-400 flex items-center gap-2">
                                                {batch.domestic_value_add ? `${batch.domestic_value_add.toFixed(1)}%` : 'N/A'}

                                                {/* Source Badge */}
                                                {batch.dva_source === "AUDITED" ? (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2">
                                                        <Shield className="h-3 w-3 mr-1" /> CA Verified
                                                    </Badge>
                                                ) : batch.dva_source === "ESTIMATED" ? (
                                                    <Badge variant="outline" className="text-slate-500 text-[10px] px-2">
                                                        Estimated
                                                    </Badge>
                                                ) : null}
                                            </dd>

                                            {/* PLI Status */}
                                            {batch.domestic_value_add >= 50 && (
                                                <span className="text-xs text-emerald-400 mt-1 block">✓ PLI Eligible</span>
                                            )}

                                            {/* Certificate Download Link */}
                                            {batch.dva_source === "AUDITED" && batch.pli_certificate_url && (
                                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                    <a
                                                        href={batch.pli_certificate_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        <FileCheck className="h-3.5 w-3.5" />
                                                        View Auditor Certificate
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Factory className="h-3.5 w-3.5 text-orange-400" />
                                                Cell Source
                                            </dt>
                                            <dd className="font-semibold text-slate-900">
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
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">HSN Code</dt>
                                            <dd className="font-mono text-lg text-slate-900">
                                                {batch.hsn_code || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">PLI Subsidy Eligible</dt>
                                            <dd className="font-semibold">
                                                {batch.pli_compliant ? (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Yes</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-700 text-slate-400">No</Badge>
                                                )}
                                            </dd>
                                        </div>
                                        {/* Financial Data for DVA Calculation */}
                                        {(batch.specs?.sale_price_inr || batch.specs?.import_cost_inr) && (
                                            <>
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                    <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Sale Price</dt>
                                                    <dd className="font-semibold text-slate-900">
                                                        ₹{batch.specs.sale_price_inr?.toLocaleString('en-IN') || '0'}
                                                    </dd>
                                                </div>
                                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                    <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Import Material Cost</dt>
                                                    <dd className="font-semibold text-slate-900">
                                                        ₹{batch.specs.import_cost_inr?.toLocaleString('en-IN') || '0'}
                                                    </dd>
                                                </div>
                                            </>
                                        )}
                                        <div className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Serial Format (BPAN)</dt>
                                            <dd className="font-mono text-sm bg-orange-500/10 text-orange-400 px-3 py-2 rounded-lg border border-orange-500/20 inline-block">
                                                IN-NKY-{batch.specs?.chemistry || 'LFP'}-2026-XXXXX
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
                                                    <dt className="text-slate-500 mb-1 text-xs">Bill of Entry</dt>
                                                    <dd className="font-mono text-slate-900">{batch.bill_of_entry_no}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-slate-500 mb-1 text-xs">Cell Country of Origin</dt>
                                                    <dd className="font-semibold text-slate-900">{batch.country_of_origin || 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-slate-500 mb-1 text-xs">Customs Clearance Date</dt>
                                                    <dd className="font-semibold text-slate-900">
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

                        {/* Market-Specific Compliance Card - EU LIGHT THEME */}
                        {isEU && (
                            <Card className="bg-white border-slate-200 border-l-4 border-l-blue-500">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-slate-900">
                                        <span className="text-2xl">🇪🇺</span>
                                        <span>EU Compliance</span>
                                        <span className="text-xs font-normal text-slate-500 bg-blue-50 px-2 py-1 rounded">Battery Passport</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                                                Carbon Footprint
                                            </dt>
                                            <dd className="font-semibold text-slate-900 flex items-center gap-2">
                                                <span className="text-xl text-emerald-400">{batch.specs.carbon_footprint || 'N/A'}</span>
                                                {batch.specs.carbon_footprint && (
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                                                        CO₂e Certified
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Recycled Content</dt>
                                            <dd className="font-semibold text-slate-900">
                                                {hasRecycledContent ? `${batch.specs.recycled_content_pct}%` : "Not declared"}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Certifications</dt>
                                            <dd className="flex gap-2 flex-wrap">
                                                {certifications.length > 0 ? (
                                                    certifications.map((cert: string) => (
                                                        <Badge key={cert} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                            {cert}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">CE</Badge>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Atom className="h-3.5 w-3.5 text-teal-400" />
                                                Material Data
                                            </dt>
                                            <dd className="font-semibold">
                                                {materialComposition ? (
                                                    <span className="text-emerald-400">Available</span>
                                                ) : (
                                                    <span className="text-amber-400 flex items-center gap-1.5">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Pending
                                                    </span>
                                                )}
                                            </dd>
                                        </div>

                                        {/* EU Representative */}
                                        {batch.specs.eu_representative && (
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">EU Representative</dt>
                                                <dd className="font-semibold text-slate-900">{batch.specs.eu_representative}</dd>
                                                {batch.specs.eu_representative_email && (
                                                    <dd className="text-xs text-blue-400 mt-1">
                                                        <a href={`mailto:${batch.specs.eu_representative_email}`} className="hover:underline">
                                                            {batch.specs.eu_representative_email}
                                                        </a>
                                                    </dd>
                                                )}
                                            </div>
                                        )}

                                        {/* Warranty & Lifetime */}
                                        {(hasWarrantyMonths || hasExpectedLifetime) && (
                                            <>
                                                {hasWarrantyMonths && (
                                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                        <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Warranty Period</dt>
                                                        <dd className="font-semibold text-slate-900">{batch.specs.warranty_months} months</dd>
                                                    </div>
                                                )}
                                                {hasExpectedLifetime && (
                                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                        <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Expected Lifetime</dt>
                                                        <dd className="font-semibold text-slate-900">{expectedLifetimeCycles?.toLocaleString()} cycles</dd>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Recycled Content */}
                                        {hasRecycledContent && (
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <dt className="text-slate-600 mb-2 text-xs uppercase tracking-wider">Recycled Content</dt>
                                                <dd className="font-semibold text-emerald-400">{batch.specs.recycled_content_pct}%</dd>
                                            </div>
                                        )}

                                        {/* Material Composition - Full Width */}
                                        {materialComposition && (
                                            <div className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                <dt className="text-slate-500 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                                    <Atom className="h-3.5 w-3.5 text-teal-400" />
                                                    Material Composition
                                                </dt>
                                                <dd className="grid grid-cols-3 gap-3 text-xs">
                                                    {(materialComposition.cobalt_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                                            <span className="text-slate-600">Cobalt</span>
                                                            <span className="font-semibold text-slate-900">{materialComposition.cobalt_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.lithium_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                                            <span className="text-slate-600">Lithium</span>
                                                            <span className="font-semibold text-slate-900">{materialComposition.lithium_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.nickel_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                                            <span className="text-slate-600">Nickel</span>
                                                            <span className="font-semibold text-slate-900">{materialComposition.nickel_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.manganese_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                                            <span className="text-slate-600">Manganese</span>
                                                            <span className="font-semibold text-slate-900">{materialComposition.manganese_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.graphite_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                                            <span className="text-slate-600">Graphite</span>
                                                            <span className="font-semibold text-slate-900">{materialComposition.graphite_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.lead_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                                            <span className="text-slate-600">Lead</span>
                                                            <span className="font-semibold text-slate-900">{materialComposition.lead_pct}%</span>
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                        )}

                                        {/* Hazardous Substances Declaration - Full Width */}
                                        {batch.specs.hazardous_substances && (
                                            <div className="col-span-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                <dt className="text-slate-500 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                                    Hazardous Substances Declaration
                                                </dt>
                                                <dd className="space-y-2">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {batch.specs.hazardous_substances.lead_present && (
                                                            <Badge variant="outline" className="text-amber-400 border-amber-500/30">Lead</Badge>
                                                        )}
                                                        {batch.specs.hazardous_substances.mercury_present && (
                                                            <Badge variant="outline" className="text-amber-400 border-amber-500/30">Mercury</Badge>
                                                        )}
                                                        {batch.specs.hazardous_substances.cadmium_present && (
                                                            <Badge variant="outline" className="text-amber-400 border-amber-500/30">Cadmium</Badge>
                                                        )}
                                                        {!batch.specs.hazardous_substances.lead_present &&
                                                            !batch.specs.hazardous_substances.mercury_present &&
                                                            !batch.specs.hazardous_substances.cadmium_present && (
                                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                                    No hazardous substances detected
                                                                </Badge>
                                                            )}
                                                    </div>
                                                    {batch.specs.hazardous_substances.declaration && (
                                                        <p className="text-xs text-slate-400 italic">{batch.specs.hazardous_substances.declaration}</p>
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                        {/* Carbon Footprint Calculator - EU & GLOBAL only */}
                        {(isEU || batch.market_region === 'GLOBAL') && (
                            <CarbonCalculator
                                batchId={batch.id}
                                chemistry={batch.specs.chemistry}
                                capacity={batch.specs.capacity}
                                weight={batch.specs.weight}
                                existingResult={batch.carbon_footprint_result as null}
                                onResultSaved={fetchBatch}
                            />
                        )}

                        {/* Upload Section - LIGHT THEME */}
                        <Card className="bg-white border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-900">
                                    <div className="p-2 rounded-lg bg-teal-50">
                                        <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                                    </div>
                                    Upload Data
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                    Upload a CSV file containing passport data for this batch.
                                    {isIndia && (
                                        <span className="block mt-2 text-orange-400 font-medium">
                                            💡 Auto-generates BPAN format: IN-NKY-{batch.specs.chemistry}-2026-00001 to ...{passportCount || 'N'}
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UploadCSV batchId={batch.id} marketRegion={region} chemistry={batch.specs?.chemistry} onUploadComplete={handleUploadComplete} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions Sidebar - LIGHT THEME */}
                    <div className="space-y-6">
                        <Card className="bg-white border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-slate-900">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    className="w-full bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-900 border border-slate-200 disabled:opacity-50 transition-all duration-200"
                                    onClick={handleDownloadQR}
                                    disabled={isDraft}
                                >
                                    <QrCode className="mr-2 h-4 w-4 text-emerald-500" />
                                    Download QR Codes (ZIP)
                                    {isDraft && <Lock className="ml-auto h-3 w-3 text-slate-500" />}
                                </Button>
                                <Button
                                    className="w-full bg-slate-100 hover:bg-blue-50 hover:border-blue-300 text-slate-900 border border-slate-200 disabled:opacity-50 transition-all duration-200"
                                    onClick={() => setLabelsDialogOpen(true)}
                                    disabled={isDraft}
                                >
                                    <Printer className="mr-2 h-4 w-4 text-blue-500" />
                                    Download PDF Labels
                                    {isDraft && <Lock className="ml-auto h-3 w-3 text-slate-500" />}
                                </Button>
                                <Button
                                    className="w-full bg-slate-100 hover:bg-teal-50 hover:border-teal-300 text-slate-900 border border-slate-200 disabled:opacity-50 transition-all duration-200"
                                    onClick={handleExportCSV}
                                    disabled={isDraft}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-500" />
                                    Export Serial List (CSV)
                                    {isDraft && <Lock className="ml-auto h-3 w-3 text-slate-500" />}
                                </Button>
                                <Button
                                    className="w-full bg-slate-100 hover:bg-amber-50 hover:border-amber-300 text-slate-900 border border-slate-200 disabled:opacity-50 transition-all duration-200"
                                    onClick={handleExportAuditCSV}
                                >
                                    <FileText className="mr-2 h-4 w-4 text-amber-500" />
                                    Export Audit Log (CSV)
                                </Button>

                                {/* EU Due Diligence Report */}
                                {(batch.market_region === "EU" || batch.market_region === "GLOBAL") && (
                                    <Button
                                        className="w-full bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-900 border border-slate-200 disabled:opacity-50 transition-all duration-200"
                                        onClick={handleExportDueDiligence}
                                        disabled={isDraft}
                                    >
                                        <Shield className="mr-2 h-4 w-4 text-indigo-500" />
                                        Due Diligence Report (PDF)
                                        {isDraft && <Lock className="ml-auto h-3 w-3 text-slate-500" />}
                                    </Button>
                                )}

                                {/* EU Compliance Declaration */}
                                {(batch.market_region === "EU" || batch.market_region === "GLOBAL") && (
                                    <Button
                                        className="w-full bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-900 border border-slate-200 disabled:opacity-50 transition-all duration-200"
                                        onClick={handleExportComplianceDeclaration}
                                        disabled={isDraft}
                                    >
                                        <Leaf className="mr-2 h-4 w-4 text-emerald-500" />
                                        Carbon Declaration (PDF)
                                        {isDraft && <Lock className="ml-auto h-3 w-3 text-slate-500" />}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Summary Card - DARK THEME */}
                        <Card className={`bg-white border-slate-200 ${isIndia ? "border-l-4 border-l-orange-500" :
                            isEU ? "border-l-4 border-l-blue-500" :
                                "border-l-4 border-l-emerald-500"
                            }`}>
                            <CardHeader>
                                <CardTitle className="text-slate-900">Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-4xl font-bold ${isIndia ? "text-orange-400" :
                                    isEU ? "text-blue-400" :
                                        "text-emerald-400"
                                    }`}>
                                    {passportCount.toLocaleString()}
                                </div>
                                <p className="text-sm mt-1 text-slate-500">
                                    {isIndia ? "Battery Aadhaar IDs" : isEU ? "EU Passports" : "Total Passports"} Generated
                                </p>
                            </CardContent>
                        </Card>

                        {/* Market Info Badge - DARK THEME */}
                        <Card className="bg-white border-slate-200">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-5xl mb-3">
                                        {isIndia ? "🇮🇳" : isEU ? "🇪🇺" : "🌍"}
                                    </div>
                                    <p className="font-bold text-xl text-slate-900">
                                        {isIndia ? "India Market" : isEU ? "EU Export" : "Global"}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
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
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Generated Passports</h2>
                        {pagination.total > 0 && (
                            <p className="text-sm text-slate-500">
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
                                className="border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
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
                                            className={`w-8 h-8 p-0 ${pageNum === pagination.page ? "" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
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
                                className="border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
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

                {/* Confirmation Dialogs */}
                <ConfirmDialog
                    open={confirmArchive}
                    onOpenChange={setConfirmArchive}
                    title="Archive this batch?"
                    description="Archived batches remain available for audit and compliance purposes but cannot generate new passports."
                    confirmText="Archive Batch"
                    variant="default"
                    onConfirm={handleArchiveBatch}
                />
                <ConfirmDialog
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    title="Delete this draft batch?"
                    description="This action cannot be undone. Only draft batches with no passports can be deleted."
                    confirmText="Delete Draft"
                    variant="destructive"
                    onConfirm={handleDeleteDraft}
                />
            </div>
        </div >
    )
}
