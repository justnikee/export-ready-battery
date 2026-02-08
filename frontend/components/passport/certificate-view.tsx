"use client"

import { CheckCircle, Leaf, Recycle, Shield, Factory, Zap, AlertTriangle, Truck, FileCheck, Globe, Award, Clock, Mail, MapPin, Download, FileText } from "lucide-react"
import { getBaseUrl } from "@/lib/api"
import clsx from "clsx"

type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface CertificateViewProps {
    passport: PassportViewData
}

interface PassportViewData {
    passport?: {
        uuid?: string
        serial_number?: string
        manufacture_date?: string
        created_at?: string
        status?: string
        ownership_history?: unknown[]
        repair_events?: unknown[]
        replacement_events?: unknown[]
        state_of_health?: number | null
        last_soh_update_timestamp?: string | null
        recycling_date?: string | null
        recycling_status?: string
        recycler_epr_id?: string
        current_owner_identifier?: string
    }
    specs?: {
        chemistry?: string
        capacity?: string
        voltage?: string
        weight?: string
        carbon_footprint?: string
        country_of_origin?: string
        manufacturer?: string
        manufacturer_address?: string
        manufacturer_email?: string
        material_composition?: {
            cobalt_pct?: number
            lithium_pct?: number
            nickel_pct?: number
            graphite_pct?: number
            manganese_pct?: number
            lead_pct?: number
        }
        certifications?: string[]
        hazardous_substances?: {
            declaration?: string
        }
        warranty_months?: number | null
        expected_lifetime_cycles?: number | null
        recycled_content_pct?: number | null
    }
    tenant?: {
        id?: string
        company_name?: string
        address?: string
        support_email?: string
        epr_registration_number?: string
        bis_r_number?: string
        bis_certificate_path?: string
        epr_certificate_path?: string
        pli_certificate_path?: string
        eu_authorized_representative_name?: string
        eu_authorized_representative_address?: string
        eu_contact_email?: string
    }
    batch_name?: string
    model_name?: string
    manufacturing_start_date?: string
    manufacturing_end_date?: string
    market_region?: MarketRegion
    domestic_value_add?: number
    cell_source?: string
    pli_compliant?: boolean
    hsn_code?: string
    bill_of_entry_no?: string
    country_of_origin?: string
    customs_date?: string
}

// Clean data row for light mode
function DataRow({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
    const display = (value === null || value === undefined || value === "") ? "Missing" : value
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-slate-500 text-sm">{label}</span>
            <span className={clsx("text-slate-900 font-medium text-right", mono && "font-mono")}>{display}</span>
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
    const manufacturerName = specs.manufacturer || tenant.company_name || ""
    const manufacturerAddress = specs.manufacturer_address || tenant.address || ""

    const manufacturerEmail = specs.manufacturer_email || tenant.support_email || ""

    const modelName = passport.model_name || ""
    const manufacturingStartDate = passport.manufacturing_start_date ? new Date(passport.manufacturing_start_date) : null
    const manufacturingEndDate = passport.manufacturing_end_date ? new Date(passport.manufacturing_end_date) : null



    const marketRegion = (passport.market_region || "GLOBAL") as MarketRegion
    const isIndia = marketRegion === "INDIA" || marketRegion === "GLOBAL"

    const domesticValueAdd = passport.domestic_value_add
    const hasDomesticValueAdd = domesticValueAdd !== null && domesticValueAdd !== undefined
    const cellSource = passport.cell_source || ""
    const isImported = cellSource === "IMPORTED"
    const cellSourceLabel = cellSource === "IMPORTED"
        ? "Imported Cells"
        : cellSource === "DOMESTIC"
            ? "Domestic Cells"
            : "Missing"
    const cellSourceClass = cellSource === "IMPORTED"
        ? "text-amber-600"
        : cellSource === "DOMESTIC"
            ? "text-emerald-600"
            : "text-slate-400"
    const pliCompliant = passport.pli_compliant || false
    const hsnCode = passport.hsn_code || ""
    const billOfEntryNo = passport.bill_of_entry_no || ""
    const countryOfOrigin = passport.country_of_origin || specs.country_of_origin || ""
    const customsDate = passport.customs_date ? new Date(passport.customs_date) : null

    const manufactureDate = passportData.manufacture_date ? new Date(passportData.manufacture_date) : null
    const createdAt = passportData.created_at ? new Date(passportData.created_at) : null

    // Generate BPAN ID - extract just the numeric suffix from serial
    const tenantCode = tenant.id?.slice(0, 3).toUpperCase() || 'EXP'
    const chemCode = specs.chemistry?.substring(0, 3).toUpperCase() || 'LFP'
    const bpanYear = createdAt ? createdAt.getFullYear() : null
    const serialNum = passportData.serial_number || ""
    // Extract just the last segment and pad to 4 digits (e.g., "043" -> "0043")
    const rawSuffix = serialNum.split('-').pop() || serialNum
    const serialSuffix = rawSuffix.replace(/\D/g, '').padStart(4, '0').slice(-4)
    const bpan = isIndia && bpanYear && serialNum
        ? `IN-${tenantCode}-${chemCode}-${bpanYear}-${serialSuffix}`
        : (serialNum || "Missing")

    const materials = specs.material_composition || null
    const hasMaterials = materials && (materials.cobalt_pct || materials.lithium_pct || materials.nickel_pct || materials.graphite_pct || materials.manganese_pct || materials.lead_pct)
    const cobaltPct = materials?.cobalt_pct ?? 0
    const lithiumPct = materials?.lithium_pct ?? 0
    const nickelPct = materials?.nickel_pct ?? 0
    const graphitePct = materials?.graphite_pct ?? 0
    const manganesePct = materials?.manganese_pct ?? 0
    const leadPct = materials?.lead_pct ?? 0

    const certifications = specs.certifications || []
    const warrantyMonths = specs.warranty_months ?? null
    const expectedLifetimeCycles = specs.expected_lifetime_cycles ?? null
    const recycledContentPct = specs.recycled_content_pct ?? null
    const hazardousDeclaration = specs.hazardous_substances?.declaration || null
    const euRepresentativeName = tenant.eu_authorized_representative_name || ""
    const euRepresentativeAddress = tenant.eu_authorized_representative_address || ""
    const euRepresentativeEmail = tenant.eu_contact_email || ""
    const showEURepresentative = marketRegion === "EU" || marketRegion === "GLOBAL"

    const warrantyLabel = (warrantyMonths === null || warrantyMonths === undefined)
        ? null
        : `${warrantyMonths} months`
    const expectedLifetimeLabel = (expectedLifetimeCycles === null || expectedLifetimeCycles === undefined)
        ? null
        : `${expectedLifetimeCycles.toLocaleString()} cycles`
    const recycledContentLabel = (recycledContentPct === null || recycledContentPct === undefined)
        ? null
        : `${recycledContentPct}%`
    const hasRecycledContent = recycledContentPct !== null && recycledContentPct !== undefined

    const ownershipHistory = Array.isArray(passportData.ownership_history) ? passportData.ownership_history : null
    const repairEvents = Array.isArray(passportData.repair_events) ? passportData.repair_events : null
    const replacementEvents = Array.isArray(passportData.replacement_events) ? passportData.replacement_events : null
    const ownershipCount = ownershipHistory ? ownershipHistory.length : null
    const repairCount = repairEvents ? repairEvents.length : null
    const replacementCount = replacementEvents ? replacementEvents.length : null
    const stateOfHealth = passportData.state_of_health ?? null
    const stateOfHealthLabel = (stateOfHealth === null || stateOfHealth === undefined) ? null : `${stateOfHealth}%`
    const lastSohUpdate = passportData.last_soh_update_timestamp ? new Date(passportData.last_soh_update_timestamp) : null
    const lastSohUpdateLabel = lastSohUpdate ? lastSohUpdate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null
    const recyclingDate = passportData.recycling_date ? new Date(passportData.recycling_date) : null

    // EPR (no fallback)
    const eprNumber = tenant.epr_registration_number || ""

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
                    Regulatory Declaration • Static Snapshot
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
                            {modelName && (
                                <p className="text-slate-500 font-medium text-sm mb-1">Model: {modelName}</p>
                            )}
                            <p className="text-slate-600 flex items-center gap-2 mt-1">
                                <Factory className="w-4 h-4 text-slate-400" />
                                {manufacturerName || "Missing"}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={status} />
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Snapshot: {createdAt ? createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Missing"}
                        </span>
                    </div>
                </div>

                {/* Key identifiers - grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Serial Number</p>
                        <p className="text-slate-900 font-mono font-medium text-sm truncate">{passportData.serial_number || "Missing"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Manufactured</p>
                        <p className="text-slate-900 font-medium text-sm">
                            {manufactureDate ? manufactureDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Missing"}
                        </p>
                    </div>
                    {isIndia && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Cell Source</p>
                            <p className={clsx("font-medium text-sm", cellSourceClass)}>
                                {cellSourceLabel}
                            </p>
                        </div>
                    )}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Market</p>
                        <p className="text-slate-900 font-medium text-sm">{marketRegion}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 col-span-2 md:col-span-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Batch Production Window</p>
                        <p className="text-slate-900 font-medium text-sm">
                            {manufacturingStartDate ? manufacturingStartDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Begins..."}
                            {" — "}
                            {manufacturingEndDate ? manufacturingEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Ongoing"}
                        </p>
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

                {/* Material Composition */}
                {hasMaterials ? (
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-slate-600 text-sm mb-3 flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-slate-400" />
                            Critical Raw Materials
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {cobaltPct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{cobaltPct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Cobalt</p>
                                </div>
                            )}
                            {lithiumPct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{lithiumPct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Lithium</p>
                                </div>
                            )}
                            {nickelPct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{nickelPct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Nickel</p>
                                </div>
                            )}
                            {graphitePct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{graphitePct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Graphite</p>
                                </div>
                            )}
                            {manganesePct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{manganesePct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Manganese</p>
                                </div>
                            )}
                            {leadPct > 0 && (
                                <div className="bg-slate-50 rounded px-3 py-2 text-center border border-slate-100">
                                    <p className="text-slate-900 font-medium">{leadPct.toFixed(1)}%</p>
                                    <p className="text-slate-500 text-xs">Lead</p>
                                </div>
                            )}
                        </div>
                        {hasRecycledContent && (
                            <p className="text-slate-500 text-sm mt-3 flex items-center gap-1">
                                <Recycle className="w-3.5 h-3.5" />
                                {recycledContentPct}% recycled content
                            </p>
                        )}
                    </div>
                ) : (marketRegion === "EU" || marketRegion === "GLOBAL") ? (
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-slate-600 text-sm mb-3 flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-slate-400" />
                            Critical Raw Materials
                        </p>
                        <p className="text-slate-500 text-sm">Missing</p>
                    </div>
                ) : null}
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
                        <p className="text-slate-900 font-mono font-medium">{eprNumber || "Missing"}</p>
                    </div>

                    {/* DVA Progress */}
                    {isIndia && (
                        <div className="mb-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-600 text-sm">Domestic Value Add</span>
                                <span className={clsx(
                                    "font-semibold",
                                    hasDomesticValueAdd
                                        ? (domesticValueAdd >= 50 ? "text-emerald-600" : "text-amber-600")
                                        : "text-slate-400"
                                )}>
                                    {hasDomesticValueAdd ? `${domesticValueAdd.toFixed(1)}%` : "Missing"}
                                </span>
                            </div>
                            {hasDomesticValueAdd ? (
                                <>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full transition-all",
                                                domesticValueAdd >= 50 ? "bg-emerald-500" : "bg-amber-500"
                                            )}
                                            style={{ width: `${Math.min(domesticValueAdd, 100)}%` }}
                                        />
                                    </div>
                                    {pliCompliant && domesticValueAdd >= 50 && (
                                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                                            <Award className="w-3 h-3" /> PLI Eligible
                                        </span>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-slate-400">Missing</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-0">
                        <DataRow label="BIS R-Number" value={tenant.bis_r_number} mono />
                        <DataRow label="Carbon Footprint" value={specs.carbon_footprint || null} />
                        <DataRow label="Hazardous Substances Declaration" value={hazardousDeclaration} />
                        <DataRow label="Warranty Period" value={warrantyLabel} />
                        <DataRow label="Expected Lifetime" value={expectedLifetimeLabel} />
                        <DataRow label="Recycled Content" value={recycledContentLabel} />
                    </div>

                    {/* Document Downloads */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Compliance Documents
                        </p>
                        <div className="space-y-2">
                            {tenant.bis_certificate_path && tenant.bis_certificate_path.trim() ? (
                                <a
                                    href={`${getBaseUrl()}${tenant.bis_certificate_path}`}
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
                                    href={`${getBaseUrl()}${tenant.epr_certificate_path}`}
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
                                    href={`${getBaseUrl()}${tenant.pli_certificate_path}`}
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
                    {isIndia && isImported && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-slate-400" /> Import Declaration
                            </p>
                            <div className="space-y-0">
                                <DataRow label="Bill of Entry" value={billOfEntryNo} mono />
                                <DataRow label="Country of Origin" value={countryOfOrigin} />
                                <DataRow label="HSN Code" value={hsnCode} mono />
                                <DataRow label="Customs Date" value={customsDate ? customsDate.toLocaleDateString('en-GB') : null} />
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
                            <p className="text-slate-900 font-medium">{manufacturerName || "Missing"}</p>
                        </div>

                        {/* Contact Section - Always visible */}
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 font-medium">Contact Information</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-slate-500 text-xs">Registered Office</p>
                                        <p className="text-slate-700 text-sm">{manufacturerAddress || "Missing"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-slate-500 text-xs">Consumer Care</p>
                                        {manufacturerEmail ? (
                                            <a href={`mailto:${manufacturerEmail}`} className="text-blue-600 text-sm hover:underline">
                                                {manufacturerEmail}
                                            </a>
                                        ) : (
                                            <span className="text-slate-700 text-sm">Missing</span>
                                        )}
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
                        {showEURepresentative && (
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">EU Authorized Representative</p>
                                <div className="space-y-0">
                                    <DataRow label="Name" value={euRepresentativeName} />
                                    <DataRow label="Address" value={euRepresentativeAddress} />
                                    <DataRow label="Email" value={euRepresentativeEmail} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lifecycle & Ownership */}
            <div className="p-6 md:p-8 border-b border-slate-200">
                <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    Lifecycle & Ownership
                </h3>

                <div className="space-y-0">
                    <DataRow label="Current Owner Identifier" value={passportData.current_owner_identifier} mono />
                    <DataRow label="State of Health" value={stateOfHealthLabel} />
                    <DataRow label="Last SoH Update" value={lastSohUpdateLabel} />
                    <DataRow label="Ownership Records" value={ownershipCount} />
                    <DataRow label="Repair Events" value={repairCount} />
                    <DataRow label="Replacement Events" value={replacementCount} />
                </div>

                {isIndia && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <DataRow label="Recycling Status" value={passportData.recycling_status} />
                        <DataRow label="Recycler EPR ID" value={passportData.recycler_epr_id} mono />
                        <DataRow label="Recycling Date" value={recyclingDate ? recyclingDate.toLocaleDateString('en-GB') : null} />
                    </div>
                )}
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
