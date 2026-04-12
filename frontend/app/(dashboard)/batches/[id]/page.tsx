"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { createExportJob } from "@/lib/api/exports"
import { useAuth } from "@/context/auth-context"
import { type ApiError, toApiError } from "@/lib/utils"
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
import { clsx } from "clsx"

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

export default function BatchDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { user, refreshUser } = useAuth()
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
    const [complianceScore, setComplianceScore] = useState<number | null>(null)
    const [complianceGaps, setComplianceGaps] = useState<import("@/lib/types").ComplianceGap[]>([])
    const [complianceLoading, setComplianceLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'passports' | 'upload' | 'compliance' | 'reports'>('overview')

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
        // Fetch compliance data (non-blocking)
        const fetchCompliance = async () => {
            setComplianceLoading(true)
            try {
                const res = await api.get(`/batches/${params.id}/compliance`)
                setComplianceScore(res.data.compliance_score ?? null)
                setComplianceGaps(res.data.compliance_gaps ?? [])
            } catch {
                // Compliance data may not exist for draft batches
            } finally {
                setComplianceLoading(false)
            }
        }
        fetchCompliance()
    }, [fetchBatch, fetchPassports, params.id])

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
            toast.loading("Generating Due Diligence Report...", { id: 'dd-download' });
            const response = await api.get(`/batches/${params.id}/due-diligence-report`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${batch.batch_name}_due_diligence_report.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Due Diligence Report downloaded!", { id: 'dd-download' });
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error("Failed to download due diligence report", error);
            if (apiError.response?.status === 403) {
                toast.error("Batch must be activated before generating the Due Diligence Report.", { id: 'dd-download' });
            } else {
                toast.error(apiError.response?.data?.error || "Failed to download Due Diligence Report", { id: 'dd-download' });
            }
        }
    }

    const handleExportComplianceDeclaration = async () => {
        if (!batch) return
        try {
            toast.loading("Generating Carbon Declaration...", { id: 'cd-download' });
            const response = await api.get(`/batches/${params.id}/compliance-declaration`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${batch.batch_name}_compliance_declaration.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Compliance Declaration downloaded!", { id: 'cd-download' });
        } catch (error: unknown) {
            const apiError = toApiError(error)
            console.error("Failed to download compliance declaration", error);
            if (apiError.response?.status === 400) {
                toast.error("No carbon footprint data available. Run the Carbon Calculator first.", { id: 'cd-download' });
            } else {
                toast.error(apiError.response?.data?.error || "Failed to download Compliance Declaration", { id: 'cd-download' });
            }
        }
    }

    const handleDownloadComplianceReport = async () => {
        if (!batch) return
        try {
            toast.loading("Generating Compliance Report...", { id: 'cr-download' })
            const response = await api.get(`/batches/${params.id}/compliance-report`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${batch.batch_name}_compliance_report.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Compliance Report downloaded!", { id: 'cr-download' })
        } catch (error: unknown) {
            const apiError = toApiError(error)
            toast.error(apiError.response?.data?.error || "Failed to download Compliance Report", { id: 'cr-download' })
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
                <Badge className="bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 border-border/30 text-sm px-3 py-1">
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

    // Maps backend-style field keys to human-readable labels
    const formatBlockerLabel = (key: string): string => {
        const map: Record<string, string> = {
            "model_name": "Model name",
            "specs.chemistry": "Battery chemistry",
            "specs.capacity": "Rated capacity",
            "manufacturing_start_date": "Manufacturing start date",
            "manufacturing_end_date": "Manufacturing end date",
            "cell_source": "Cell source (IMPORTED/DOMESTIC)",
            "specs.certifications: AIS-156": "AIS-156 certification",
            "specs.certifications: AIS-038": "AIS-038 certification",
            "tenant.epr_registration_number": "EPR Registration (Settings → Compliance)",
            "tenant.bis_r_number": "BIS R-Number (Settings → Compliance)",
            "tenant.iec_code": "IEC Code (Settings → Compliance)",
            "tenant.morth_manufacturer_code": "MoRTH Code (Settings → Compliance)",
            "bill_of_entry_no": "Bill of Entry number",
            "country_of_origin": "Cell country of origin",
            "customs_date": "Import date",
            "domestic_value_add": "Domestic value-add percentage",
            "specs.battery_category": "EU battery category",
            "tenant.company_name": "Company name (Settings → Profile)",
            "tenant.address": "Company address (Settings → Profile)",
            "tenant.eu_authorized_representative_name": "EU Representative name (Settings → Compliance)",
            "tenant.eu_authorized_representative_address": "EU Representative address (Settings → Compliance)",
            "tenant.eu_contact_email": "EU contact email (Settings → Compliance)",
            "carbon_footprint_result": "Carbon footprint (use Carbon Calculator tab)",
            "specs.material_composition": "Material composition (at least one non-zero %)",
            "specs.hazardous_substances.declaration": "Hazardous substances declaration",
            "specs.expected_lifetime_cycles": "Expected lifetime cycles",
            "specs.warranty_months": "Warranty months",
        }
        return map[key] || key.replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }

    // Client-side preflight: mirrors backend activation_compliance.go
    const getActivationBlockers = (b: Batch, u: typeof user): { blocking: string[]; warnings: string[] } => {
        const blocking: string[] = []
        const warnings: string[] = []
        const region = b.market_region as MarketRegion

        // Common checks
        if (!b.model_name?.trim()) blocking.push("model_name")
        if (!b.specs?.chemistry?.trim()) blocking.push("specs.chemistry")
        if (!b.specs?.capacity?.trim()) blocking.push("specs.capacity")
        if (!b.manufacturing_start_date) blocking.push("manufacturing_start_date")
        if (!b.manufacturing_end_date) blocking.push("manufacturing_end_date")

        if (region === "INDIA" || region === "GLOBAL") {
            // Cell source
            if (!b.cell_source) blocking.push("cell_source")

            // AIS certifications
            const certs = b.specs?.certifications || []
            if (!certs.includes("AIS-156")) blocking.push("specs.certifications: AIS-156")
            if (!certs.includes("AIS-038")) blocking.push("specs.certifications: AIS-038")

            // Tenant codes
            if (!u?.epr_registration_number?.trim()) blocking.push("tenant.epr_registration_number")
            if (!u?.bis_r_number?.trim()) blocking.push("tenant.bis_r_number")
            if (!u?.iec_code?.trim()) blocking.push("tenant.iec_code")
            if (!u?.morth_manufacturer_code?.trim()) blocking.push("tenant.morth_manufacturer_code")

            // Import-specific
            if (b.cell_source === "IMPORTED") {
                if (!b.bill_of_entry_no?.trim()) blocking.push("bill_of_entry_no")
                if (!b.country_of_origin?.trim()) blocking.push("country_of_origin")
                if (!b.customs_date) blocking.push("customs_date")
            }

            // Domestic DVA
            if (b.cell_source === "DOMESTIC" && (b.domestic_value_add ?? 0) <= 0) {
                blocking.push("domestic_value_add")
            }

            // PLI DVA threshold
            if (b.pli_compliant && (b.domestic_value_add ?? 0) < 50) {
                warnings.push("PLI requires ≥50% DVA (current: " + (b.domestic_value_add ?? 0) + "%)")
            }
        }

        if (region === "EU" || region === "GLOBAL") {
            // Battery category
            const validCategories = ["EV", "LMT", "INDUSTRIAL", "PORTABLE", "SLI"]
            if (!b.specs?.battery_category || !validCategories.includes(b.specs.battery_category)) {
                blocking.push("specs.battery_category")
            }

            // Tenant EU fields
            if (!u?.company_name?.trim()) blocking.push("tenant.company_name")
            if (!u?.address?.trim()) blocking.push("tenant.address")
            if (!u?.eu_authorized_representative_name?.trim()) blocking.push("tenant.eu_authorized_representative_name")
            if (!u?.eu_authorized_representative_address?.trim()) blocking.push("tenant.eu_authorized_representative_address")
            if (!u?.eu_contact_email?.trim()) blocking.push("tenant.eu_contact_email")

            // Carbon footprint (must be calculator result, not free-text)
            if (!b.carbon_footprint_result || Object.keys(b.carbon_footprint_result).length === 0) {
                blocking.push("carbon_footprint_result")
            }

            // Material composition - at least one non-zero
            const mc = b.specs?.material_composition
            if (!mc || !Object.values(mc).some(v => typeof v === "number" ? v > 0 : parseFloat(String(v)) > 0)) {
                blocking.push("specs.material_composition")
            }

            // Hazardous substances
            if (!b.specs?.hazardous_substances?.declaration?.trim()) {
                blocking.push("specs.hazardous_substances.declaration")
            }

            // Lifetime cycles
            if (!b.specs?.expected_lifetime_cycles || b.specs.expected_lifetime_cycles <= 0) {
                blocking.push("specs.expected_lifetime_cycles")
            }

            // Warranty
            if (!b.specs?.warranty_months || b.specs.warranty_months <= 0) {
                blocking.push("specs.warranty_months")
            }

            // Recycled content warnings (non-blocking until Aug 2028)
            const recycledKeys = ["recycled_cobalt", "recycled_lithium", "recycled_nickel", "recycled_lead"] as const
            for (const key of recycledKeys) {
                const baseKey = key.replace("recycled_", "") as keyof typeof mc
                if (mc && typeof mc === "object" && baseKey in mc) {
                    const baseVal = parseFloat(String((mc as Record<string, unknown>)[baseKey])) || 0
                    const recycledVal = parseFloat(String((mc as Record<string, unknown>)[key])) || 0
                    if (baseVal > 0 && recycledVal === 0) {
                        warnings.push(`Recycled ${baseKey} content not declared (required from Aug 2028)`)
                    }
                }
            }
        }

        return { blocking, warnings }
    }

    const handleActivateBatch = async () => {
        if (!batch) return

        // Preflight check
        const preflight = getActivationBlockers(batch, user)
        if (preflight.blocking.length > 0) {
            toast.error(
                <div className="space-y-2">
                    <p className="font-semibold">Cannot activate — {preflight.blocking.length} requirement{preflight.blocking.length > 1 ? "s" : ""} missing:</p>
                    <ul className="list-disc pl-4 text-sm space-y-0.5">
                        {preflight.blocking.slice(0, 8).map((b, i) => (
                            <li key={i}>{formatBlockerLabel(b)}</li>
                        ))}
                        {preflight.blocking.length > 8 && <li>…and {preflight.blocking.length - 8} more</li>}
                    </ul>
                    {preflight.warnings.length > 0 && (
                        <p className="text-amber-500 text-xs mt-1">+ {preflight.warnings.length} warning{preflight.warnings.length > 1 ? "s" : ""}</p>
                    )}
                </div>,
                { duration: 12000 }
            )
            return
        }

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
            } else if (apiError.response?.status === 403) {
                // Parse rich error from backend
                const data = apiError.response?.data as { error?: string; missing?: string[]; errors?: string[] } | undefined
                const missing = data?.missing || []
                const errors = data?.errors || []
                if (missing.length > 0 || errors.length > 0) {
                    toast.error(
                        <div className="space-y-2">
                            <p className="font-semibold">Activation blocked by server compliance check:</p>
                            {missing.length > 0 && (
                                <ul className="list-disc pl-4 text-sm space-y-0.5">
                                    {missing.map((m, i) => (
                                        <li key={i} className="text-red-500">{formatBlockerLabel(m)}</li>
                                    ))}
                                </ul>
                            )}
                            {errors.length > 0 && (
                                <ul className="list-disc pl-4 text-sm space-y-0.5 text-amber-500">
                                    {errors.map((e, i) => (
                                        <li key={i}>{e}</li>
                                    ))}
                                </ul>
                            )}
                        </div>,
                        { duration: 12000 }
                    )
                } else {
                    toast.error(data?.error || 'Compliance requirements not met. Activation blocked.')
                }
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
    const activationResult = batch && isDraft ? getActivationBlockers(batch, user) : { blocking: [], warnings: [] }

    if (loading) return <BatchDetailSkeleton />
    if (!batch) return <div className="p-8 text-muted-foreground">Batch not found</div>

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
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <div className="w-full mx-auto space-y-8">
                {/* Header with Compliance Badge */}
                <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/batches')} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{batch.batch_name}</h1>
                                    {getStatusBadge()}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {getComplianceBadge()}
                                    <span className="text-muted-foreground text-sm flex items-center gap-1">
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
                                        className={activationResult.blocking.length > 0
                                            ? "bg-muted-foreground text-white cursor-not-allowed"
                                            : "bg-emerald-600 hover:bg-emerald-500/100 text-white shadow-lg shadow-emerald-500/20"}
                                        disabled={activating || activationResult.blocking.length > 0}
                                        title={activationResult.blocking.length > 0
                                            ? `${activationResult.blocking.length} requirement(s) missing — see blockers below`
                                            : "Activate this batch"}
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
                                            className="border-red-200 text-red-500 hover:bg-red-500/10 hover:text-red-500"
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
                                        className="border-border text-foreground hover:bg-background hover:text-foreground"
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Labels
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmArchive(true)}
                                        className="border-amber-200 text-amber-500 hover:bg-amber-500/10 hover:text-amber-800"
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
                                    className="border-border text-muted-foreground cursor-not-allowed"
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Archived (Read Only)
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>


                {/* Activation Blockers Panel — shown only for draft batches with issues */}
                {isDraft && (activationResult.blocking.length > 0 || activationResult.warnings.length > 0) && (
                    <div className="border border-border rounded-lg overflow-hidden">
                        {activationResult.blocking.length > 0 && (
                            <div className="bg-red-500/10 border-b border-red-200 px-4 py-3">
                                <div className="flex items-center gap-2 text-red-500 font-semibold text-sm mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    {activationResult.blocking.length} Blocking Issue{activationResult.blocking.length > 1 ? "s" : ""} — Must Fix Before Activation
                                </div>
                                <ul className="space-y-1 pl-6">
                                    {activationResult.blocking.map((key, i) => (
                                        <li key={i} className="text-sm text-red-500 list-disc">
                                            {formatBlockerLabel(key)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {activationResult.warnings.length > 0 && (
                            <div className="bg-amber-500/10 px-4 py-3">
                                <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm mb-2">
                                    <Shield className="h-4 w-4" />
                                    {activationResult.warnings.length} Warning{activationResult.warnings.length > 1 ? "s" : ""} (non-blocking)
                                </div>
                                <ul className="space-y-1 pl-6">
                                    {activationResult.warnings.map((w, i) => (
                                        <li key={i} className="text-sm text-amber-500 list-disc">{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="bg-card border border-border rounded-lg">
                    <div className="flex border-b border-border px-4">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'passports', label: `Passports (${passportCount})` },
                            { id: 'upload', label: 'Upload & Generate' },
                            { id: 'compliance', label: 'Compliance' },
                            { id: 'reports', label: 'Reports' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={clsx(
                                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                                    activeTab === tab.id
                                        ? "border-foreground text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-6">

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                        {/* Common Specifications - LIGHT THEME */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Battery className="h-5 w-5 text-blue-500" />
                                    </div>
                                    Core Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                                    <div className="p-3 rounded-lg bg-background border border-border">
                                        <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Manufacturer</dt>
                                        <dd className="font-semibold text-foreground">{batch.specs.manufacturer || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border border-border">
                                        <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Chemistry</dt>
                                        <dd className="font-semibold text-foreground">{batch.specs.chemistry || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border border-border">
                                        <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Capacity</dt>
                                        <dd className="font-semibold text-emerald-400">{batch.specs.capacity || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border border-border">
                                        <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Voltage</dt>
                                        <dd className="font-semibold text-foreground">{batch.specs.voltage || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border border-border">
                                        <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Weight</dt>
                                        <dd className="font-semibold text-foreground">{batch.specs.weight || 'N/A'}</dd>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border border-border">
                                        <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Country of Origin</dt>
                                        <dd className="font-semibold text-foreground">{batch.specs.country_of_origin || 'N/A'}</dd>
                                    </div>

                                    {/* Manufacturer Contact Info - Full Width */}
                                    {batch.specs.manufacturer_address && (
                                        <div className="p-3 rounded-lg bg-background border border-border col-span-2">
                                            <dt className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Manufacturer Address</dt>
                                            <dd className="font-semibold text-foreground text-sm">{batch.specs.manufacturer_address}</dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Market-Specific Compliance Card - INDIA LIGHT THEME */}
                        {isIndia && (
                            <Card className="bg-card border-border border-l-4 border-l-orange-500">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-foreground">
                                        <span className="text-2xl">🇮🇳</span>
                                        <span>India Compliance</span>
                                        <span className="text-xs font-normal text-muted-foreground bg-orange-500/10 px-2 py-1 rounded">Battery Aadhaar</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
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
                                                    <Badge variant="outline" className="text-muted-foreground text-[10px] px-2">
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
                                                <div className="mt-3 pt-3 border-t border-border/50">
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
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Factory className="h-3.5 w-3.5 text-orange-400" />
                                                Cell Source
                                            </dt>
                                            <dd className="font-semibold text-foreground">
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
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">HSN Code</dt>
                                            <dd className="font-mono text-lg text-foreground">
                                                {batch.hsn_code || 'N/A'}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">PLI Subsidy Eligible</dt>
                                            <dd className="font-semibold">
                                                {batch.pli_compliant ? (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Yes</Badge>
                                                ) : (
                                                    <Badge className="bg-muted text-muted-foreground">No</Badge>
                                                )}
                                            </dd>
                                        </div>
                                        {/* Financial Data for DVA Calculation */}
                                        {(batch.specs?.sale_price_inr || batch.specs?.import_cost_inr) && (
                                            <>
                                                <div className="p-4 rounded-xl bg-background border border-border">
                                                    <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Sale Price</dt>
                                                    <dd className="font-semibold text-foreground">
                                                        ₹{batch.specs.sale_price_inr?.toLocaleString('en-IN') || '0'}
                                                    </dd>
                                                </div>
                                                <div className="p-4 rounded-xl bg-background border border-border">
                                                    <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Import Material Cost</dt>
                                                    <dd className="font-semibold text-foreground">
                                                        ₹{batch.specs.import_cost_inr?.toLocaleString('en-IN') || '0'}
                                                    </dd>
                                                </div>
                                            </>
                                        )}
                                        <div className="col-span-2 p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Serial Format (BPAN)</dt>
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
                                                    <dt className="text-muted-foreground mb-1 text-xs">Bill of Entry</dt>
                                                    <dd className="font-mono text-foreground">{batch.bill_of_entry_no}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-muted-foreground mb-1 text-xs">Cell Country of Origin</dt>
                                                    <dd className="font-semibold text-foreground">{batch.country_of_origin || 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-muted-foreground mb-1 text-xs">Customs Clearance Date</dt>
                                                    <dd className="font-semibold text-foreground">
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
                            <Card className="bg-card border-border border-l-4 border-l-blue-500">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-foreground">
                                        <span className="text-2xl">🇪🇺</span>
                                        <span>EU Compliance</span>
                                        <span className="text-xs font-normal text-muted-foreground bg-blue-500/10 px-2 py-1 rounded">Battery Passport</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                                                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                                                Carbon Footprint
                                            </dt>
                                            <dd className="font-semibold text-foreground flex items-center gap-2">
                                                <span className="text-xl text-emerald-400">{batch.specs.carbon_footprint || 'N/A'}</span>
                                                {batch.specs.carbon_footprint && (
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                                                        CO₂e Certified
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Recycled Content</dt>
                                            <dd className="font-semibold text-foreground">
                                                {hasRecycledContent ? `${batch.specs.recycled_content_pct}%` : "Not declared"}
                                            </dd>
                                        </div>
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Certifications</dt>
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
                                        {batch.specs.battery_category && (
                                            <div className="p-4 rounded-xl bg-background border border-border">
                                                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Battery Category</dt>
                                                <dd className="font-semibold text-foreground">{batch.specs.battery_category}</dd>
                                            </div>
                                        )}
                                        <div className="p-4 rounded-xl bg-background border border-border">
                                            <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
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
                                            <div className="p-4 rounded-xl bg-background border border-border">
                                                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">EU Representative</dt>
                                                <dd className="font-semibold text-foreground">{batch.specs.eu_representative}</dd>
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
                                                    <div className="p-4 rounded-xl bg-background border border-border">
                                                        <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Warranty Period</dt>
                                                        <dd className="font-semibold text-foreground">{batch.specs.warranty_months} months</dd>
                                                    </div>
                                                )}
                                                {hasExpectedLifetime && (
                                                    <div className="p-4 rounded-xl bg-background border border-border">
                                                        <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Expected Lifetime</dt>
                                                        <dd className="font-semibold text-foreground">{expectedLifetimeCycles?.toLocaleString()} cycles</dd>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Recycled Content */}
                                        {hasRecycledContent && (
                                            <div className="p-4 rounded-xl bg-background border border-border">
                                                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">Recycled Content</dt>
                                                <dd className="font-semibold text-emerald-400">{batch.specs.recycled_content_pct}%</dd>
                                            </div>
                                        )}

                                        {/* Material Composition - Full Width */}
                                        {materialComposition && (
                                            <div className="col-span-2 p-4 rounded-xl bg-background border border-border">
                                                <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                                                    <Atom className="h-3.5 w-3.5 text-teal-400" />
                                                    Material Composition
                                                </dt>
                                                <dd className="grid grid-cols-3 gap-3 text-xs">
                                                    {(materialComposition.cobalt_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                                                            <span className="text-muted-foreground">Cobalt</span>
                                                            <span className="font-semibold text-foreground">{materialComposition.cobalt_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.lithium_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                                                            <span className="text-muted-foreground">Lithium</span>
                                                            <span className="font-semibold text-foreground">{materialComposition.lithium_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.nickel_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                                                            <span className="text-muted-foreground">Nickel</span>
                                                            <span className="font-semibold text-foreground">{materialComposition.nickel_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.manganese_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                                                            <span className="text-muted-foreground">Manganese</span>
                                                            <span className="font-semibold text-foreground">{materialComposition.manganese_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.graphite_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                                                            <span className="text-muted-foreground">Graphite</span>
                                                            <span className="font-semibold text-foreground">{materialComposition.graphite_pct}%</span>
                                                        </div>
                                                    )}
                                                    {(materialComposition.lead_pct ?? 0) > 0 && (
                                                        <div className="flex justify-between items-center p-2 bg-muted rounded">
                                                            <span className="text-muted-foreground">Lead</span>
                                                            <span className="font-semibold text-foreground">{materialComposition.lead_pct}%</span>
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                        )}

                                        {/* Hazardous Substances Declaration - Full Width */}
                                        {batch.specs.hazardous_substances && (
                                            <div className="col-span-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                                <dt className="text-muted-foreground mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
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
                                                        <p className="text-xs text-muted-foreground italic">{batch.specs.hazardous_substances.declaration}</p>
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                                {/* Summary & Market Info */}
                                <div className="grid gap-6 md:grid-cols-2">
                        {/* Summary Card - DARK THEME */}
                        <Card className={`bg-card border-border ${isIndia ? "border-l-4 border-l-orange-500" :
                            isEU ? "border-l-4 border-l-blue-500" :
                                "border-l-4 border-l-emerald-500"
                            }`}>
                            <CardHeader>
                                <CardTitle className="text-foreground">Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-4xl font-bold ${isIndia ? "text-orange-400" :
                                    isEU ? "text-blue-400" :
                                        "text-emerald-400"
                                    }`}>
                                    {passportCount.toLocaleString()}
                                </div>
                                <p className="text-sm mt-1 text-muted-foreground">
                                    {isIndia ? "Battery Aadhaar IDs" : isEU ? "EU Passports" : "Total Passports"} Generated
                                </p>
                            </CardContent>
                        </Card>
                        {/* Market Info Badge - DARK THEME */}
                        <Card className="bg-card border-border">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-5xl mb-3">
                                        {isIndia ? "🇮🇳" : isEU ? "🇪🇺" : "🌍"}
                                    </div>
                                    <p className="font-bold text-xl text-foreground">
                                        {isIndia ? "India Market" : isEU ? "EU Export" : "Global"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {isIndia ? "Battery Aadhaar Compliant" : isEU ? "EU Battery Regulation" : "Multi-Market Ready"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                                </div>
                            </div>
                        )}

                        {/* Passports Tab */}
                        {activeTab === 'passports' && (
                            <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">Generated Passports</h2>
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
                                className="border-border text-foreground hover:bg-muted disabled:opacity-50"
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
                                            className={`w-8 h-8 p-0 ${pageNum === pagination.page ? "" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
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
                                className="border-border text-foreground hover:bg-muted disabled:opacity-50"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                            </div>
                        )}

                        {/* Upload Tab */}
                        {activeTab === 'upload' && (
                            <div className="space-y-6">
                        {/* Upload Section - LIGHT THEME */}
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <div className="p-2 rounded-lg bg-teal-50">
                                        <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                                    </div>
                                    Upload Data
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
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
                        )}

                        {/* Compliance Tab */}
                        {activeTab === 'compliance' && (
                            <div className="space-y-6">
                        {/* Compliance Engine Score Card */}
                        {batch.status === 'ACTIVE' && (
                            <Card className="bg-card border-border border-l-4 border-l-emerald-500">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-foreground">
                                        <div className="p-2 rounded-lg bg-emerald-500/10">
                                            <Shield className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <span>Compliance Score</span>
                                        {complianceScore !== null && (
                                            <Badge className={`ml-auto ${complianceScore >= 80
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-200'
                                                : complianceScore >= 50
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-200'
                                                    : 'bg-red-500/10 text-red-500 border-red-200'
                                                }`}>
                                                {complianceScore >= 80 ? 'Passed' : complianceScore >= 50 ? 'Partial' : 'Failing'}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {complianceLoading ? (
                                        <div className="h-16 bg-muted rounded animate-pulse" />
                                    ) : complianceScore !== null ? (
                                        <div className="space-y-4">
                                            {/* Score gauge */}
                                            <div className="flex items-end gap-3">
                                                <span className={`text-4xl font-bold ${complianceScore >= 80 ? 'text-emerald-500'
                                                    : complianceScore >= 50 ? 'text-amber-500' : 'text-red-500'
                                                    }`}>
                                                    {complianceScore}%
                                                </span>
                                                <span className="text-sm text-muted-foreground mb-1">compliance score</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${complianceScore >= 80 ? 'bg-emerald-500/100'
                                                        : complianceScore >= 50 ? 'bg-amber-500/100' : 'bg-red-500/100'
                                                        }`}
                                                    style={{ width: `${complianceScore}%` }}
                                                />
                                            </div>

                                            {/* Gaps */}
                                            {complianceGaps.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                        Compliance Gaps ({complianceGaps.length})
                                                    </h4>
                                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                        {complianceGaps.map((gap, i) => (
                                                            <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${gap.severity === 'CRITICAL' ? 'bg-red-500/10' : gap.severity === 'WARNING' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                                                                }`}>
                                                                <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${gap.severity === 'CRITICAL' ? 'text-red-500' : gap.severity === 'WARNING' ? 'text-amber-500' : 'text-blue-500'
                                                                    }`} />
                                                                <div>
                                                                    <span className="font-medium text-foreground">{gap.field}</span>
                                                                    <span className="text-muted-foreground ml-1">— {gap.message}</span>
                                                                    <span className="block text-xs text-muted-foreground mt-0.5">{gap.regulation}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {complianceGaps.length === 0 && (
                                                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-lg">
                                                    <CheckCircle className="h-4 w-4" />
                                                    All compliance checks passed
                                                </div>
                                            )}

                                            {/* Download Report */}
                                            <Button
                                                variant="outline"
                                                className="w-full mt-2 border-emerald-200 text-emerald-500 hover:bg-emerald-500/10"
                                                onClick={handleDownloadComplianceReport}
                                            >
                                                <FileCheck className="mr-2 h-4 w-4" />
                                                Download Compliance Report (PDF)
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Compliance score will be calculated when the batch is activated.
                                        </p>
                                    )}
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
                            </div>
                        )}

                        {/* Reports Tab */}
                        {activeTab === 'reports' && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="bg-card border-border hover:border-blue-300 transition-colors">
                                    <CardContent className="pt-6">
                                        <Button
                                            className="w-full bg-muted hover:bg-blue-500/10 hover:border-blue-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                            onClick={() => setLabelsDialogOpen(true)}
                                            disabled={isDraft}
                                        >
                                            <Printer className="mr-2 h-4 w-4 text-blue-500" />
                                            Download PDF Labels
                                            {isDraft && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">Generate printable labels for all passports in this batch.</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-border hover:border-emerald-300 transition-colors">
                                    <CardContent className="pt-6">
                                        <Button
                                            className="w-full bg-muted hover:bg-emerald-500/10 hover:border-emerald-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                            onClick={handleDownloadQR}
                                            disabled={isDraft}
                                        >
                                            <QrCode className="mr-2 h-4 w-4 text-emerald-500" />
                                            Download QR Codes (ZIP)
                                            {isDraft && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">Download all QR codes as a ZIP archive.</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-border hover:border-teal-300 transition-colors">
                                    <CardContent className="pt-6">
                                        <Button
                                            className="w-full bg-muted hover:bg-teal-50 hover:border-teal-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                            onClick={handleExportCSV}
                                            disabled={isDraft}
                                        >
                                            <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-500" />
                                            Export Serial List (CSV)
                                            {isDraft && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">Export all serial numbers and passport data as CSV.</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-border hover:border-amber-300 transition-colors">
                                    <CardContent className="pt-6">
                                        <Button
                                            className="w-full bg-muted hover:bg-amber-500/10 hover:border-amber-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                            onClick={handleExportAuditCSV}
                                        >
                                            <FileText className="mr-2 h-4 w-4 text-amber-500" />
                                            Export Audit Log (CSV)
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">Download the full audit trail for this batch.</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border-border hover:border-emerald-300 transition-colors">
                                    <CardContent className="pt-6">
                                        <Button
                                            className="w-full bg-muted hover:bg-emerald-500/10 hover:border-emerald-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                            onClick={handleDownloadComplianceReport}
                                            disabled={isDraft}
                                        >
                                            <FileCheck className="mr-2 h-4 w-4 text-emerald-500" />
                                            Compliance Report (PDF)
                                            {isDraft && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">Download the full compliance assessment report.</p>
                                    </CardContent>
                                </Card>

                                {(batch.market_region === "EU" || batch.market_region === "GLOBAL") && (
                                    <Card className="bg-card border-border hover:border-emerald-300 transition-colors">
                                        <CardContent className="pt-6">
                                            <Button
                                                className="w-full bg-muted hover:bg-emerald-500/10 hover:border-emerald-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                                onClick={handleExportComplianceDeclaration}
                                                disabled={isDraft}
                                            >
                                                <Leaf className="mr-2 h-4 w-4 text-emerald-500" />
                                                Carbon Declaration (PDF)
                                                {isDraft && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">Generate the carbon footprint compliance declaration.</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {(batch.market_region === "EU" || batch.market_region === "GLOBAL") && (
                                    <Card className="bg-card border-border hover:border-indigo-300 transition-colors">
                                        <CardContent className="pt-6">
                                            <Button
                                                className="w-full bg-muted hover:bg-indigo-500/10 hover:border-indigo-300 text-foreground border border-border disabled:opacity-50 transition-all duration-200"
                                                onClick={handleExportDueDiligence}
                                                disabled={isDraft}
                                            >
                                                <Shield className="mr-2 h-4 w-4 text-indigo-500" />
                                                Due Diligence Report (PDF)
                                                {isDraft && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-2">Generate the supply chain due diligence report.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
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
