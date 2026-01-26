"use client"

import { Battery, Calendar, CheckCircle, Leaf, MapPin, Recycle, Shield, Factory, Atom, Zap, ThermometerSun, Weight, Activity, Info, AlertTriangle, Truck, FileCheck, ExternalLink, QrCode, Globe } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"
import { motion } from "framer-motion"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface CertificateViewProps {
    passport: any
}

// Material chip for light mode
function MaterialChip({ element, value }: { element: string; value: number }) {
    const colors: Record<string, string> = {
        cobalt: "bg-blue-50 text-blue-700 border-blue-200",
        lithium: "bg-purple-50 text-purple-700 border-purple-200",
        nickel: "bg-teal-50 text-teal-700 border-teal-200",
        lead: "bg-slate-50 text-slate-700 border-slate-200",
    }

    return (
        <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border", colors[element] || colors.lead)}>
            <Atom className="h-3.5 w-3.5" />
            {element.charAt(0).toUpperCase() + element.slice(1)}: {value}%
        </span>
    )
}

export function CertificateView({ passport }: CertificateViewProps) {
    const specs = passport.specs || {}
    const passportData = passport.passport || {}
    const tenant = passport.tenant || {}
    const batchName = passport.batch_name || "Battery Passport"
    const status = passportData.status || "ACTIVE"

    const marketRegion = (passport.market_region || "GLOBAL") as MarketRegion
    const isIndia = marketRegion === "INDIA"
    const isEU = marketRegion === "EU"

    const domesticValueAdd = passport.domestic_value_add !== undefined ? passport.domestic_value_add : 65
    const cellSource = passport.cell_source || "DOMESTIC"
    const isImported = cellSource === "IMPORTED"

    // BPAN Logic: IN + [Manufacturer Code - inferred] + [chemistry] + [YearMonth] + [Serial Suffix]
    // Mocking Manufacturer Code as "EXP" for ExportReady
    const manufactureDate = passportData.manufacture_date ? new Date(passportData.manufacture_date) : new Date()
    const yearMonth = `${manufactureDate.getFullYear()}${String(manufactureDate.getMonth() + 1).padStart(2, '0')}`
    const chemCode = specs.chemistry ? specs.chemistry.substring(0, 3).toUpperCase() : "BAT"
    // Extract last 4 of serial or uuid for unique part
    const serialSuffix = passportData.serial_number ? passportData.serial_number.split('-').pop() : "0000"
    const materials = passport.materials || { cobalt: 12, lithium: 8, nickel: 15, lead: 0.1 }

    const bpanID = `IN-EXP-${chemCode}-${yearMonth}-${serialSuffix}`

    return (
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-none md:rounded-xl shadow-2xl overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
            {/* ═══════════════════════════════════════════════════════════════════
                 GOVERNMENT HEADER (Battery Aadhaar Banner)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-slate-800/50 border-b border-white/5 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden print:bg-slate-50 print:border-slate-200">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 print:hidden" />

                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    {/* Official Shield Icon */}
                    <div className="h-16 w-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border border-white/10 flex items-center justify-center p-2 shadow-lg print:bg-white print:border-slate-200 print:shadow-none">
                        <Shield className="h-8 w-8 text-emerald-400 print:text-slate-900" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight print:text-slate-900">Digital Battery Passport</h1>
                            {isIndia && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded border border-orange-500/30 font-bold print:bg-orange-100 print:text-orange-700 print:border-orange-200">INDIA BWM 2022</span>}
                            {isEU && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/30 font-bold print:bg-blue-100 print:text-blue-700 print:border-blue-200">EU REG 2023/1542</span>}
                        </div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wide flex items-center gap-2 print:text-slate-500">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 print:text-slate-500" />
                            Official Compliance Document
                        </p>
                    </div>
                </div>

                {/* BPAN Badge */}
                <div className="w-full md:w-auto text-center md:text-right bg-slate-950/50 p-4 rounded-xl border border-white/10 shadow-inner print:bg-white print:border-slate-200 print:shadow-none">
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1 print:text-slate-400">Battery Identity Number</p>
                    <code className="text-xl md:text-2xl font-mono font-bold text-emerald-400 tracking-wider drop-shadow-sm print:text-slate-900">
                        {bpanID}
                    </code>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* ═══════════════════════════════════════════════════════════════════
                     MAIN IDENTITY & STATUS
                ═══════════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold text-white print:text-slate-900">{batchName}</h2>
                        </div>
                        <div className="mb-6">
                            <p className="text-lg text-slate-400 flex items-center gap-2 print:text-slate-600">
                                <Factory className="h-4 w-4" />
                                {specs.manufacturer || "Battery Manufacturer"}
                            </p>
                            {/* EPR Number - Mandatory */}
                            {tenant.epr_registration_number && (
                                <p className="text-sm text-emerald-400/80 font-mono mt-1 ml-6 print:text-slate-600">
                                    EPR Reg. No: {tenant.epr_registration_number}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-colors print:bg-slate-50 print:border-slate-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Serial Number</p>
                                <p className="font-mono font-medium text-white group-hover:text-blue-200 transition-colors print:text-slate-900">{passportData.serial_number}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-colors print:bg-slate-50 print:border-slate-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Manufactured</p>
                                <p className="font-mono font-medium text-white group-hover:text-blue-200 transition-colors print:text-slate-900">
                                    {passportData.manufacture_date ? new Date(passportData.manufacture_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Status */}
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl shadow-sm print:bg-white print:border-slate-200">
                            <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-slate-400" />
                                <span className="text-slate-300 font-medium print:text-slate-600">Current Status</span>
                            </div>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-sm font-bold border",
                                status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] print:bg-emerald-50 print:text-emerald-700 print:border-emerald-200 print:shadow-none" :
                                    status === "RECYCLED" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                                        "bg-slate-700/50 text-slate-300 border-slate-600"
                            )}>
                                {status.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Snapshot Date Badge */}
                        <div className="flex items-center gap-3 p-3 bg-blue-500/10 text-blue-300 text-sm rounded-xl border border-blue-500/20 print:bg-blue-50 print:text-blue-700 print:border-blue-100">
                            <Info className="h-5 w-5 shrink-0 text-blue-400 print:text-blue-600" />
                            <span className="leading-snug">
                                <strong className="text-blue-200 print:text-blue-800">Data Snapshot:</strong> Verified as of {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString() : "Issue Date"}.
                                Static declaration.
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent print:bg-slate-200" />

                {/* ═══════════════════════════════════════════════════════════════════
                     TECHNICAL SPECS + MATERIALS
                ═══════════════════════════════════════════════════════════════════ */}
                <div>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 print:text-slate-900">
                        <Zap className="h-5 w-5 text-amber-400 print:text-slate-500" />
                        Technical Specifications & Materials
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Chemistry", value: specs.chemistry },
                            { label: "Capacity", value: specs.capacity },
                            { label: "Voltage", value: specs.voltage },
                            { label: "Weight", value: specs.weight },
                        ].map((item, i) => (
                            <div key={i} className="p-4 bg-slate-950/30 border border-white/5 rounded-xl hover:bg-white/5 transition-colors print:bg-white print:border-slate-200">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                                <p className="font-bold text-slate-200 text-lg print:text-slate-900">{item.value || "-"}</p>
                            </div>
                        ))}
                    </div>

                    {/* CRITICAL RAW MATERIALS - GREEN PREMIUM (Visible for ALL) */}
                    {materials && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 print:bg-white print:border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium text-slate-300 print:text-slate-700">Critical Raw Materials Declarations (Recoverable)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {materials.cobalt && <MaterialChip element="cobalt" value={materials.cobalt} />}
                                {materials.lithium && <MaterialChip element="lithium" value={materials.lithium} />}
                                {materials.nickel && <MaterialChip element="nickel" value={materials.nickel} />}
                                {materials.lead && <MaterialChip element="lead" value={materials.lead} />}
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                     COMPLIANCE & CONTACT
                ═══════════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Compliance Column */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 print:text-slate-900">
                            <FileCheck className="h-5 w-5 text-blue-400 print:text-slate-500" />
                            Regulatory Compliance
                        </h3>
                        <div className="bg-slate-800/20 rounded-xl p-5 border border-white/5 space-y-5 print:bg-white print:border-slate-200">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400 font-medium text-sm print:text-slate-600">Domestic Value Add</span>
                                    <span className={clsx("font-bold text-lg", domesticValueAdd >= 50 ? "text-emerald-400 print:text-emerald-700" : "text-orange-400 print:text-orange-700")}>
                                        {domesticValueAdd}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 print:bg-slate-100">
                                    <div className={clsx("h-full rounded-full shadow-[0_0_10px_currentColor] print:shadow-none", domesticValueAdd >= 50 ? "bg-emerald-500 text-emerald-500" : "bg-orange-500 text-orange-500")} style={{ width: `${domesticValueAdd}%` }} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 grid grid-cols-1 gap-3 print:border-slate-200">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg print:bg-slate-50">
                                    <span className="text-slate-500 text-xs uppercase tracking-wider">BIS R-Number</span>
                                    <span className="font-mono text-white font-medium print:text-slate-900">{tenant.bis_r_number || "R-XXXXXXXX"}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg print:bg-slate-50">
                                    <span className="text-slate-500 text-xs uppercase tracking-wider">Carbon Footprint</span>
                                    <span className="font-mono text-white font-medium print:text-slate-900">{specs.carbon_footprint || "0"} kgCO₂e</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manufacturer Column - Expanded */}
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 print:text-slate-900">
                            <Globe className="h-5 w-5 text-indigo-400 print:text-slate-500" />
                            Manufacturer Details
                        </h3>
                        <div className="bg-slate-800/20 rounded-xl p-5 border border-white/5 space-y-4 print:bg-white print:border-slate-200">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Producer / Manufacturer</p>
                                <p className="text-slate-200 font-medium text-lg print:text-slate-900">{specs.manufacturer || tenant.company_name}</p>
                            </div>

                            <hr className="border-white/5 print:border-slate-200" />

                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Registered Office</p>
                                <p className="text-slate-400 text-sm whitespace-pre-wrap print:text-slate-700">{specs.manufacturer_address || tenant.address || "123 Battery Street, Tech Park, Indiranagar, Bengaluru, KA 560038"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Consumer Care</p>
                                    <a href={`mailto:${specs.manufacturer_email || tenant.support_email}`} className="text-blue-400 text-sm hover:text-blue-300 transition-colors print:text-blue-700">
                                        {specs.manufacturer_email || tenant.support_email}
                                    </a>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Web</p>
                                    <span className="text-slate-400 text-sm print:text-slate-700">{tenant.website || "exportready.com"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                     SAFETY & EOL SECTION (Step 4 - Dark & Critical)
                ═══════════════════════════════════════════════════════════════════ */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hazard Warning */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start gap-4 hover:bg-red-500/15 transition-colors print:bg-white print:border-red-200">
                        <div className="p-2 bg-red-500/20 rounded-lg shrink-0 print:bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse print:text-red-600 print:animate-none" />
                        </div>
                        <div>
                            <h4 className="text-red-400 font-bold mb-1 text-lg print:text-red-800">Lithium-Ion Hazard</h4>
                            <p className="text-red-200/70 text-sm leading-relaxed print:text-red-700">
                                Do not puncture, crush, or expose to high heat. Risk of fire or explosion. Handle with extreme care.
                            </p>
                        </div>
                    </div>

                    {/* Disposal Instruction */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-start gap-4 hover:bg-emerald-500/15 transition-colors print:bg-white print:border-emerald-200">
                        <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 print:bg-emerald-100">
                            <Recycle className="h-6 w-6 text-emerald-500 print:text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-emerald-400 font-bold mb-1 text-lg print:text-emerald-800">Recycling Required (EPR)</h4>
                            <p className="text-emerald-200/70 text-sm leading-relaxed print:text-emerald-700">
                                Do not dispose in regular trash. Mandatory return to authorized recycler as per {isIndia ? "BWM Rules 2022" : "local regulations"}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Legals - Dark */}
                <div className="text-center pt-8 border-t border-white/5 mt-8 print:border-slate-200">
                    <p className="text-slate-600 text-xs flex items-center justify-center gap-2">
                        <QrCode className="h-3 w-3" />
                        Secured by ExportReady™ • Verify via physical label scan
                    </p>
                </div>
            </div>
        </div>
    )
}
