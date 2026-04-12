"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useAuth } from "@/context/auth-context"
import api, { getBaseUrl } from "@/lib/api"
import { Building2, Globe, Mail, MapPin, Image as ImageIcon, ShieldCheck, FileCheck, FileText, Upload, CheckCircle, ExternalLink, Loader2, Hash } from "lucide-react"
import { toast } from "sonner"
import { DataAccessTokens } from "@/components/settings/data-access-tokens"
import { DataVisibility } from "@/components/settings/data-visibility"

// Document Upload Component with Verification Status
function DocumentUpload({
    label,
    documentType,
    currentStatus = "NOT_UPLOADED",
    onUploadSuccess
}: {
    label: string
    documentType: "epr" | "bis" | "pli"
    currentStatus?: string // NOT_UPLOADED, PENDING, VERIFIED, REJECTED
    onUploadSuccess: () => void
}) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            toast.error("Only PDF files are allowed")
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("document_type", documentType)

            await api.post("/settings/upload-document", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })

            toast.success(`${label} certificate uploaded successfully`)
            onUploadSuccess()
        } catch (error: unknown) {
            console.error("Upload failed:", error)
            const apiError = error as { response?: { data?: { error?: string } } }
            toast.error(apiError.response?.data?.error || "Failed to upload certificate")
        } finally {
            setUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleViewDocument = () => {
        // Open in new tab
        const token = localStorage.getItem("token")
        window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/settings/documents/${documentType}?token=${token}`, "_blank")
    }

    // Render status badge based on verification state
    const renderStatusBadge = () => {
        switch (currentStatus) {
            case "VERIFIED":
                return (
                    <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium" title="Document verified by compliance team">
                        <CheckCircle className="h-3.5 w-3.5" />
                        ✅ Verified
                    </span>
                )
            case "PENDING":
                return (
                    <span className="flex items-center gap-1.5 text-amber-500 text-xs font-medium" title="Our compliance team is reviewing your document">
                        ⏳ Verification Pending
                    </span>
                )
            case "REJECTED":
                return (
                    <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium" title="Document rejected. Please upload a valid document.">
                        ❌ Rejected
                    </span>
                )
            default:
                return null
        }
    }

    const hasDocument = currentStatus !== "NOT_UPLOADED" && currentStatus !== ""

    return (
        <div className="flex items-center gap-2 mt-2">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
            />

            {hasDocument ? (
                <div className="flex items-center gap-2">
                    {renderStatusBadge()}
                    <button
                        type="button"
                        onClick={handleViewDocument}
                        className="text-xs text-blue-500 hover:text-blue-500 flex items-center gap-1"
                    >
                        <ExternalLink className="h-3 w-3" />
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        {uploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            "Replace"
                        )}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border bg-card text-foreground hover:bg-background hover:border-border transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-3 w-3" />
                            Upload Certificate
                        </>
                    )}
                </button>
            )}
        </div>
    )
}

// Logo Upload Component
function LogoUpload({
    currentLogoUrl,
    onUploadSuccess
}: {
    currentLogoUrl: string
    onUploadSuccess: (newUrl: string) => void
}) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ["image/png", "image/jpeg", "image/jpg"]
        if (!validTypes.includes(file.type)) {
            toast.error("Only PNG and JPEG images are allowed")
            return
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await api.post("/settings/upload-logo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })

            toast.success("Logo uploaded successfully")
            onUploadSuccess(response.data.logo_url)
        } catch (error: unknown) {
            console.error("Upload failed:", error)
            const apiError = error as { response?: { data?: { error?: string } } }
            toast.error(apiError.response?.data?.error || "Failed to upload logo")
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background hover:border-border transition-colors disabled:opacity-50"
            >
                {uploading ? (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload className="h-3 w-3" />
                        {currentLogoUrl ? "Change Logo" : "Upload Logo"}
                    </>
                )}
            </button>
        </div>
    )
}

export default function SettingsPage() {
    const { user, refreshUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [logoError, setLogoError] = useState(false)
    const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'compliance' | 'privacy' | 'tokens'>('profile')

    const [formData, setFormData] = useState({
        company_name: "",
        address: "",
        support_email: "",
        website: "",
        logo_url: "",
        // India Regulatory Fields
        epr_registration_number: "",
        bis_r_number: "",
        iec_code: "",
        // MoRTH BPAN Fields
        morth_manufacturer_code: "",
        morth_factory_codes: "",
        // EU Authorized Representative Fields
        eu_authorized_representative_name: "",
        eu_authorized_representative_address: "",
        eu_contact_email: "",
        // Data Visibility Rules
        data_visibility: {} as Record<string, string>
    })

    // Certificate paths state
    const [certificatePaths, setCertificatePaths] = useState({
        epr_certificate_path: "",
        bis_certificate_path: "",
        pli_certificate_path: "",
        epr_status: "NOT_UPLOADED",
        bis_status: "NOT_UPLOADED",
        pli_status: "NOT_UPLOADED"
    })

    useEffect(() => {
        if (user) {
            setFormData({
                company_name: user.company_name || "",
                address: user.address || "",
                support_email: user.support_email || "",
                website: user.website || "",
                logo_url: user.logo_url || "",
                epr_registration_number: user.epr_registration_number || "",
                bis_r_number: user.bis_r_number || "",
                iec_code: user.iec_code || "",
                morth_manufacturer_code: user.morth_manufacturer_code || "",
                morth_factory_codes: user.morth_factory_codes || "",
                eu_authorized_representative_name: user.eu_authorized_representative_name || "",
                eu_authorized_representative_address: user.eu_authorized_representative_address || "",
                eu_contact_email: user.eu_contact_email || "",
                data_visibility: user.data_visibility || {}
            })
            setCertificatePaths({
                epr_certificate_path: user.epr_certificate_path || "",
                bis_certificate_path: user.bis_certificate_path || "",
                pli_certificate_path: user.pli_certificate_path || "",
                epr_status: user.epr_status || "NOT_UPLOADED",
                bis_status: user.bis_status || "NOT_UPLOADED",
                pli_status: user.pli_status || "NOT_UPLOADED"
            })
        }
    }, [user])

    useEffect(() => {
        setLogoError(false)
    }, [formData.logo_url])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            await api.put("/auth/profile", formData)
            await refreshUser()
            setMessage({ type: 'success', text: "Organization profile updated successfully" })
        } catch (error) {
            console.error("Failed to update profile:", error)
            setMessage({ type: 'error', text: "Failed to update profile. Please try again." })
        } finally {
            setLoading(false)
        }
    }

    const handleUploadSuccess = async () => {
        // Refresh user data to get updated certificate paths
        await refreshUser()
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="w-full mx-auto space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Organization Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your company profile and compliance documents</p>
                </div>

                {/* Settings Tabs */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    {[
                        { id: 'profile' as const, label: 'Profile' },
                        { id: 'compliance' as const, label: 'India Compliance' },
                        { id: 'privacy' as const, label: 'Data Privacy' },
                        { id: 'tokens' as const, label: 'API Tokens' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSettingsTab(tab.id)}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                                activeSettingsTab === tab.id
                                    ? 'bg-card text-foreground shadow-none'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                {activeSettingsTab === 'profile' && (<>
                {/* Company Profile Card */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="border-b border-border px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-100">
                                <Building2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-medium text-foreground">Company Profile</h2>
                                <p className="text-xs text-muted-foreground">Basic information displayed on battery passports</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                Company Name
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Acme Battery Co."
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                Manufacturer Address
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-border bg-card px-3 py-2 pl-9 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="123 Industrial Park, Energy City, Country"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">This address will appear on your battery passports.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Support Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Support Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="support@acme.com"
                                        value={formData.support_email}
                                        onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="url"
                                        className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="https://acme.com"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                Company Logo
                            </label>
                            <div className="flex items-start gap-4">
                                {/* Logo Preview */}
                                <div className="relative h-20 w-20 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                                    {formData.logo_url && !logoError ? (
                                        <Image
                                            src={formData.logo_url.startsWith('/') ? `${getBaseUrl()}${formData.logo_url}` : formData.logo_url}
                                            alt="Company logo"
                                            fill
                                            sizes="80px"
                                            className="object-contain"
                                            onError={() => setLogoError(true)}
                                        />
                                    ) : null}
                                    <div className={`flex flex-col items-center justify-center text-muted-foreground ${formData.logo_url && !logoError ? 'hidden' : ''}`}>
                                        <ImageIcon className="h-8 w-8" />
                                    </div>
                                </div>

                                {/* Upload Controls */}
                                <div className="flex-1 space-y-2">
                                    <LogoUpload
                                        currentLogoUrl={formData.logo_url}
                                        onUploadSuccess={async (newUrl) => {
                                            setFormData({ ...formData, logo_url: newUrl })
                                            await refreshUser()
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">PNG or JPEG, max 2MB. Displayed on passports and labels.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </>)}

                {activeSettingsTab === 'compliance' && (<>
                {/* India Compliance Vault Card */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="border-b border-border px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-100">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-foreground">India Compliance Vault</h3>
                                <p className="text-xs text-muted-foreground">BWM 2022 & BIS Safety Standards • Upload certificates for verification</p>
                            </div>
                        </div>
                        {/* Compliance Readiness Indicator */}
                        {(() => {
                            const checks = [
                                { label: 'EPR', done: !!formData.epr_registration_number },
                                { label: 'BIS', done: !!formData.bis_r_number },
                                { label: 'IEC', done: !!formData.iec_code },
                                { label: 'PLI', done: certificatePaths.pli_status === 'VERIFIED' || certificatePaths.pli_status === 'PENDING' },
                                { label: 'MoRTH', done: !!formData.morth_manufacturer_code },
                            ];
                            const completed = checks.filter(c => c.done).length;
                            return (
                                <div className="mt-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-muted-foreground">{completed} of {checks.length} configured</span>
                                        <span className="text-xs font-medium text-foreground">{Math.round((completed / checks.length) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${completed === checks.length ? 'bg-emerald-500/100' : 'bg-amber-400'}`}
                                            style={{ width: `${(completed / checks.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        {/* EPR Registration Number */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                EPR Registration Number
                            </label>
                            <div className="relative">
                                <FileCheck className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="EPR/B/2024/XXXX"
                                    value={formData.epr_registration_number}
                                    onChange={(e) => setFormData({ ...formData, epr_registration_number: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">CPCB Extended Producer Responsibility registration.</p>
                            <DocumentUpload
                                label="EPR"
                                documentType="epr"
                                currentStatus={certificatePaths.epr_status}
                                onUploadSuccess={handleUploadSuccess}
                            />
                        </div>

                        {/* BIS R-Number */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                BIS R-Number (IS 16046)
                            </label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="R-12345678"
                                    value={formData.bis_r_number}
                                    onChange={(e) => setFormData({ ...formData, bis_r_number: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">BIS CRS registration for IS 16046 safety standard.</p>
                            <DocumentUpload
                                label="BIS"
                                documentType="bis"
                                currentStatus={certificatePaths.bis_status}
                                onUploadSuccess={handleUploadSuccess}
                            />
                        </div>
                    </div>

                    {/* IEC Code with PLI Certificate */}
                    <div className="grid gap-6 md:grid-cols-2 px-6 pb-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                IEC Code (Import Export Code)
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="AAACT1234A"
                                    value={formData.iec_code}
                                    onChange={(e) => setFormData({ ...formData, iec_code: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Required for importers of battery cells.</p>
                        </div>

                        {/* PLI Certificate */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                PLI Scheme Certificate
                            </label>
                            <div className="p-3 rounded-md border border-border bg-background">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Upload your Production Linked Incentive (PLI) scheme eligibility certificate.
                                </p>
                                <DocumentUpload
                                    label="PLI"
                                    documentType="pli"
                                    currentStatus={certificatePaths.pli_status}
                                    onUploadSuccess={handleUploadSuccess}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MoRTH BPAN Configuration */}
                    <div className="border-t border-border px-6 py-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">MoRTH BPAN Configuration</p>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    MoRTH Manufacturer Code
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-orange-500" />
                                    <input
                                        type="text"
                                        maxLength={3}
                                        className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 font-mono uppercase disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="NKY"
                                        value={formData.morth_manufacturer_code}
                                        onChange={(e) => setFormData({ ...formData, morth_manufacturer_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">3-char MoRTH-registered code used in the BMI section of your BPAN serial numbers.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-foreground">
                                    Factory Codes
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-orange-500" />
                                    <input
                                        type="text"
                                        className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 font-mono disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder='[{"code":"01","name":"Pune Plant"},{"code":"02","name":"Chennai Plant"}]'
                                        value={formData.morth_factory_codes}
                                        onChange={(e) => setFormData({ ...formData, morth_factory_codes: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">JSON array of 2-char factory codes used in the BI section of BPAN. E.g. <code className="bg-muted px-1 rounded">&#91;&#123;&quot;code&quot;:&quot;01&quot;,&quot;name&quot;:&quot;Pune Plant&quot;&#125;&#93;</code></p>
                            </div>
                        </div>
                    </div>
                </div>
                </>)}

                {/* EU Compliance Contact Card */}
                {activeSettingsTab === 'profile' && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="border-b border-border px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-100">
                                <Globe className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-foreground">EU Authorized Representative</h3>
                                <p className="text-xs text-muted-foreground">Required for EU Battery Passport compliance</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                EU Authorized Representative Name
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="EU Rep GmbH"
                                    value={formData.eu_authorized_representative_name}
                                    onChange={(e) => setFormData({ ...formData, eu_authorized_representative_name: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Legal representative for EU compliance.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                EU Contact Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                                <input
                                    type="email"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="compliance@eurep.eu"
                                    value={formData.eu_contact_email}
                                    onChange={(e) => setFormData({ ...formData, eu_contact_email: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Regulatory contact email for EU.</p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium leading-none text-foreground">
                                EU Authorized Representative Address
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Street, City, Country"
                                    value={formData.eu_authorized_representative_address}
                                    onChange={(e) => setFormData({ ...formData, eu_authorized_representative_address: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Official address of EU representative.</p>
                        </div>
                    </div>
                </div>
                )}

                {/* Save All Settings */}
                {(activeSettingsTab === 'profile' || activeSettingsTab === 'compliance') && (
                <div className="sticky bottom-0 bg-background border-t border-border -mx-6 px-6 py-4 mt-6 flex items-center justify-between">
                    {message && (
                        <p className={`text-sm ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {message.text}
                        </p>
                    )}
                    <div className="ml-auto">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            Save All Settings
                        </button>
                    </div>
                </div>
                )}
                </form>

                {activeSettingsTab === 'privacy' && (
                    <DataVisibility dataVisibility={formData.data_visibility} onChange={(v) => setFormData({ ...formData, data_visibility: v })} />
                )}

                {activeSettingsTab === 'tokens' && (
                    <DataAccessTokens />
                )}
            </div>
        </div>
    )
}
