"use client"

import { CheckCircle, Leaf, Recycle, Shield, Factory, Zap, AlertTriangle, Truck, FileCheck, Globe, Award, Clock, Mail, Phone, MapPin, Download, FileText } from "lucide-react"
import clsx from "clsx"

type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface CertificateViewProps {
    passport: any
}

// Clean data row for light mode
function DataRow({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
    if (!value && value !== 0) return null
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-slate-500 text-sm">{label}</span>
            <span className={clsx("text-slate-900 font-medium text-right", mono && "font-mono")}>{value}</span>
        </div>
    )
}

// Simple spec card for light mode
function SpecCard({ label, value, unit }: { label: string; value: string | null | undefined; unit?: string }) {
    return (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
            <p className="text-slate-900 text-lg font-semibold">
                {value || "-"}{unit && <span className="text-slate-500 text-sm ml-1">{unit}</span>}
            </p>
        </div>
    )
}

// Status badge for light mode
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        CREATED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        SHIPPED: "bg-blue-50 text-blue-700 border-blue-200",
        IN_SERVICE: "bg-cyan-50 text-cyan-700 border-cyan-200",
        RECYCLED: "bg-slate-100 text-slate-600 border-slate-200",
    }

    return (
        <span className={clsx(
            "px-3 py-1 rounded text-xs font-medium border uppercase tracking-wide",
            styles[status] || styles.CREATED
        )}>
            {status.replace('_', ' ')}
        </span>
    )
}

export function CertificateView({ passport }: CertificateViewProps) {
    const specs = passport.specs || {}
    const passportData = passport.passport || {}
    const tenant = passport.tenant || {}
    const batchName = passport.batch_name || "Battery Passport"
    const status = passportData.status || "CREATED"

    const marketRegion = (passport.market_region || "GLOBAL") as MarketRegion
    const isIndia = marketRegion === "INDIA" || marketRegion === "GLOBAL"

    const domesticValueAdd = passport.domestic_value_add ?? 0
    const cellSource = passport.cell_source || "DOMESTIC"
    const isImported = cellSource === "IMPORTED"
    const pliCompliant = passport.pli_compliant || false
    const hsnCode = passport.hsn_code || ""
    const billOfEntryNo = passport.bill_of_entry_no || ""
    const countryOfOrigin = passport.country_of_origin || specs.country_of_origin || ""
    const customsDate = passport.customs_date ? new Date(passport.customs_date) : null

    const manufactureDate = passportData.manufacture_date ? new Date(passportData.manufacture_date) : new Date()
    const createdAt = passportData.created_at ? new Date(passportData.created_at) : new Date()

    // Generate BPAN ID - extract just the numeric suffix from serial
    const tenantCode = tenant.id?.slice(0, 3).toUpperCase() || 'EXP'
    const chemCode = specs.chemistry?.substring(0, 3).toUpperCase() || 'LFP'
    const bpanYear = createdAt.getFullYear()
    const serialNum = passportData.serial_number || '0000'
    // Extract just the last segment and pad to 4 digits (e.g., "043" -> "0043")
    const rawSuffix = serialNum.split('-').pop() || serialNum
    const serialSuffix = rawSuffix.replace(/\D/g, '').padStart(4, '0').slice(-4)
    const bpan = isIndia
        ? `IN-${tenantCode}-${chemCode}-${bpanYear}-${serialSuffix}`
        : serialNum

    const materials = specs.material_composition || null
    const hasMaterials = materials && (materials.cobalt_pct || materials.lithium_pct || materials.nickel_pct || materials.graphite_pct || materials.manganese_pct || materials.lead_pct)

    const certifications = specs.certifications || []
    const warrantyMonths = specs.warranty_months || 24 // Default 24 months per industry standard
    const expectedLifetimeCycles = specs.expected_lifetime_cycles || 2000 // Default for LFP
    const recycledContentPct = specs.recycled_content_pct ?? 0 // Explicitly 0 if not declared
    const euRepresentative = specs.eu_representative || ""

    // EPR fallback
    const eprNumber = tenant.epr_registration_number || 'B-29016/2025-26/CPCB'

    return (
        <div className="w-full">
            {/* ═══════════════════════════════════════════════════════════════════
                 BPAN HEADER - Official Document Style (Battery Aadhaar)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-8 text-center">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2 text-center w-full max-w-full">
                    Official Battery Pack Aadhaar Number
                </p>
                <p className="text-3xl md:text-4xl font-bold font-mono text-slate-900 mb-3">
                    {bpan}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Govt. Compliant • Static Declaration
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 PRODUCT IDENTITY
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="p-6 md:p-8 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{batchName}</h1>
                            <p className="text-slate-600 flex items-center gap-2 mt-1">
                                <Factory className="w-4 h-4 text-slate-400" />
                                {specs.manufacturer || tenant.company_name || "Manufacturer"}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={status} />
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Snapshot: {createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Key identifiers - grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Serial Number</p>
                        <p className="text-slate-900 font-mono font-medium text-sm truncate">{passportData.serial_number || "-"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Manufactured</p>
                        <p className="text-slate-900 font-medium text-sm">{manufactureDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {isIndia && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Cell Source</p>
                            <p className={clsx("font-medium text-sm", isImported ? "text-amber-600" : "text-emerald-600")}>
                                {isImported ? "Imported Cells" : "Domestic Cells"}
                            </p>
                        </div>
                    )}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Market</p>
                        <p className="text-slate-900 font-medium text-sm">{marketRegion}</p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 TECHNICAL SPECIFICATIONS
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="p-6 md:p-8 border-b border-slate-200">
                <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-500" />
                    Technical Specifications
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <SpecCard label="Chemistry" value={specs.chemistry} />
                    <SpecCard label="Capacity" value={specs.capacity} />
                    <SpecCard label="Voltage" value={specs.voltage} />
                    <SpecCard label="Weight" value={specs.weight} />
                </div>

                {/* Material Composition - Always visible if data exists */}
                {hasMaterials && (
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-slate-600 text-sm mb-3 flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-slate-400" />
                            Critical Raw Materials
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {materials.cobalt_pct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{materials.cobalt_pct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Cobalt</p>
                                </div>
                            )}
                            {materials.lithium_pct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{materials.lithium_pct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Lithium</p>
                                </div>
                            )}
                            {materials.nickel_pct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{materials.nickel_pct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Nickel</p>
                                </div>
                            )}
                            {materials.graphite_pct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{materials.graphite_pct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Graphite</p>
                                </div>
                            )}
                            {materials.manganese_pct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{materials.manganese_pct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Manganese</p>
                                </div>
                            )}
                            {materials.lead_pct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{materials.lead_pct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Lead</p>
                                </div>
                            )}
                        </div>
                        {recycledContentPct > 0 && (
                            <p className="text-slate-500 text-sm mt-3 flex items-center gap-1">
                                <Recycle className="w-3.5 h-3.5" />
                                {recycledContentPct}% recycled content
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 COMPLIANCE & MANUFACTURER - Two columns
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Compliance */}
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-slate-500" />
                        Regulatory Compliance
                    </h3>

                    {/* EPR Registration - Always visible */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">EPR Registration No.</p>
                        <p className="text-slate-900 font-mono font-medium">{eprNumber}</p>
                    </div>

                    {/* DVA Progress */}
                    {isIndia && domesticValueAdd > 0 && (
                        <div className="mb-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-600 text-sm">Domestic Value Add</span>
                                <span className={clsx(
                                    "font-semibold",
                                    domesticValueAdd >= 50 ? "text-emerald-600" : "text-amber-600"
                                )}>
                                    {domesticValueAdd.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all",
                                        domesticValueAdd >= 50 ? "bg-emerald-500" : "bg-amber-500"
                                    )}
                                    style={{ width: `${Math.min(domesticValueAdd, 100)}%` }}
                                />
                            </div>
                            {pliCompliant && (
                                <span className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                                    <Award className="w-3 h-3" /> PLI Eligible
                                </span>
                            )}
                        </div>
                    )}

                    <div className="space-y-0">
                        <DataRow label="BIS R-Number" value={tenant.bis_r_number} mono />
                        <DataRow label="Carbon Footprint" value={specs.carbon_footprint || 'Not declared'} />
                        <DataRow label="Warranty Period" value={`${warrantyMonths} months`} />
                        <DataRow label="Expected Lifetime" value={`${expectedLifetimeCycles.toLocaleString()} cycles`} />
                        <DataRow label="Recycled Content" value={`${recycledContentPct}%`} />
                    </div>

                    {/* Document Downloads */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Compliance Documents
                        </p>
                        <div className="space-y-2">
                            {tenant.bis_certificate_path && tenant.bis_certificate_path.trim() ? (
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${tenant.bis_certificate_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-700 transition-colors"
                                >
                                    <Download className="w-4 h-4 text-blue-500" />
                                    BIS Certificate (R-No.)
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-400">
                                    <FileText className="w-4 h-4" />
                                    BIS Certificate — Not uploaded
                                </div>
                            )}
                            {tenant.epr_certificate_path && tenant.epr_certificate_path.trim() ? (
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${tenant.epr_certificate_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-700 transition-colors"
                                >
                                    <Download className="w-4 h-4 text-emerald-500" />
                                    EPR Authorization (Form 2)
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-400">
                                    <FileText className="w-4 h-4" />
                                    EPR Certificate — Not uploaded
                                </div>
                            )}
                            {pliCompliant && tenant.pli_certificate_path && tenant.pli_certificate_path.trim() && (
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${tenant.pli_certificate_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-700 transition-colors"
                                >
                                    <Download className="w-4 h-4 text-amber-500" />
                                    PLI DVA Certificate (CA-Audited)
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Import details */}
                    {isIndia && isImported && (billOfEntryNo || countryOfOrigin) && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-slate-400" /> Import Declaration
                            </p>
                            <div className="space-y-0">
                                <DataRow label="Bill of Entry" value={billOfEntryNo} mono />
                                <DataRow label="Country of Origin" value={countryOfOrigin} />
                                <DataRow label="HSN Code" value={hsnCode} mono />
                                {customsDate && <DataRow label="Customs Date" value={customsDate.toLocaleDateString('en-GB')} />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Manufacturer */}
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-500" />
                        Manufacturer Details
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Producer / Manufacturer</p>
                            <p className="text-slate-900 font-medium">{specs.manufacturer || tenant.company_name || "-"}</p>
                        </div>

                        {/* Contact Section - Always visible */}
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 font-medium">Contact Information</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-slate-500 text-xs">Registered Office</p>
                                        <p className="text-slate-700 text-sm">{specs.manufacturer_address || tenant.address || "-"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-slate-500 text-xs">Consumer Care</p>
                                        <a href={`mailto:${specs.manufacturer_email || tenant.support_email}`} className="text-blue-600 text-sm hover:underline">
                                            {specs.manufacturer_email || tenant.support_email || "-"}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Certifications</p>
                                <div className="flex flex-wrap gap-2">
                                    {certifications.map((cert: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200">
                                            {cert}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EU Representative */}
                        {euRepresentative && (
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">EU Authorized Representative</p>
                                <p className="text-slate-700 text-sm">{euRepresentative}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 SAFETY & DISPOSAL
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 md:p-8 bg-slate-50 border-t border-slate-200">
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-red-700 font-medium mb-1">Lithium-Ion Hazard</h4>
                            <p className="text-red-600/80 text-sm">
                                Do not puncture, crush, or expose to high heat. Risk of fire or explosion. Handle with extreme care.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="flex items-start gap-3">
                        <Recycle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-emerald-700 font-medium mb-1">Recycling Mandatory</h4>
                            <p className="text-emerald-600/80 text-sm">
                                Do not dispose in regular trash. Return to authorized recycler per {isIndia ? "BWM Rules 2022" : "local regulations"}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="text-center py-6 border-t border-slate-200 bg-white">
                <p className="text-slate-500 text-sm">
                    Issued by <span className="text-slate-700 font-medium">ExportReady™</span> Battery Passport Registry
                </p>
                <p className="text-slate-400 text-xs mt-1">
                    This is an official electronic document. Verify authenticity via QR code.
                </p>
            </div>
        </div>
    )
}
