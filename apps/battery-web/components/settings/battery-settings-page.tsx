"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import api, { getBaseUrl } from "@/lib/api"
import { Building2, Globe, Mail, MapPin, Image as ImageIcon, ShieldCheck, FileCheck, FileText, Upload, CheckCircle, ExternalLink, Loader2, Hash, AlertTriangle, ArrowRight, Clock, Lock, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DataAccessTokens } from "@/components/settings/data-access-tokens"
import { DataVisibility } from "@/components/settings/data-visibility"
import { DocumentUpload } from "@/components/shared/document-upload"

type SettingsTabId = 'profile' | 'compliance' | 'eu-compliance' | 'privacy' | 'tokens'

const SETTINGS_TABS: { id: SettingsTabId; label: string; desc: string; icon: typeof Building2 }[] = [
  { id: 'profile', label: 'Profile', desc: 'Company info & logo', icon: Building2 },
  { id: 'compliance', label: 'India Compliance', desc: 'BIS, EPR, PLI & BPAN', icon: ShieldCheck },
  { id: 'eu-compliance', label: 'EU Compliance', desc: 'Authorized representative', icon: Globe },
  { id: 'privacy', label: 'Data Privacy', desc: 'Passport visibility rules', icon: Lock },
  { id: 'tokens', label: 'API Tokens', desc: 'Programmatic data access', icon: KeyRound },
]

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
 className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-muted text-foreground hover:bg-accent transition-colors disabled:opacity-50"
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

// Certificate readiness helpers
// "Valid" means fully verified — used for the compliance checklist's done state.
function isCertValid(status?: string) {
  return status === "VERIFIED"
}
// "Submitted" means something is on file (verified or awaiting review) — used to
// decide whether the field needs the red "certificate required" warning at all.
function isCertSubmitted(status?: string) {
  return status === "PENDING" || status === "VERIFIED"
}

interface ComplianceCheck {
  label: string
  done: boolean
  required: boolean
  warning?: string
}

function getIndiaComplianceChecks(
  formData: Record<string, unknown>,
  certs: Record<string, string>
): ComplianceCheck[] {
  const eprNumber = String(formData.epr_registration_number || "").trim()
  const bisNumber = String(formData.bis_r_number || "").trim()
  const iecCode = String(formData.iec_code || "").trim()
  const morthCode = String(formData.morth_manufacturer_code || "").trim()

  return [
    {
      label: "EPR Number",
      done: !!eprNumber && isCertValid(certs.epr_status),
      required: !!eprNumber,
      warning: eprNumber && !isCertSubmitted(certs.epr_status)
        ? "Upload EPR certificate to activate batches"
        : eprNumber && !isCertValid(certs.epr_status)
          ? "EPR certificate pending verification"
          : undefined,
    },
    {
      label: "BIS Number",
      done: !!bisNumber && isCertValid(certs.bis_status),
      required: !!bisNumber,
      warning: bisNumber && !isCertSubmitted(certs.bis_status)
        ? "Upload BIS certificate to activate batches"
        : bisNumber && !isCertValid(certs.bis_status)
          ? "BIS certificate pending verification"
          : undefined,
    },
    {
      label: "IEC Code",
      done: !!iecCode,
      required: true,
    },
    {
      label: "PLI Certificate",
      done: isCertValid(certs.pli_status),
      required: false,
      warning: undefined,
    },
    {
      label: "MoRTH Code",
      done: !!morthCode && morthCode !== "TBC",
      required: true,
    },
  ]
}

// Field-level badge shown next to a regulatory number once its certificate
// has been uploaded. Mirrors the wording used by DocumentUpload's own status
// badge below the field, so "Submitted" vs "Verified" never contradict each
// other on screen.
function getFieldStatusBadge(status?: string) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-normal">
        <CheckCircle className="h-3 w-3" />
        Verified
      </span>
    )
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-normal">
        <Clock className="h-3 w-3" />
        Submitted — pending verification
      </span>
    )
  }
  return null
}

function hasPendingCertVerification(certs: Record<string, string>): boolean {
  return certs.epr_status === "PENDING" || certs.bis_status === "PENDING" || certs.pli_status === "PENDING"
}

function getActivationBlockers(
  formData: Record<string, unknown>,
  certs: Record<string, string>
): string[] {
  const blockers: string[] = []
  const eprNumber = String(formData.epr_registration_number || "").trim()
  const bisNumber = String(formData.bis_r_number || "").trim()

  if (eprNumber && !isCertSubmitted(certs.epr_status)) {
    blockers.push("EPR certificate upload required")
  }
  if (bisNumber && !isCertSubmitted(certs.bis_status)) {
    blockers.push("BIS certificate upload required")
  }
  return blockers
}

export default function SettingsPage() {
 const { user, refreshUser } = useAuth()
 const searchParams = useSearchParams()
 const [loading, setLoading] = useState(false)
 const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
 const [logoError, setLogoError] = useState(false)
 const [factoryCodeError, setFactoryCodeError] = useState(false)
 const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTabId>(
  (searchParams.get('tab') as SettingsTabId) || 'profile'
 )

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

 // Snapshot of formData as last loaded/saved — diffed against formData to
 // detect unsaved changes without re-fetching from the server.
 const [initialFormData, setInitialFormData] = useState(formData)

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
 const loaded = {
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
 }
 setFormData(loaded)
 setInitialFormData(loaded)
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

 const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData)

 useEffect(() => {
 if (!isDirty) return
 const handler = (e: BeforeUnloadEvent) => {
 e.preventDefault()
 e.returnValue = ""
 }
 window.addEventListener("beforeunload", handler)
 return () => window.removeEventListener("beforeunload", handler)
 }, [isDirty])

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setMessage(null)

 try {
 await api.put("/auth/profile", formData)
 await refreshUser()
 setInitialFormData(formData)
 setMessage({ type: 'success', text: "Organization profile updated successfully" })
 } catch (error) {
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
 <div className="min-h-screen bg-sidebar">
 <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
 {/* Page Header */}
 <div>
 <h1 className="text-2xl font-semibold text-foreground tracking-tight">Organization Settings</h1>
 <p className="text-sm text-muted-foreground mt-1">Manage your company profile, compliance documents, and data access.</p>
 </div>

 <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
 {/* Settings navigation */}
 <nav className="h-max lg:sticky lg:top-6 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
 {SETTINGS_TABS.map(tab => {
 const Icon = tab.icon
 const active = activeSettingsTab === tab.id
 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveSettingsTab(tab.id)}
 aria-current={active ? 'page' : undefined}
 className={cn(
 "group flex shrink-0 items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors lg:w-full",
 active
 ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
 : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
 )}
 >
 <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
 <span className="min-w-0">
 <span className="block text-sm font-medium whitespace-nowrap">{tab.label}</span>
 <span className="hidden lg:block text-xs text-muted-foreground">{tab.desc}</span>
 </span>
 </button>
 )
 })}
 </nav>

 {/* Settings content */}
 <div className="min-w-0 space-y-6">
 <form onSubmit={handleSubmit} className="space-y-6">
 {activeSettingsTab === 'profile' && (<>
 {/* Company Profile Card */}
 <div className="relative bg-muted border border-border rounded-lg overflow-visible"><div className="border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded bg-blue-500/10">
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
 className="flex min-h-[80px] w-full border border-border bg-transparent px-3 py-2 pl-9 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
 placeholder="https://acme.com"
 value={formData.website}
 onChange={(e) => setFormData({ ...formData, website: e.target.value })}
 />
 </div>
 </div>
 </div>

 {/* Target Market */}
 <div className="space-y-2">
 <label className="text-sm font-medium leading-none text-foreground">
 Target Markets
 </label>
 <select
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
 value={formData.data_visibility?.primary_market || "india"}
 onChange={(e) => setFormData({
 ...formData,
 data_visibility: { ...formData.data_visibility, primary_market: e.target.value }
 })}
 >
 <option value="india">India Only</option>
 <option value="eu">EU Only</option>
 <option value="both">India & EU</option>
 </select>
 <p className="text-xs text-muted-foreground">This drives default market selection when creating new batches.</p>
 </div>

 {/* Logo Upload */}
 <div className="space-y-2">
 <label className="text-sm font-medium leading-none text-foreground">
 Company Logo
 </label>
 <div className="flex items-start gap-4">
 {/* Logo Preview */}
 <div className="relative h-24 w-24 rounded-lg border border-dashed border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
 {formData.logo_url && !logoError ? (
 <Image
 src={formData.logo_url.startsWith('/') ? `${getBaseUrl()}${formData.logo_url}` : formData.logo_url}
 alt="Company logo"
 fill
 sizes="96px"
 className="object-contain p-1"
 onError={() => setLogoError(true)}
 />
 ) : null}
 <div className={`flex flex-col items-center justify-center gap-1 text-muted-foreground ${formData.logo_url && !logoError ? 'hidden' : ''}`}>
 <ImageIcon className="h-7 w-7" />
 <span className="text-[10px]">No logo</span>
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
 <div className="relative bg-muted border border-border rounded-lg overflow-visible"><div className="border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded bg-emerald-500/10">
 <ShieldCheck className="h-5 w-5 text-emerald-500" />
 </div>
 <div>
 <h3 className="text-base font-medium text-foreground">India Compliance Vault</h3>
 <p className="text-xs text-muted-foreground">BWM 2022 & BIS Safety Standards • Upload certificates for verification</p>
 </div>
 </div>
 {/* Compliance Readiness Indicator */}
 {(() => {
 const checks = getIndiaComplianceChecks(formData, certificatePaths)
 const completed = checks.filter(c => c.done).length
 const requiredIncomplete = checks.filter(c => c.required && !c.done).length
 const blockers = getActivationBlockers(formData, certificatePaths)
 return (
 <div className="mt-3">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-xs text-muted-foreground">{completed} of {checks.length} ready for activation</span>
 <span className="text-xs font-medium text-foreground">{Math.round((completed / checks.length) * 100)}%</span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5">
 <div
 className={`h-1.5 rounded-full transition-all ${completed === checks.length ? 'bg-emerald-500' : requiredIncomplete > 0 ? 'bg-red-400' : 'bg-amber-400'}`}
 style={{ width: `${(completed / checks.length) * 100}%` }}
 />
 </div>
 {completed === checks.length && hasPendingCertVerification(certificatePaths) && (
 <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400">
 <Clock className="h-3 w-3 shrink-0" />
 All required documents submitted — batches can be activated. Some certificates are still pending registry/admin verification.
 </p>
 )}
 {blockers.length > 0 && (
 <div className="mt-2 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
 <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
 <div className="text-xs text-red-300">
 <p className="font-medium">Activation blocked — missing certificates:</p>
 <ul className="list-disc list-inside mt-0.5">
 {blockers.map((b, i) => <li key={i}>{b}</li>)}
 </ul>
 <Link
 href="/onboarding?step=3"
 className="inline-flex items-center gap-1 mt-1.5 text-teal-400 hover:text-teal-300"
 >
 Resume Onboarding
 <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 </div>
 )}
 </div>
 )
 })()}
 </div>

 <div className="p-6 grid gap-6 md:grid-cols-2">
 {/* EPR Registration Number */}
 <div className={`space-y-2 p-3 rounded border ${formData.epr_registration_number?.trim() && !isCertSubmitted(certificatePaths.epr_status) ? 'border-red-500/30 bg-red-500/5' : 'border-transparent'}`}>
 <label className="text-sm font-medium leading-none text-foreground flex items-center gap-2">
 EPR Registration Number
 {formData.epr_registration_number?.trim() && !isCertSubmitted(certificatePaths.epr_status) && (
 <span className="inline-flex items-center gap-1 text-xs text-red-400 font-normal">
 <AlertTriangle className="h-3 w-3" />
 Certificate required
 </span>
 )}
 {formData.epr_registration_number?.trim() && isCertSubmitted(certificatePaths.epr_status) && getFieldStatusBadge(certificatePaths.epr_status)}
 </label>
 <div className="relative">
 <FileCheck className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
 <input
 type="text"
 className={`flex h-9 w-full border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${formData.epr_registration_number?.trim() && !isCertSubmitted(certificatePaths.epr_status) ? 'border-red-400 focus-visible:ring-red-400' : 'border-border focus-visible:ring-emerald-500'}`}
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
 <div className={`space-y-2 p-3 rounded border ${formData.bis_r_number?.trim() && !isCertSubmitted(certificatePaths.bis_status) ? 'border-red-500/30 bg-red-500/5' : 'border-transparent'}`}>
 <label className="text-sm font-medium leading-none text-foreground flex items-center gap-2">
 BIS R-Number (IS 16046)
 {formData.bis_r_number?.trim() && !isCertSubmitted(certificatePaths.bis_status) && (
 <span className="inline-flex items-center gap-1 text-xs text-red-400 font-normal">
 <AlertTriangle className="h-3 w-3" />
 Certificate required
 </span>
 )}
 {formData.bis_r_number?.trim() && isCertSubmitted(certificatePaths.bis_status) && getFieldStatusBadge(certificatePaths.bis_status)}
 </label>
 <div className="relative">
 <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
 <input
 type="text"
 className={`flex h-9 w-full border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${formData.bis_r_number?.trim() && !isCertValid(certificatePaths.bis_status) ? 'border-red-400 focus-visible:ring-red-400' : 'border-border focus-visible:ring-blue-500'}`}
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
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
 <div className="p-3 rounded-md bg-background">
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 font-mono uppercase disabled:cursor-not-allowed disabled:opacity-50"
 placeholder="NKY"
 value={formData.morth_manufacturer_code}
 onChange={(e) => setFormData({ ...formData, morth_manufacturer_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
 />
 </div>
 {formData.morth_manufacturer_code === 'TBC' && (
 <p className="text-xs text-amber-500">
 ⚠️ “TBC” is a placeholder — replace it with your actual 3-character MoRTH-registered code.
 </p>
 )}
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
 className={`flex h-9 w-full border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 font-mono disabled:cursor-not-allowed disabled:opacity-50 ${factoryCodeError ? 'border-red-400 focus-visible:ring-red-400' : 'border-border focus-visible:ring-orange-500'}`}
 placeholder='[{"code":"01","name":"Pune Plant"},{"code":"02","name":"Chennai Plant"}]'
 value={formData.morth_factory_codes}
 onChange={(e) => {
 const val = e.target.value
 try {
 if (val.trim()) JSON.parse(val)
 setFactoryCodeError(false)
 } catch {
 setFactoryCodeError(true)
 }
 setFormData({ ...formData, morth_factory_codes: val })
 }}
 />
 </div>
 {factoryCodeError && (
 <p className="text-xs text-red-400">Invalid JSON format</p>
 )}
 <p className="text-xs text-muted-foreground">JSON array of 2-char factory codes used in the BI section of BPAN. E.g. <code className="bg-muted px-1 rounded">&#91;&#123;&quot;code&quot;:&quot;01&quot;,&quot;name&quot;:&quot;Pune Plant&quot;&#125;&#93;</code></p>
 </div>
 </div>
 </div>
 </div>
 </>)}

 {/* EU Authorized Representative Card — own tab, separate from India Compliance */}
 {activeSettingsTab === 'eu-compliance' && (
 <div className="relative bg-muted border border-border rounded-lg overflow-visible"><div className="border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded bg-indigo-500/10">
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
 className="flex h-9 w-full border border-border bg-transparent px-3 py-1 pl-9 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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

 {/* Compliance Activation Summary */}
 {activeSettingsTab === 'compliance' && (
 <div className="px-6 py-4 border-t border-border">
 {(() => {
 const blockers = getActivationBlockers(formData, certificatePaths)
 const checks = getIndiaComplianceChecks(formData, certificatePaths)
 const allReady = checks.every(c => c.done)
 if (allReady) {
 return (
 <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
 <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
 <div className="text-sm text-emerald-300">
 <p>All compliance items ready. You can activate India batches.</p>
 {hasPendingCertVerification(certificatePaths) && (
 <p className="mt-1 text-emerald-300/70 text-xs">
 Certificates marked &ldquo;Submitted &mdash; pending verification&rdquo; are still under registry/admin review, but won&rsquo;t block activation.
 </p>
 )}
 </div>
 </div>
 )
 }
 if (blockers.length > 0) {
 return (
 <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
 <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
 <div className="text-sm text-red-300">
 <p className="font-medium">Batch activation will be blocked until these are resolved:</p>
 <ul className="list-disc list-inside mt-1">
 {blockers.map((b, i) => <li key={i}>{b}</li>)}
 </ul>
 <Link
 href="/onboarding?step=3"
 className="inline-flex items-center gap-1 mt-1.5 text-teal-400 hover:text-teal-300"
 >
 Resume Onboarding
 <ArrowRight className="h-3 w-3" />
 </Link>
 </div>
 </div>
 )
 }
 return (
 <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
 <AlertTriangle className="h-4 w-4 text-amber-400" />
 <p className="text-sm text-amber-300">Complete all compliance items to enable batch activation for India market.</p>
 </div>
 )
 })()}
 </div>
 )}

 {/* Save All Settings */}
 {(activeSettingsTab === 'profile' || activeSettingsTab === 'compliance' || activeSettingsTab === 'eu-compliance') && (
 <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
 {message && (
 <p className={`text-sm ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
 {message.text}
 </p>
 )}
 {!message && isDirty && (
 <span className="text-amber-500 text-xs">Unsaved changes</span>
 )}
 <div className="ml-auto">
 <button
 type="submit"
 disabled={loading || factoryCodeError}
 title={factoryCodeError ? "Fix the invalid Factory Codes JSON before saving" : undefined}
 className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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
 </div>
 </div>
 )
}
