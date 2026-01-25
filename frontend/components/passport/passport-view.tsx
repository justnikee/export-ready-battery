"use client"

import { Battery, Calendar, CheckCircle, Leaf, MapPin, Recycle, Clock, Smartphone, Shield, Building2, Mail, Flag, Factory, Scale, Globe, Zap, ThermometerSun, Weight, Atom, Sparkles, BadgeCheck, QrCode, ExternalLink, FileCheck, Truck, AlertTriangle, Activity, Info } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"
import { motion } from "framer-motion"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface PassportViewProps {
    passport: any
}

// Animated gradient border wrapper
function GlowCard({ children, className, glowColor = "emerald" }: { children: React.ReactNode; className?: string; glowColor?: "emerald" | "orange" | "blue" | "purple" }) {
    const glowColors = {
        emerald: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
        orange: "from-orange-500/20 via-amber-500/20 to-yellow-500/20",
        blue: "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
        purple: "from-purple-500/20 via-pink-500/20 to-rose-500/20"
    }

    return (
        <div className={clsx("relative group", className)}>
            <div className={clsx("absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300", glowColors[glowColor])} />
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10">
                {children}
            </div>
        </div>
    )
}

// Status badge with animated pulse
function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { bg: string; ring: string; dot: string; text: string; label: string }> = {
        MANUFACTURED: { bg: "bg-slate-500/20", ring: "ring-slate-500/50", dot: "bg-slate-400", text: "text-slate-400", label: "Manufactured" },
        ACTIVE: { bg: "bg-emerald-500/20", ring: "ring-emerald-500/50", dot: "bg-emerald-400", text: "text-emerald-400", label: "Active" },
        SHIPPED: { bg: "bg-blue-500/20", ring: "ring-blue-500/50", dot: "bg-blue-400", text: "text-blue-400", label: "Shipped" },
        IN_SERVICE: { bg: "bg-emerald-500/20", ring: "ring-emerald-500/50", dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400", label: "In Service" },
        RETURN_REQUESTED: { bg: "bg-orange-500/20", ring: "ring-orange-500/50", dot: "bg-orange-400 animate-pulse", text: "text-orange-400", label: "Return Requested" },
        RETURNED: { bg: "bg-amber-500/20", ring: "ring-amber-500/50", dot: "bg-amber-400", text: "text-amber-400", label: "Returned" },
        RECALLED: { bg: "bg-red-500/20", ring: "ring-red-500/50", dot: "bg-red-400 animate-pulse", text: "text-red-400", label: "Recalled" },
        RECYCLED: { bg: "bg-purple-500/20", ring: "ring-purple-500/50", dot: "bg-purple-400", text: "text-purple-400", label: "Recycled" },
    }

    const config = configs[status] || configs.ACTIVE

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={clsx("inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1", config.bg, config.ring)}
        >
            <span className={clsx("h-2 w-2 rounded-full", config.dot)} />
            <span className={clsx("text-sm font-semibold", config.text)}>{config.label}</span>
        </motion.div>
    )
}

// Market Badge with flag
function MarketBadge({ region }: { region: MarketRegion }) {
    if (region === "INDIA") {
        return (
            <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 ring-1 ring-orange-500/50 text-orange-400 text-sm font-bold"
            >
                🇮🇳 PLI Eligible
            </motion.span>
        )
    }
    if (region === "EU") {
        return (
            <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 ring-1 ring-blue-500/50 text-blue-400 text-sm font-bold"
            >
                🇪🇺 EU Compliant
            </motion.span>
        )
    }
    return null
}

// Verified badge with animation
function VerifiedBadge() {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/50"
        >
            <BadgeCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold text-sm">Verified Authentic</span>
        </motion.div>
    )
}

// Spec card component
function SpecCard({ icon: Icon, label, value, unit, color = "slate" }: { icon: any; label: string; value: string | number; unit?: string; color?: string }) {
    const colorClasses: Record<string, string> = {
        slate: "from-slate-500/10 to-slate-600/10 text-slate-400",
        emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-400",
        blue: "from-blue-500/10 to-indigo-500/10 text-blue-400",
        orange: "from-orange-500/10 to-amber-500/10 text-orange-400",
        purple: "from-purple-500/10 to-pink-500/10 text-purple-400"
    }

    return (
        <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={clsx("p-4 rounded-xl bg-gradient-to-br border border-white/5", colorClasses[color])}
        >
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 opacity-70" />
                <span className="text-xs uppercase tracking-wider font-medium opacity-70">{label}</span>
            </div>
            <div className="text-white font-bold text-xl">
                {value}
                {unit && <span className="text-sm font-normal opacity-50 ml-1">{unit}</span>}
            </div>
        </motion.div>
    )
}

// Progress bar with glow
function GlowProgress({ value, max = 100, color = "emerald" }: { value: number; max?: number; color?: string }) {
    const percentage = Math.min((value / max) * 100, 100)
    const colorClasses: Record<string, string> = {
        emerald: "from-emerald-500 to-teal-500",
        orange: "from-orange-500 to-amber-500",
        blue: "from-blue-500 to-indigo-500"
    }

    return (
        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={clsx("h-full rounded-full bg-gradient-to-r", colorClasses[color] || colorClasses.emerald)}
            />
            <div className={clsx("absolute inset-0 bg-gradient-to-r opacity-50 blur-sm", colorClasses[color] || colorClasses.emerald)} style={{ width: `${percentage}%` }} />
        </div>
    )
}

// Timeline event
function TimelineEvent({ title, date, icon: Icon, color = "emerald", pending = false }: { title: string; date?: string; icon: any; color?: string; pending?: boolean }) {
    const colorClasses: Record<string, string> = {
        emerald: "bg-emerald-500 shadow-emerald-500/50",
        orange: "bg-orange-500 shadow-orange-500/50",
        blue: "bg-blue-500 shadow-blue-500/50",
        slate: "bg-slate-600 shadow-none"
    }

    return (
        <div className={clsx("relative flex items-start gap-4", pending && "opacity-40")}>
            <div className={clsx("relative z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg", colorClasses[color])}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 pt-1.5">
                <p className={clsx("font-semibold", pending ? "text-slate-500" : "text-white")}>{title}</p>
                {date && <p className="text-sm text-slate-500 mt-0.5">{date}</p>}
            </div>
        </div>
    )
}

// CE Mark
function CEMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 170 120" className={clsx("h-8 w-auto", className)} fill="currentColor">
            <path d="M60,60 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0 M60,60 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0 M25,60 L60,60 M25,45 L50,45 M25,75 L50,75"
                fill="none" stroke="currentColor" strokeWidth="8" />
            <path d="M110,10 L110,110 L145,110 M110,60 L135,60 M110,10 L145,10"
                fill="none" stroke="currentColor" strokeWidth="8" />
        </svg>
    )
}

// BIS Mark
function BISMark() {
    return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-orange-400 text-orange-400 text-[10px] font-bold bg-orange-500/10">
            BIS
        </div>
    )
}

// Material chip
function MaterialChip({ element, value }: { element: string; value: number }) {
    const colors: Record<string, string> = {
        cobalt: "from-blue-500/20 to-blue-600/20 text-blue-400 ring-blue-500/30",
        lithium: "from-purple-500/20 to-purple-600/20 text-purple-400 ring-purple-500/30",
        nickel: "from-teal-500/20 to-teal-600/20 text-teal-400 ring-teal-500/30",
        lead: "from-slate-500/20 to-slate-600/20 text-slate-400 ring-slate-500/30",
    }

    return (
        <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ring-1", colors[element] || colors.lead)}>
            <Atom className="h-3.5 w-3.5" />
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

    const marketRegion = (passport.market_region || "GLOBAL") as MarketRegion
    const isIndia = marketRegion === "INDIA"
    const isEU = marketRegion === "EU"

    // Fix: allow 0 to be a valid value for imported batches
    const domesticValueAdd = passport.domestic_value_add !== undefined ? passport.domestic_value_add : 65

    const cellSource = passport.cell_source || "DOMESTIC"
    const materials = passport.materials || (isEU ? { cobalt: 12, lithium: 8, nickel: 15, lead: 0.1 } : null)

    // India import/customs fields
    const billOfEntryNo = passport.bill_of_entry_no || ""
    const cellCountryOfOrigin = passport.country_of_origin || ""
    const customsDate = passport.customs_date || ""
    const isImported = cellSource === "IMPORTED"

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    return (
        <motion.div
            className="w-full max-w-2xl mx-auto space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* ═══════════════════════════════════════════════════════════════════
                HEADER - Identity & Badges
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                {/* Status Badges Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <VerifiedBadge />
                    <MarketBadge region={marketRegion} />
                    <StatusBadge status={status} />
                </div>

                {/* Product Name */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">{batchName}</h1>
                    <p className="text-slate-400 text-lg">{specs.manufacturer || "Battery Manufacturer"}</p>
                </div>

                {/* Serial Number Card */}
                <GlowCard glowColor={isIndia ? "orange" : isEU ? "blue" : "emerald"}>
                    <div className="p-6 text-center">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3 flex items-center justify-center gap-2">
                            <QrCode className="h-4 w-4" />
                            {isIndia ? "Battery Aadhaar Number (BPAN)" : "Passport Serial Number"}
                        </div>
                        <code className={clsx(
                            "font-mono text-2xl md:text-3xl font-bold tracking-wider",
                            isIndia ? "text-orange-400" : isEU ? "text-blue-400" : "text-emerald-400"
                        )}>
                            {passportData.serial_number || "N/A"}
                        </code>
                        <div className="mt-4 text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Issued: {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            }) : "-"}
                        </div>
                    </div>
                </GlowCard>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
                TECHNICAL SPECIFICATIONS GRID
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                <GlowCard>
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Battery className="h-5 w-5 text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Technical Specifications</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <SpecCard icon={Atom} label="Chemistry" value={specs.chemistry || "-"} color="purple" />
                            <SpecCard icon={Zap} label="Capacity" value={specs.capacity || "-"} color="emerald" />
                            <SpecCard icon={ThermometerSun} label="Voltage" value={specs.voltage || "-"} color="blue" />
                            <SpecCard icon={Weight} label="Weight" value={specs.weight || "-"} color="orange" />
                        </div>

                        {/* State of Health */}
                        <div className="mt-4 p-4 rounded-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 border border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <Activity className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">State of Health</div>
                                        <div className="text-white font-semibold mt-0.5 flex items-center gap-2">
                                            {(() => {
                                                const soh = specs.state_of_health
                                                const hasLiveTelemetry = specs.telemetry_source === "LIVE" || specs.has_bms_integration

                                                // If SOH is 100, null, or undefined AND no live telemetry, show static EU compliance
                                                if ((soh === null || soh === undefined || soh === 100) && !hasLiveTelemetry) {
                                                    return (
                                                        <>
                                                            <span className="text-emerald-400">100%</span>
                                                            <span className="text-xs text-slate-500">(Initial Rated Capacity)</span>
                                                            <div className="group relative">
                                                                <Info className="h-4 w-4 text-blue-400 cursor-help animate-pulse" />
                                                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-slate-800 border border-blue-500/30 rounded-lg shadow-xl z-10">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Shield className="h-4 w-4 text-blue-400" />
                                                                        <p className="text-xs font-semibold text-blue-400">EU Safe Harbor Declaration</p>
                                                                    </div>
                                                                    <p className="text-xs text-slate-300 leading-relaxed">
                                                                        Static declaration based on factory rating (Annex VII). Live telemetry not available. This passport contains manufacturing data only.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )
                                                }

                                                // Otherwise show actual SOH with percentage
                                                return (
                                                    <>
                                                        <span className="text-emerald-400 text-xl">{soh}%</span>
                                                        {hasLiveTelemetry && (
                                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">Live</span>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Origin */}
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-white/5 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <MapPin className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                {isImported ? (
                                    <>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Origin</div>
                                        <div className="text-white font-semibold mt-0.5">
                                            Imported from {cellCountryOfOrigin || specs.country_of_origin || "Unknown"}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Country of Origin</div>
                                        <div className="text-white font-semibold mt-0.5">
                                            Made in {specs.country_of_origin || "India"}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </GlowCard>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
                COMPLIANCE CARD (Dynamic by Market)
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                {isIndia ? (
                    <GlowCard glowColor="orange">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10">
                                        <Flag className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">🇮🇳 Regulatory Compliance</h2>
                                </div>
                                <BISMark />
                            </div>

                            <div className="space-y-4">
                                {/* DVA Progress */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-slate-300">Domestic Value Add</span>
                                        <span className={clsx(
                                            "text-2xl font-bold",
                                            isImported ? "text-slate-400" : (domesticValueAdd >= 50 ? "text-emerald-400" : "text-orange-400")
                                        )}>
                                            {domesticValueAdd}%
                                        </span>
                                    </div>
                                    <GlowProgress value={isImported ? 0 : domesticValueAdd} color={isImported ? "blue" : (domesticValueAdd >= 50 ? "emerald" : "orange")} />
                                    <p className="text-xs text-slate-500 mt-2">
                                        {isImported ? "Imported cells (0% DVA)" : "PLI Requirement: ≥50%"}
                                    </p>
                                </div>

                                {/* Cell Source */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Factory className={clsx("h-5 w-5", cellSource === "DOMESTIC" ? "text-emerald-400" : "text-slate-500")} />
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Cell Source</div>
                                            <div className="font-semibold text-white mt-0.5">{cellSource === "DOMESTIC" ? "Domestic 🇮🇳" : "Imported"}</div>
                                        </div>
                                    </div>
                                    {cellSource === "DOMESTIC" && (
                                        <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full font-semibold ring-1 ring-orange-500/30">
                                            Atmanirbhar
                                        </span>
                                    )}
                                </div>

                                {/* EPR with Registration Number */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <FileCheck className="h-5 w-5 text-emerald-400" />
                                        <div className="flex-1">
                                            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">EPR Registration</div>
                                            <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                                <CheckCircle className="h-4 w-4" />
                                                {tenant.epr_registration_number || "Registered Producer"}
                                            </div>
                                        </div>
                                    </div>
                                    {tenant.bis_r_number && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                                            <BISMark />
                                            <div>
                                                <div className="text-xs text-slate-500">BIS R-Number (IS 16046)</div>
                                                <div className="text-blue-400 text-sm font-mono">R-{tenant.bis_r_number}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Import Details for IMPORTED cells */}
                                {isImported && billOfEntryNo && (
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Truck className="h-4 w-4 text-amber-400" />
                                            <span className="text-sm font-medium text-amber-400">Import Declaration</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-xs text-slate-500">Imported from</div>
                                                <div className="text-white font-medium">{cellCountryOfOrigin || "Foreign Origin"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500">Bill of Entry</div>
                                                <div className="text-white font-mono text-sm">{billOfEntryNo}</div>
                                            </div>
                                        </div>
                                        {customsDate && (
                                            <div className="mt-2 text-xs text-slate-500">
                                                Cleared: {new Date(customsDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlowCard>
                ) : isEU ? (
                    <GlowCard glowColor="blue">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                        <Leaf className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">🇪🇺 Sustainability & Composition</h2>
                                </div>
                                <CEMark className="text-blue-400/60" />
                            </div>

                            <div className="space-y-4">
                                {/* Carbon Footprint */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-emerald-500/10">
                                            <Leaf className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Carbon Footprint</div>
                                            <div className="text-xl font-bold text-white mt-0.5">
                                                {specs.carbon_footprint || "N/A"} <span className="text-sm font-normal text-slate-500">kg CO₂e</span>
                                            </div>
                                        </div>
                                    </div>
                                    {specs.carbon_footprint && (
                                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-semibold ring-1 ring-emerald-500/30">
                                            Certified
                                        </span>
                                    )}
                                </div>

                                {/* Materials */}
                                {materials && (
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Shield className="h-4 w-4 text-amber-400" />
                                            <span className="text-sm font-medium text-slate-300">Material Composition</span>
                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-medium">EU Required</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {materials.cobalt && <MaterialChip element="cobalt" value={materials.cobalt} />}
                                            {materials.lithium && <MaterialChip element="lithium" value={materials.lithium} />}
                                            {materials.nickel && <MaterialChip element="nickel" value={materials.nickel} />}
                                            {materials.lead && <MaterialChip element="lead" value={materials.lead} />}
                                        </div>
                                    </div>
                                )}

                                {/* Recyclability */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                                    <Recycle className={clsx("h-5 w-5", specs.recyclable ? "text-emerald-400" : "text-slate-500")} />
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Recyclability</div>
                                        <div className={clsx("font-semibold mt-0.5", specs.recyclable ? "text-emerald-400" : "text-slate-500")}>
                                            {specs.recyclable ? "♻️ Recyclable" : "Non-Recyclable"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                ) : (
                    <GlowCard>
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Globe className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">Sustainability Data</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                                    <Leaf className="h-5 w-5 text-emerald-400" />
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Carbon Footprint</div>
                                        <div className="font-semibold text-white mt-0.5">{specs.carbon_footprint || "Not specified"}</div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                                    <Recycle className={clsx("h-5 w-5", specs.recyclable ? "text-emerald-400" : "text-slate-500")} />
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Recyclability</div>
                                        <div className={clsx("font-semibold mt-0.5", specs.recyclable ? "text-emerald-400" : "text-slate-500")}>
                                            {specs.recyclable ? "Recyclable" : "Non-Recyclable"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                )}
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
                INDIA RECYCLING INSTRUCTIONS (BWM Compliance)
            ═══════════════════════════════════════════════════════════════════ */}
            {isIndia && (
                <motion.div variants={itemVariants}>
                    <GlowCard glowColor="emerald">
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Recycle className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">♻️ Recycling Instructions (BWM Rules 2022)</h2>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Crossed-out Wheeled Bin Symbol */}
                                <div className="shrink-0">
                                    <svg viewBox="0 0 100 120" className="h-24 w-auto text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3">
                                        {/* Bin Body */}
                                        <rect x="20" y="30" width="60" height="60" rx="4" />
                                        {/* Bin Lid */}
                                        <path d="M15 30 L85 30" strokeWidth="4" />
                                        <rect x="35" y="22" width="30" height="8" rx="2" />
                                        {/* Wheels */}
                                        <circle cx="32" cy="95" r="5" fill="currentColor" />
                                        <circle cx="68" cy="95" r="5" fill="currentColor" />
                                        {/* Cross-out Line */}
                                        <line x1="10" y1="110" x2="90" y2="20" strokeWidth="6" className="text-red-500" />
                                    </svg>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-300">
                                            <strong className="text-white">Do not dispose in regular waste.</strong> This battery must be collected separately through authorized recyclers.
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-sm text-emerald-400">
                                            📞 For collection, contact the manufacturer or visit <strong>eprregistration.cpcb.gov.in</strong> to locate your nearest recycler.
                                        </p>
                                    </div>
                                    {tenant.support_email && (
                                        <p className="text-xs text-slate-500">
                                            Producer Responsibility: {tenant.company_name} • <a href={`mailto:${tenant.support_email}`} className="text-emerald-400 hover:underline">{tenant.support_email}</a>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlowCard>
                </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                LIFECYCLE TIMELINE
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                <GlowCard>
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Sparkles className="h-5 w-5 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Lifecycle Timeline</h2>
                        </div>

                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-slate-700" />

                            <div className="space-y-8">
                                <TimelineEvent
                                    icon={Factory}
                                    title="Manufacturing Complete"
                                    date={passportData.manufacture_date ? new Date(passportData.manufacture_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : undefined}
                                    color="emerald"
                                />
                                <TimelineEvent
                                    icon={BadgeCheck}
                                    title={isIndia ? "Battery Aadhaar Issued" : "Digital Passport Issued"}
                                    date={passportData.created_at ? new Date(passportData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : undefined}
                                    color={isIndia ? "orange" : "blue"}
                                />
                                <TimelineEvent
                                    icon={Recycle}
                                    title="End of Life / Recycling"
                                    color="slate"
                                    pending
                                />
                            </div>
                        </div>
                    </div>
                </GlowCard>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
                MANUFACTURER CONTACT
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                <GlowCard>
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 rounded-lg bg-slate-500/10">
                                <Building2 className="h-5 w-5 text-slate-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Manufacturer Contact</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Factory className="h-4 w-4 text-slate-500" />
                                    <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Company</span>
                                </div>
                                <p className="text-white font-medium text-sm">
                                    {specs.manufacturer || tenant.company_name || "Not specified"}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-slate-500" />
                                    <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Address</span>
                                </div>
                                <p className="text-slate-300 text-sm">
                                    {specs.manufacturer_address || tenant.address || "Not specified"}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Mail className="h-4 w-4 text-blue-400" />
                                    <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Contact</span>
                                </div>
                                {(specs.manufacturer_email || tenant.support_email) ? (
                                    <a href={`mailto:${specs.manufacturer_email || tenant.support_email}`} className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                                        {specs.manufacturer_email || tenant.support_email}
                                    </a>
                                ) : (
                                    <span className="text-slate-500 text-sm">Not specified</span>
                                )}
                            </div>
                        </div>
                    </div>
                </GlowCard>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════
                SECURITY FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants} className="pt-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Secured by ExportReady™ Digital Passport System</span>
                        <span className="hidden md:inline">•</span>
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
                        <span>•</span>
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        {isEU && <CEMark className="h-6 text-slate-600" />}
                        {isIndia && <BISMark />}
                        {tenant.epr_registration_number && (
                            <span className="text-[10px] text-slate-600 font-mono">
                                EPR: {tenant.epr_registration_number}
                            </span>
                        )}
                        {tenant.bis_r_number && (
                            <span className="text-[10px] text-slate-600 font-mono">
                                R-{tenant.bis_r_number}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
