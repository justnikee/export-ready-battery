"use client"

import {
    Battery, Zap, Weight, FlaskConical,
    Calendar, Shield, Barcode, Globe,
    AlertTriangle, Recycle, FileText, Download,
    Truck, MapPin, Mail
} from "lucide-react"
import { createTranslator, type Locale } from "@/lib/i18n/i18n"

// ─── helpers ─────────────────────────────────────────────────────────────────

function getBaseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
}

function DataRow({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
    return (
        <div className="flex items-baseline justify-between py-2 border-b border-slate-50 last:border-0 gap-4">
            <span className="text-slate-500 text-sm whitespace-nowrap">{label}</span>
            <span className={`text-slate-900 text-sm text-right ${mono ? 'font-mono' : ''}`}>
                {value ?? <span className="text-slate-300">—</span>}
            </span>
        </div>
    )
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface PassportViewData {
    passport: {
        uuid: string
        serial_number?: string
        manufacture_date?: string
        created_at?: string
        status?: string
        state_of_health?: number | null
        last_soh_update_timestamp?: string | null
        ownership_history?: Array<{ timestamp: string; from_owner: string; to_owner: string }> | null
        repair_events?: Array<{ timestamp: string; description: string }> | null
        replacement_events?: Array<{ timestamp: string; description: string }> | null
        recycling_date?: string | null
        recycling_status?: string | null
        recycler_epr_id?: string | null
        current_owner_identifier?: string | null
    }
    specs: {
        chemistry?: string
        // Field names match backend PublicSpecsView JSON keys exactly
        capacity?: string
        voltage?: string
        weight?: string
        carbon_footprint?: string
        expected_lifetime_cycles?: number | null
        warranty_months?: number | null
        hazardous_substances?: {
            declaration?: string
            lead_present?: boolean
            mercury_present?: boolean
            cadmium_present?: boolean
            exemptions?: string
        } | null
        material_composition?: {
            cobalt_pct?: number
            lithium_pct?: number
            nickel_pct?: number
            graphite_pct?: number
            manganese_pct?: number
            lead_pct?: number
            recycled_cobalt_pct?: number
            recycled_lithium_pct?: number
            recycled_nickel_pct?: number
            recycled_lead_pct?: number
        } | null
    } | null
    tenant: {
        company_name?: string
        manufacturer_name?: string
        manufacturer_address?: string
        manufacturer_email?: string
        epr_registration_number?: string
        bis_r_number?: string
        bis_certificate_path?: string
        epr_certificate_path?: string
        pli_certificate_path?: string
        certifications?: string[]
        eu_representative_name?: string
        eu_representative_address?: string
        eu_representative_email?: string
    } | null
    batch_name?: string
    model_name?: string
    manufacturing_start_date?: string
    manufacturing_end_date?: string
    market_region?: string
    domestic_value_add?: number | null
    cell_source?: string
    pli_compliant?: boolean
    hsn_code?: string
    bill_of_entry_no?: string
    country_of_origin?: string
    customs_date?: string
    product_type?: string
}

interface CertificateViewProps {
    passport: PassportViewData
    locale?: Locale
}

// ─── component ───────────────────────────────────────────────────────────────

export function CertificateView({ passport: passportData, locale = 'en' }: CertificateViewProps) {
    const t = createTranslator(locale)

    const passport = passportData.passport
    const specs = passportData.specs
    const tenant = passportData.tenant || {} as NonNullable<PassportViewData['tenant']>

    // Derived values
    const bpan = passport.serial_number || t("label_missing")
    const model = passportData.model_name || tenant.company_name || t("label_missing")
    const serialNumber = passport.serial_number || t("label_missing")
    const chemistry = specs?.chemistry || null
    const capacityAh = specs?.capacity || null
    const voltage = specs?.voltage || null
    const weightKg = specs?.weight || null
    const cycleLife = specs?.expected_lifetime_cycles || null
    const warrantyMonths = specs?.warranty_months || null
    const hazardousSubs = specs?.hazardous_substances?.declaration || null
    const carbonFootprint = specs?.carbon_footprint || null
    const eprNumber = tenant.epr_registration_number || null
    const bisRNumber = tenant.bis_r_number || null
    const certifications = tenant.certifications || []
    const cellSource = passportData.cell_source || null
    const marketRegion = passportData.market_region || null
    const dvaPercent = passportData.domestic_value_add
    const pliCompliant = passportData.pli_compliant
    const hsnCode = passportData.hsn_code || null
    const billOfEntryNo = passportData.bill_of_entry_no || null
    const countryOfOrigin = passportData.country_of_origin || null
    const customsDate = passportData.customs_date ? new Date(passportData.customs_date) : null
    const manufactureDate = passport.manufacture_date ? new Date(passport.manufacture_date) : null
    const startDate = passportData.manufacturing_start_date ? new Date(passportData.manufacturing_start_date) : null
    const endDate = passportData.manufacturing_end_date ? new Date(passportData.manufacturing_end_date) : null
    const manufacturerName = tenant.manufacturer_name || tenant.company_name || null
    const manufacturerAddress = tenant.manufacturer_address || null
    const manufacturerEmail = tenant.manufacturer_email || null
    const recyclingDate = passport.recycling_date ? new Date(passport.recycling_date) : null

    // EU Representative
    const euRepresentativeName = tenant.eu_representative_name || null
    const euRepresentativeAddress = tenant.eu_representative_address || null
    const euRepresentativeEmail = tenant.eu_representative_email || null
    const showEURepresentative = euRepresentativeName || euRepresentativeAddress || euRepresentativeEmail

    // Critical raw materials
    const crm = specs?.material_composition

    // Status with static Tailwind class mappings
    const status = passport.status || "created"
    const statusConfig: Record<string, { label: string; color: string }> = {
        created: { label: t("status_created"), color: "slate" },
        active: { label: t("status_active"), color: "emerald" },
        recalled: { label: t("status_recalled"), color: "amber" },
        recycled: { label: t("status_recycled"), color: "purple" },
        eol: { label: t("status_eol"), color: "red" },
    }
    
    // Static Tailwind class map to avoid dynamic string interpolation
    const statusStyleMap: Record<string, { container: string; dot: string }> = {
        slate: { container: "bg-slate-500/20 text-slate-400 border-slate-500/30", dot: "bg-slate-400" },
        emerald: { container: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
        amber: { container: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
        purple: { container: "bg-purple-500/20 text-purple-400 border-purple-500/30", dot: "bg-purple-400" },
        red: { container: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
    }
    
    const currentStatus = statusConfig[status] || statusConfig.created
    const currentStatusStyles = statusStyleMap[currentStatus.color] || statusStyleMap.slate

    // Market
    const isIndia = marketRegion === "india"
    const isImported = cellSource === "imported"
    const productType = passportData.product_type || 'BATTERY'
    const isBattery = productType.toUpperCase() === 'BATTERY'

    // SoH
    const soh = passport.state_of_health
    const stateOfHealthLabel = soh != null ? `${soh}%` : null
    const lastSohUpdate = passport.last_soh_update_timestamp ? new Date(passport.last_soh_update_timestamp) : null
    const lastSohUpdateLabel = lastSohUpdate ? lastSohUpdate.toLocaleDateString('en-GB') : null

    // Ownership counts
    const ownershipCount = passport.ownership_history?.length ?? 0
    const repairCount = passport.repair_events?.length ?? 0
    const replacementCount = passport.replacement_events?.length ?? 0

    // Cell-source label
    const cellSourceLabel = cellSource
        ? cellSource === "imported" ? t("cell_source_imported") : t("cell_source_domestic")
        : null

    return (
        <div className="divide-y divide-slate-200">
            {/* ═══════════════════════════════════════════════════════════════════
                 BPAN HEADER
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
                            {t("bpan_label")}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight">{bpan}</h1>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${currentStatusStyles.container} border`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${currentStatusStyles.dot}`} />
                        {currentStatus.label}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-emerald-400 text-xs font-medium">
                        {isBattery ? '🔋' : '📦'} {productType}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Barcode className="w-4 h-4" /> {model}
                    </span>
                    {chemistry && (
                        <span className="flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4" /> {chemistry}
                        </span>
                    )}
                    {capacityAh && (
                        <span className="flex items-center gap-1.5">
                            <Battery className="w-4 h-4" /> {capacityAh}
                        </span>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-slate-500 text-xs">{t("bpan_badge")}</p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 PRODUCT IDENTITY + SPECS
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-slate-500" />
                        {t("section_product")}
                    </h3>

                    <div className="space-y-0">
                        <DataRow label={t("label_model")} value={model} />
                        <DataRow label={t("label_serial")} value={serialNumber} mono />
                        <DataRow label={t("label_manufactured")} value={manufactureDate ? manufactureDate.toLocaleDateString('en-GB') : null} />
                        <DataRow label={t("label_cell_source")} value={cellSourceLabel} />
                        <DataRow label={t("label_market")} value={marketRegion || null} />
                    </div>

                    {/* Batch Window */}
                    {startDate && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-2">{t("label_batch_window")}</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700 font-mono text-xs">
                                    {startDate.toLocaleDateString('en-GB')}
                                </span>
                                <span className="text-slate-300">→</span>
                                <span className="text-slate-700 font-mono text-xs">
                                    {endDate ? endDate.toLocaleDateString('en-GB') : t("label_ongoing")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Technical Specifications */}
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-500" />
                        {t("section_specs")}
                    </h3>

                    <div className="space-y-0">
                        <DataRow label={t("label_chemistry")} value={chemistry} />
                        <DataRow label={t("label_capacity")} value={capacityAh} />
                        <DataRow label={t("label_voltage")} value={voltage} />
                        <DataRow label={t("label_weight")} value={weightKg} />
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                 CRITICAL RAW MATERIALS
            ═══════════════════════════════════════════════════════════════════ */}
            {crm && (
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-slate-500" />
                        {t("section_materials")}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { key: "label_cobalt", pct: crm.cobalt_pct, recycled: crm.recycled_cobalt_pct },
                            { key: "label_lithium", pct: crm.lithium_pct, recycled: crm.recycled_lithium_pct },
                            { key: "label_nickel", pct: crm.nickel_pct, recycled: crm.recycled_nickel_pct },
                            { key: "label_graphite", pct: crm.graphite_pct },
                            { key: "label_manganese", pct: crm.manganese_pct },
                            { key: "label_lead", pct: crm.lead_pct, recycled: crm.recycled_lead_pct },
                        ].filter(m => m.pct != null && m.pct > 0).map(m => (
                            <div key={m.key} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <p className="text-slate-500 text-xs mb-1">{t(m.key)}</p>
                                <p className="text-slate-900 font-semibold">{m.pct}%</p>
                                {m.recycled != null && m.recycled > 0 && (
                                    <p className="text-emerald-600 text-xs mt-0.5">
                                        ♻ {m.recycled}% {t("label_recycled_content")}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                 REGULATORY COMPLIANCE
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-500" />
                        {t("section_compliance")}
                    </h3>

                    <div className="space-y-0">
                        {isIndia && <DataRow label={t("label_epr")} value={eprNumber} mono />}
                        {isIndia && dvaPercent != null && <DataRow label={t("label_dva")} value={`${dvaPercent}%`} />}
                        {isIndia && <DataRow label={t("label_pli")} value={pliCompliant ? "✅ Yes" : "No"} />}
                        {isIndia && <DataRow label={t("label_bis")} value={bisRNumber} mono />}
                        <DataRow label={t("label_carbon_footprint")} value={carbonFootprint} />
                        <DataRow label={t("label_hazardous")} value={hazardousSubs} />
                        <DataRow label={t("label_warranty")} value={warrantyMonths ? t("label_months", { count: warrantyMonths }) : null} />
                        <DataRow label={t("label_lifetime")} value={cycleLife ? t("label_cycles", { count: cycleLife }) : null} />
                    </div>

                    {/* Document Downloads */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> {t("section_documents")}
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
                                    {t("doc_bis")}
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-400">
                                    <FileText className="w-4 h-4" />
                                    {t("doc_bis_missing")}
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
                                    {t("doc_epr")}
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-400">
                                    <FileText className="w-4 h-4" />
                                    {t("doc_epr_missing")}
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
                                    {t("doc_pli")}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Import details */}
                    {isIndia && isImported && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-slate-400" /> {t("section_import")}
                            </p>
                            <div className="space-y-0">
                                <DataRow label={t("label_bill_of_entry")} value={billOfEntryNo} mono />
                                <DataRow label={t("label_country_origin")} value={countryOfOrigin} />
                                <DataRow label={t("label_hsn")} value={hsnCode} mono />
                                <DataRow label={t("label_customs_date")} value={customsDate ? customsDate.toLocaleDateString('en-GB') : null} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Manufacturer */}
                <div className="p-6 md:p-8">
                    <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-500" />
                        {t("section_manufacturer")}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{t("label_producer")}</p>
                            <p className="text-slate-900 font-medium">{manufacturerName || t("label_missing")}</p>
                        </div>

                        {/* Contact Section - Always visible */}
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-slate-600 text-xs uppercase tracking-wide mb-3 font-medium">{t("label_contact")}</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-slate-500 text-xs">{t("label_office")}</p>
                                        <p className="text-slate-700 text-sm">{manufacturerAddress || t("label_missing")}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-slate-500 text-xs">{t("label_consumer_care")}</p>
                                        {manufacturerEmail ? (
                                            <a href={`mailto:${manufacturerEmail}`} className="text-blue-600 text-sm hover:underline">
                                                {manufacturerEmail}
                                            </a>
                                        ) : (
                                            <span className="text-slate-700 text-sm">{t("label_missing")}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Certifications */}
                        {certifications.length > 0 && (
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">{t("label_certifications")}</p>
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
                                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">{t("label_eu_rep")}</p>
                                <div className="space-y-0">
                                    <DataRow label={t("label_name")} value={euRepresentativeName} />
                                    <DataRow label={t("label_address")} value={euRepresentativeAddress} />
                                    <DataRow label={t("label_email")} value={euRepresentativeEmail} />
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
                    {t("section_lifecycle")}
                </h3>

                <div className="space-y-0">
                    <DataRow label={t("label_current_owner")} value={passport.current_owner_identifier} mono />
                    {isBattery && <DataRow label={t("label_soh")} value={stateOfHealthLabel} />}
                    {isBattery && <DataRow label={t("label_last_soh")} value={lastSohUpdateLabel} />}
                    <DataRow label={t("label_ownership_records")} value={ownershipCount} />
                    <DataRow label={t("label_repair_events")} value={repairCount} />
                    <DataRow label={t("label_replacement_events")} value={replacementCount} />
                </div>

                {isIndia && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <DataRow label={t("label_recycling_status")} value={passport.recycling_status} />
                        <DataRow label={t("label_recycler_epr")} value={passport.recycler_epr_id} mono />
                        <DataRow label={t("label_recycling_date")} value={recyclingDate ? recyclingDate.toLocaleDateString('en-GB') : null} />
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
                            <h4 className="text-red-700 font-medium mb-1">{t("safety_title")}</h4>
                            <p className="text-red-600/80 text-sm">
                                {t("safety_text")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="flex items-start gap-3">
                        <Recycle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-emerald-700 font-medium mb-1">{t("recycling_title")}</h4>
                            <p className="text-emerald-600/80 text-sm">
                                {isIndia ? t("recycling_text_india") : t("recycling_text_global")}
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
                    {t("footer_issued")} <span className="text-slate-700 font-medium">ExportReady™</span> {t("footer_registry")}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                    {t("footer_verify")}
                </p>
            </div>
        </div>
    )
}
