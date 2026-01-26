"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { Building2, Globe, Mail, MapPin, Image as ImageIcon, ShieldCheck, FileCheck, FileText, Upload, CheckCircle, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Document Upload Component with Verification Status
function DocumentUpload({
    label,
    documentType,
    currentPath,
    currentStatus = "NOT_UPLOADED",
    onUploadSuccess
}: {
    label: string
    documentType: "epr" | "bis" | "pli"
    currentPath: string
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
        } catch (error: any) {
            console.error("Upload failed:", error)
            toast.error(error.response?.data?.error || "Failed to upload certificate")
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
        window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/settings/documents/${documentType}?token=${token}`, "_blank")
    }

    // Render status badge based on verification state
    const renderStatusBadge = () => {
        switch (currentStatus) {
            case "VERIFIED":
                return (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium" title="Document verified by compliance team">
                        <CheckCircle className="h-3.5 w-3.5" />
                        ✅ Verified
                    </span>
                )
            case "PENDING":
                return (
                    <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium" title="Our compliance team is reviewing your document">
                        ⏳ Verification Pending
                    </span>
                )
            case "REJECTED":
                return (
                    <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium" title="Document rejected. Please upload a valid document.">
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
                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                        <ExternalLink className="h-3 w-3" />
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-xs text-zinc-400 hover:text-zinc-300"
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
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50"
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
        } catch (error: any) {
            console.error("Upload failed:", error)
            toast.error(error.response?.data?.error || "Failed to upload logo")
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
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50"
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

    const [formData, setFormData] = useState({
        company_name: "",
        address: "",
        support_email: "",
        website: "",
        logo_url: "",
        // India Regulatory Fields
        epr_registration_number: "",
        bis_r_number: "",
        iec_code: ""
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
                iec_code: user.iec_code || ""
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
        <div className="min-h-screen bg-[#0F172A] text-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Page Header */}
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-r from-teal-900/20 via-slate-900 to-slate-900 p-6">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-white">Organization Settings</h1>
                        <p className="text-slate-400 mt-1">Manage your company profile and compliance documents</p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                {/* Company Profile Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
                    <div className="border-b border-slate-800 bg-slate-900 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-500/10">
                                <Building2 className="h-5 w-5 text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Company Profile</h2>
                                <p className="text-xs text-zinc-500">Basic information displayed on battery passports</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Company Name
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 pl-9 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Acme Battery Co."
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Manufacturer Address
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 pl-9 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="123 Industrial Park, Energy City, Country"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-zinc-500">This address will appear on your battery passports.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Support Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Support Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="email"
                                        className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 pl-9 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="support@acme.com"
                                        value={formData.support_email}
                                        onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="url"
                                        className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 pl-9 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="https://acme.com"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Company Logo
                            </label>
                            <div className="flex items-start gap-4">
                                {/* Logo Preview */}
                                <div className="h-20 w-20 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {formData.logo_url ? (
                                        <img
                                            src={formData.logo_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${formData.logo_url}` : formData.logo_url}
                                            alt="Company logo"
                                            className="h-full w-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`flex flex-col items-center justify-center text-zinc-500 ${formData.logo_url ? 'hidden' : ''}`}>
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
                                    <p className="text-xs text-zinc-500">PNG or JPEG, max 2MB. Displayed on passports and labels.</p>
                                </div>
                            </div>
                        </div>

                        {/* India Regulatory Details Section */}
                        <div className="mt-8 -mx-6 border-t border-zinc-800">
                            <div className="px-6 py-4 bg-zinc-900/80">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">India Compliance Vault</h3>
                                        <p className="text-xs text-zinc-500">BWM 2022 &amp; BIS Safety Standards • Upload certificates for verification</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 grid gap-6 md:grid-cols-2">
                                {/* EPR Registration Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-zinc-300">
                                        EPR Registration Number
                                    </label>
                                    <div className="relative">
                                        <FileCheck className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="EPR/B/2024/XXXX"
                                            value={formData.epr_registration_number}
                                            onChange={(e) => setFormData({ ...formData, epr_registration_number: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500">CPCB Extended Producer Responsibility registration.</p>
                                    <DocumentUpload
                                        label="EPR"
                                        documentType="epr"
                                        currentPath={certificatePaths.epr_certificate_path}
                                        currentStatus={certificatePaths.epr_status}
                                        onUploadSuccess={handleUploadSuccess}
                                    />
                                </div>

                                {/* BIS R-Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-zinc-300">
                                        BIS R-Number (IS 16046)
                                    </label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="R-12345678"
                                            value={formData.bis_r_number}
                                            onChange={(e) => setFormData({ ...formData, bis_r_number: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500">BIS CRS registration for IS 16046 safety standard.</p>
                                    <DocumentUpload
                                        label="BIS"
                                        documentType="bis"
                                        currentPath={certificatePaths.bis_certificate_path}
                                        currentStatus={certificatePaths.bis_status}
                                        onUploadSuccess={handleUploadSuccess}
                                    />
                                </div>
                            </div>

                            {/* IEC Code with PLI Certificate */}
                            <div className="grid gap-6 md:grid-cols-2 mt-6 px-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-zinc-300">
                                        IEC Code (Import Export Code)
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="AAACT1234A"
                                            value={formData.iec_code}
                                            onChange={(e) => setFormData({ ...formData, iec_code: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500">Required for importers of battery cells.</p>
                                </div>

                                {/* PLI Certificate */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none text-zinc-300">
                                        PLI Scheme Certificate
                                    </label>
                                    <div className="p-3 rounded-md border border-zinc-700 bg-zinc-800/50">
                                        <p className="text-xs text-zinc-500 mb-2">
                                            Upload your Production Linked Incentive (PLI) scheme eligibility certificate.
                                        </p>
                                        <DocumentUpload
                                            label="PLI"
                                            documentType="pli"
                                            currentPath={certificatePaths.pli_certificate_path}
                                            currentStatus={certificatePaths.pli_status}
                                            onUploadSuccess={handleUploadSuccess}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feedback Message */}
                        {message && (
                            <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 mt-6 border-t border-zinc-800">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-teal-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 hover:from-teal-500 hover:to-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                            >
                                {loading ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
