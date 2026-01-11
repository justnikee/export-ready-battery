import { Battery, Calendar, CheckCircle, Leaf, MapPin, Recycle, Clock, Smartphone, Shield, Building2, Mail, Flag, Factory, Scale, Globe, ExternalLink } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface PassportViewProps {
    passport: any
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const config = {
        ACTIVE: { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "Active" },
        RECALLED: { bg: "bg-red-50 border-red-200", dot: "bg-red-500 animate-pulse", text: "text-red-700", label: "Recalled" },
        RECYCLED: { bg: "bg-slate-100 border-slate-300", dot: "bg-slate-500", text: "text-slate-600", label: "Recycled" },
    }[status] || { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "Active" }

    return (
        <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-full border", config.bg)}>
            <span className={clsx("h-2.5 w-2.5 rounded-full", config.dot)} />
            <span className={clsx("text-sm font-semibold", config.text)}>{config.label}</span>
        </div>
    )
}

// Dynamic Market Badge
function MarketBadge({ region }: { region: MarketRegion }) {
    if (region === "INDIA") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300 text-orange-800 text-sm font-bold shadow-sm">
                🇮🇳 PLI Eligible
            </span>
        )
    }
    if (region === "EU") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 text-blue-800 text-sm font-bold shadow-sm">
                🇪🇺 EU Compliant
            </span>
        )
    }
    return null
}

// CE Mark SVG
function CEMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 170 120" className={clsx("h-10 w-auto", className)} fill="currentColor">
            <path d="M60,60 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M60,60 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0 M25,60 L60,60 M25,45 L50,45 M25,75 L50,75"
                fill="none" stroke="currentColor" strokeWidth="8" />
            <path d="M110,10 L110,110 L145,110 M110,60 L135,60 M110,10 L145,10"
                fill="none" stroke="currentColor" strokeWidth="8" />
        </svg>
    )
}

// BIS Mark for India
function BISMark() {
    return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-orange-500 text-orange-600 text-xs font-bold bg-orange-50">
            BIS
        </div>
    )
}

// Progress Bar for DVA
function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
    const percentage = Math.min((value / max) * 100, 100)
    return (
        <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
                className={clsx(
                    "h-2.5 rounded-full transition-all",
                    percentage >= 50 ? "bg-emerald-500" : "bg-orange-500"
                )}
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}

// Material Pill
function MaterialPill({ element, value }: { element: string; value: number }) {
    const colors: Record<string, string> = {
        cobalt: "bg-blue-50 text-blue-700 border-blue-200",
        lithium: "bg-purple-50 text-purple-700 border-purple-200",
        nickel: "bg-teal-50 text-teal-700 border-teal-200",
        lead: "bg-slate-100 text-slate-600 border-slate-200",
    }
    return (
        <span className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium border", colors[element] || colors.lead)}>
            {element.charAt(0).toUpperCase() + element.slice(1)}: {value}%
        </span>
    )
}

export function PassportView({ passport }: PassportViewProps) {
    const specs = passport.specs || {}
    const passportData = passport.passport || {}
    const tenant = passport.tenant || {}
    const batchName = passport.batch_name || "Battery Passport"
    const status = passportData.status || "ACTIVE"

    // Dual-mode data
    const marketRegion = (passport.market_region || "GLOBAL") as MarketRegion
    const isIndia = marketRegion === "INDIA"
    const isEU = marketRegion === "EU"

    // India-specific (with defaults for demo)
    const domesticValueAdd = passport.domestic_value_add || 65
    const cellSource = passport.cell_source || "DOMESTIC"

    // EU-specific (mock if not present)
    const materials = passport.materials || (isEU ? { cobalt: 12, lithium: 8, nickel: 15, lead: 0.1 } : null)

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* ═══════════════════════════════════════════════════════════════════
                HEADER - Product Identity & Status
            ═══════════════════════════════════════════════════════════════════ */}
            <div className={clsx(
                "rounded-2xl border-2 p-6 shadow-lg",
                isIndia ? "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-orange-200" :
                    isEU ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200" :
                        "bg-gradient-to-br from-slate-50 to-white border-slate-200"
            )}>
                {/* Top Row: Badges */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Verified Authentic</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MarketBadge region={marketRegion} />
                        <StatusBadge status={status} />
                    </div>
                </div>

                {/* Main Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{batchName}</h1>
                    <p className="text-lg text-slate-600">{specs.manufacturer || "Unknown Manufacturer"}</p>
                </div>

                {/* Serial Number - Monospace */}
                <div className={clsx(
                    "rounded-xl border-2 p-5 text-center",
                    isIndia ? "bg-white border-orange-300" :
                        isEU ? "bg-white border-blue-300" :
                            "bg-white border-slate-300"
                )}>
                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">
                        {isIndia ? "Battery Aadhaar Number (BPAN)" : "Passport Serial Number"}
                    </div>
                    <code className={clsx(
                        "font-mono text-2xl md:text-3xl font-bold tracking-wider",
                        isIndia ? "text-orange-700" : isEU ? "text-blue-700" : "text-slate-800"
                    )}>
                        {passportData.serial_number || "N/A"}
                    </code>
                </div>

                {/* Issue Date */}
                <div className="mt-4 text-center text-sm text-slate-500">
                    <Calendar className="inline h-4 w-4 mr-1.5" />
                    Issued: {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                    }) : "-"}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                2-COLUMN GRID (Responsive)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* LEFT COLUMN: Technical Specifications */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                        <Battery className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg">Technical Specifications</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Chemistry</div>
                            <div className="text-slate-900 font-bold mt-1 text-lg">{specs.chemistry || "-"}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Capacity</div>
                            <div className="text-slate-900 font-bold mt-1 text-lg">{specs.capacity || "-"}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Voltage</div>
                            <div className="text-slate-900 font-bold mt-1 text-lg">{specs.voltage || "-"}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Weight</div>
                            <div className="text-slate-900 font-bold mt-1 text-lg">{specs.weight || "-"}</div>
                        </div>
                    </div>

                    {/* Country of Origin */}
                    <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Origin</div>
                            <div className="text-slate-900 font-semibold">
                                {specs.country_of_origin ? `Made in ${specs.country_of_origin}` : "Made in India"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Dynamic Compliance Card */}
                {isIndia ? (
                    /* INDIA COMPLIANCE */
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-orange-800 font-bold">
                                <Flag className="h-5 w-5 text-orange-600" />
                                <h3 className="text-lg">🇮🇳 Regulatory Compliance</h3>
                            </div>
                            <BISMark />
                        </div>

                        <div className="space-y-4">
                            {/* Domestic Value Add */}
                            <div className="bg-white rounded-lg border border-orange-200 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-slate-700">Domestic Value Add</span>
                                    <span className={clsx(
                                        "text-lg font-bold",
                                        domesticValueAdd >= 50 ? "text-emerald-600" : "text-orange-600"
                                    )}>
                                        {domesticValueAdd}%
                                    </span>
                                </div>
                                <ProgressBar value={domesticValueAdd} />
                                <div className="text-xs text-slate-500 mt-1.5">PLI Requirement: ≥50%</div>
                            </div>

                            {/* Cell Source */}
                            <div className="bg-white rounded-lg border border-orange-200 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Factory className={clsx("h-5 w-5", cellSource === "DOMESTIC" ? "text-emerald-600" : "text-slate-500")} />
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Cell Source</div>
                                        <div className="font-bold text-slate-900">{cellSource === "DOMESTIC" ? "Domestic 🇮🇳" : "Imported"}</div>
                                    </div>
                                </div>
                                {cellSource === "DOMESTIC" && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">Atmanirbhar</span>
                                )}
                            </div>

                            {/* EPR Status */}
                            <div className="bg-white rounded-lg border border-orange-200 p-4 flex items-center gap-3">
                                <Scale className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">EPR Registration</div>
                                    <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                                        <CheckCircle className="h-4 w-4" /> Registered Producer
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isEU ? (
                    /* EU COMPLIANCE */
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-blue-800 font-bold">
                                <Leaf className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg">🇪🇺 Sustainability & Composition</h3>
                            </div>
                            <CEMark className="text-blue-400" />
                        </div>

                        <div className="space-y-4">
                            {/* Carbon Footprint */}
                            <div className="bg-white rounded-lg border border-blue-200 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-emerald-100">
                                        <Leaf className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Carbon Footprint</div>
                                        <div className="text-xl font-bold text-slate-900">
                                            {specs.carbon_footprint || "N/A"} <span className="text-sm font-normal text-slate-500">kg CO₂e</span>
                                        </div>
                                    </div>
                                </div>
                                {specs.carbon_footprint && (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Certified</span>
                                )}
                            </div>

                            {/* Material Composition */}
                            {materials && (
                                <div className="bg-white rounded-lg border border-blue-200 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-bold text-slate-700">Material Composition</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">EU Required</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {materials.cobalt && <MaterialPill element="cobalt" value={materials.cobalt} />}
                                        {materials.lithium && <MaterialPill element="lithium" value={materials.lithium} />}
                                        {materials.nickel && <MaterialPill element="nickel" value={materials.nickel} />}
                                        {materials.lead && <MaterialPill element="lead" value={materials.lead} />}
                                    </div>
                                </div>
                            )}

                            {/* Recyclability */}
                            <div className="bg-white rounded-lg border border-blue-200 p-4 flex items-center gap-3">
                                <Recycle className={clsx("h-5 w-5", specs.recyclable ? "text-emerald-600" : "text-slate-400")} />
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Recyclability</div>
                                    <div className={clsx("font-bold", specs.recyclable ? "text-emerald-700" : "text-slate-500")}>
                                        {specs.recyclable ? "♻️ Recyclable" : "Non-Recyclable"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* GLOBAL/DEFAULT */
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold mb-4">
                            <Globe className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg">Sustainability Data</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white rounded-lg border border-emerald-200 p-4 flex items-center gap-3">
                                <Leaf className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Carbon Footprint</div>
                                    <div className="font-bold text-slate-900">{specs.carbon_footprint || "Not specified"}</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-emerald-200 p-4 flex items-center gap-3">
                                <Recycle className={clsx("h-5 w-5", specs.recyclable ? "text-emerald-600" : "text-slate-400")} />
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Recyclability</div>
                                    <div className={clsx("font-bold", specs.recyclable ? "text-emerald-700" : "text-slate-500")}>
                                        {specs.recyclable ? "Recyclable" : "Non-Recyclable"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                LIFECYCLE EVENTS
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg">Lifecycle Timeline</h3>
                </div>

                <div className="relative border-l-2 border-slate-200 pl-6 ml-2 space-y-6">
                    {/* Manufacturing */}
                    <div className="relative">
                        <div className="absolute -left-[31px] bg-emerald-500 h-4 w-4 rounded-full border-[3px] border-white shadow" />
                        <div>
                            <span className="font-semibold text-slate-900">Manufacturing Complete</span>
                            <span className="text-sm text-slate-500 ml-2">
                                {passportData.manufacture_date ? new Date(passportData.manufacture_date).toLocaleDateString() : "-"}
                            </span>
                        </div>
                    </div>

                    {/* Passport Issued */}
                    <div className="relative">
                        <div className={clsx("absolute -left-[31px] h-4 w-4 rounded-full border-[3px] border-white shadow", isIndia ? "bg-orange-500" : "bg-blue-500")} />
                        <div>
                            <span className="font-semibold text-slate-900">{isIndia ? "Battery Aadhaar Issued" : "Digital Passport Issued"}</span>
                            <span className="text-sm text-slate-500 ml-2">
                                {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString() : "-"}
                            </span>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="relative opacity-50">
                        <div className="absolute -left-[31px] bg-slate-300 h-4 w-4 rounded-full border-[3px] border-white" />
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-500">Pending: End of Life / Recycling</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MANUFACTURER CONTACT (Footer)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-slate-700 font-bold mb-3">
                    <Building2 className="h-5 w-5 text-slate-500" />
                    <h3>Manufacturer Contact</h3>
                </div>

                <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div className="flex items-start gap-2">
                        <Factory className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                            <div className="text-xs uppercase text-slate-400 font-bold">Company</div>
                            <div className="font-medium text-slate-700">
                                {specs.manufacturer || tenant.company_name || "Not specified"}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                            <div className="text-xs uppercase text-slate-400 font-bold">Address</div>
                            <div className="text-slate-600">
                                {specs.manufacturer_address || tenant.address || "Not specified"}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                            <div className="text-xs uppercase text-slate-400 font-bold">Contact</div>
                            {(specs.manufacturer_email || tenant.support_email) ? (
                                <a href={`mailto:${specs.manufacturer_email || tenant.support_email}`} className="text-blue-600 hover:underline">
                                    {specs.manufacturer_email || tenant.support_email}
                                </a>
                            ) : (
                                <span className="text-slate-400">Not specified</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECURITY FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 pt-4 border-t border-slate-100 mt-8">
                <div className="flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Secured by ExportReady™ Digital Passport System</span>
                    <span className="mx-1">•</span>
                    <Link href="/terms" className="hover:text-slate-600 hover:underline">Terms</Link>
                    <span className="mx-1">•</span>
                    <Link href="/privacy" className="hover:text-slate-600 hover:underline">Privacy</Link>
                </div>
                <div className="flex items-center gap-3">
                    {isEU && <CEMark className="h-6 text-slate-300" />}
                    {isIndia && <BISMark />}
                </div>
            </div>
        </div>
    )
}
