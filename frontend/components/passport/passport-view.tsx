import { Battery, Calendar, CheckCircle, Leaf, MapPin, Recycle, Clock, Smartphone, Shield, Building2, Mail } from "lucide-react"

interface PassportViewProps {
    passport: any
}

// Status badge component with colored pill design
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; dot: string; text: string; label: string }> = {
        ACTIVE: { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "Active" },
        RECALLED: { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-700", label: "Recalled" },
        RECYCLED: { bg: "bg-slate-100 border-slate-300", dot: "bg-slate-500", text: "text-slate-600", label: "Recycled" },
    }
    const config = statusConfig[status] || statusConfig.ACTIVE

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${config.dot} ${status === "RECALLED" ? "animate-pulse" : ""}`}></span>
            <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
        </div>
    )
}

// Recyclability badge component
function RecyclableBadge({ recyclable }: { recyclable: boolean }) {
    if (recyclable) {
        return (
            <div className="flex items-center gap-2 text-emerald-600">
                <Recycle className="h-5 w-5" />
                <span className="font-semibold">Recyclable</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-2 text-slate-400">
            <Recycle className="h-5 w-5" />
            <span className="font-medium">Non-Recyclable</span>
        </div>
    )
}

// CE Mark SVG Component
function CEMark() {
    return (
        <svg viewBox="0 0 170 120" className="h-8 w-auto" fill="currentColor">
            <path d="M60,60 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M60,60 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0 M25,60 L60,60 M25,45 L50,45 M25,75 L50,75"
                fill="none" stroke="currentColor" strokeWidth="8" />
            <path d="M110,10 L110,110 L145,110 M110,60 L135,60 M110,10 L145,10"
                fill="none" stroke="currentColor" strokeWidth="8" />
        </svg>
    )
}

// Certification Badge Component
function CertificationBadge({ cert }: { cert: string }) {
    const certStyles: Record<string, string> = {
        CE: "bg-blue-100 text-blue-800 border-blue-200",
        UL: "bg-red-100 text-red-800 border-red-200",
        IEC: "bg-purple-100 text-purple-800 border-purple-200",
        RoHS: "bg-green-100 text-green-800 border-green-200",
    }
    const style = certStyles[cert.toUpperCase()] || "bg-slate-100 text-slate-700 border-slate-200"

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${style}`}>
            {cert.toUpperCase()}
        </span>
    )
}

export function PassportView({ passport }: PassportViewProps) {
    const specs = passport.specs || {}
    const passportData = passport.passport || {}
    const batchName = passport.batch_name || "Unknown Batch"
    const status = passportData.status || "ACTIVE"
    const materialComposition = specs.material_composition || {}
    const certifications = specs.certifications || []

    // Check if we have any material composition data
    const hasMaterials = materialComposition.cobalt || materialComposition.lithium ||
        materialComposition.nickel || materialComposition.lead

    return (
        <div className="space-y-6">
            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 1: THE HEADER - Identity & Status (Certificate Style)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="relative bg-linear-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6 shadow-sm">
                {/* Top Row: Verification + Certifications + Status */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                            <CheckCircle className="h-4 w-4 fill-emerald-100" />
                            Verified Authentic
                        </div>
                        {/* CE Mark and Certifications */}
                        {certifications.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                {certifications.map((cert: string) => (
                                    <CertificationBadge key={cert} cert={cert} />
                                ))}
                            </div>
                        )}
                    </div>
                    <StatusBadge status={status} />
                </div>

                {/* Main Title Block */}
                <div className="text-center space-y-2 mb-4">
                    <h1 className="text-2xl font-bold text-slate-900">{batchName}</h1>
                    <p className="text-lg text-slate-600 font-medium">{specs.manufacturer || "Unknown Manufacturer"}</p>
                </div>

                {/* Serial Number Display */}
                <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Passport Serial Number</div>
                    <code className="font-mono text-lg text-slate-800 tracking-wide">{passportData.serial_number || "N/A"}</code>
                </div>

                {/* Passport Issue Date */}
                <div className="mt-4 text-center text-sm text-slate-500">
                    <span className="font-medium">Issued:</span>{" "}
                    {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                    }) : "-"}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2: TECHNICAL SPECIFICATIONS (Refined Grid with Materials)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
                    <Battery className="h-5 w-5 text-blue-500" />
                    <h3>Technical Specifications</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Chemistry</div>
                        <div className="text-slate-900 font-bold mt-1">{specs.chemistry || "-"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Capacity</div>
                        <div className="text-slate-900 font-bold mt-1">{specs.capacity || "-"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Voltage</div>
                        <div className="text-slate-900 font-bold mt-1">{specs.voltage || "-"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Weight</div>
                        <div className="text-slate-900 font-bold mt-1">{specs.weight || "-"}</div>
                    </div>
                </div>

                {/* Material Composition - EU Battery Regulation Requirement */}
                {hasMaterials && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                            <Shield className="h-4 w-4 text-amber-500" />
                            <span>Material Composition</span>
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">EU Required</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                            {materialComposition.cobalt && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800">
                                    <span className="font-semibold">Co</span>
                                    <span className="text-blue-600">{materialComposition.cobalt}</span>
                                </span>
                            )}
                            {materialComposition.lithium && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-full text-purple-800">
                                    <span className="font-semibold">Li</span>
                                    <span className="text-purple-600">{materialComposition.lithium}</span>
                                </span>
                            )}
                            {materialComposition.nickel && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-800">
                                    <span className="font-semibold">Ni</span>
                                    <span className="text-teal-600">{materialComposition.nickel}</span>
                                </span>
                            )}
                            {materialComposition.lead && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-700">
                                    <span className="font-semibold">Pb</span>
                                    <span className="text-slate-500">{materialComposition.lead}</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3: SUSTAINABILITY & ORIGIN (The "Gold" Compliance Data)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-linear-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-4">
                    <Leaf className="h-5 w-5 text-emerald-600" />
                    <h3>Sustainability & Origin</h3>
                    <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">EU Compliant</span>
                </div>

                <div className="space-y-4">
                    {/* Carbon Footprint */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100">
                                <Leaf className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Carbon Footprint</div>
                                <div className="text-lg font-bold text-slate-900 mt-0.5">
                                    {specs.carbon_footprint || "Not specified"}
                                </div>
                            </div>
                        </div>
                        {specs.carbon_footprint && (
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-medium">
                                CO₂e Certified
                            </span>
                        )}
                    </div>

                    {/* Recyclability Status */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${specs.recyclable ? "bg-emerald-100" : "bg-slate-100"}`}>
                                <Recycle className={`h-5 w-5 ${specs.recyclable ? "text-emerald-600" : "text-slate-400"}`} />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Recyclability</div>
                                <div className="mt-0.5">
                                    <RecyclableBadge recyclable={specs.recyclable ?? false} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Country of Origin */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                                <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Country of Origin</div>
                                <div className="text-lg font-bold text-slate-900 mt-0.5">
                                    {specs.country_of_origin ? `Made in ${specs.country_of_origin}` : "Not specified"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 4: LIFECYCLE EVENTS (Enhanced Timeline)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <h3>Lifecycle Events</h3>
                </div>

                <div className="pl-2">
                    <div className="relative border-l-2 border-slate-200 pl-6 pb-2 space-y-5">
                        {/* Event 1: Manufacturing Complete */}
                        <div className="relative">
                            <div className="absolute -left-[31px] bg-emerald-500 h-4 w-4 rounded-full border-[3px] border-white shadow-sm"></div>
                            <div className="flex flex-col">
                                <span className="text-slate-900 font-semibold">Manufacturing Complete</span>
                                <span className="text-sm text-slate-500">
                                    {passportData.manufacture_date ? new Date(passportData.manufacture_date).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    }) : "-"}
                                </span>
                            </div>
                        </div>

                        {/* Event 2: Passport Issued */}
                        <div className="relative">
                            <div className="absolute -left-[31px] bg-blue-500 h-4 w-4 rounded-full border-[3px] border-white shadow-sm"></div>
                            <div className="flex flex-col">
                                <span className="text-slate-900 font-semibold">Digital Passport Issued</span>
                                <span className="text-sm text-slate-500">
                                    {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : "-"}
                                </span>
                            </div>
                        </div>

                        {/* Event 3: Pending - End of Life */}
                        <div className="relative opacity-50">
                            <div className="absolute -left-[31px] bg-slate-300 h-4 w-4 rounded-full border-[3px] border-white shadow-sm border-dashed"></div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-500 font-medium">Pending: End of Life / Recycling</span>
                                </div>
                                <span className="text-sm text-slate-400 italic">Awaiting lifecycle completion</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 5: MANUFACTURER & EU CONTACT (Regulatory Requirement)
            ═══════════════════════════════════════════════════════════════════ */}
            {(specs.manufacturer_address || specs.eu_representative) && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm">Manufacturer & Regulatory Contact</h3>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                        {specs.manufacturer_address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                <span>{specs.manufacturer_address}</span>
                            </div>
                        )}
                        {(specs.eu_representative || specs.eu_representative_email) && (
                            <div className="flex items-start gap-2 pt-1 border-t border-slate-200 mt-2">
                                <Mail className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-semibold">EU Representative: </span>
                                    {specs.eu_representative && <span className="font-medium">{specs.eu_representative}</span>}
                                    {specs.eu_representative_email && (
                                        <a href={`mailto:${specs.eu_representative_email}`} className="ml-1 text-blue-600 hover:underline">
                                            {specs.eu_representative_email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                FOOTER: Verification Note + CE Mark
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3" />
                        Verify this passport by scanning the QR code
                    </p>
                    {certifications.includes("CE") && (
                        <div className="text-slate-400">
                            <CEMark />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
