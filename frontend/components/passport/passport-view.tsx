import { Battery, Calendar, CheckCircle, Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PassportViewProps {
    passport: any
}

export function PassportView({ passport }: PassportViewProps) {
    const specs = passport.specs || {}
    const passportData = passport.passport || {}
    const batchName = passport.batch_name || "Unknown Batch"

    return (
        <div className="space-y-8">
            {/* Top Verification Status */}
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 fill-emerald-100" />
                    Verified Authentic
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900">{specs.manufacturer || "Unknown Manufacturer"}</h2>
                    <p className="text-slate-500 font-medium">{batchName}</p>
                </div>

                <div className="w-full flex items-center justify-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-center">
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Serial Number</div>
                        <code className="font-mono text-lg text-slate-700 px-2">{passportData.serial_number || "N/A"}</code>
                    </div>
                </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-2">
                    <Battery className="h-5 w-5 text-emerald-500" />
                    <h3>Technical Specifications</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase font-medium">Capacity</div>
                        <div className="text-slate-900 font-semibold mt-0.5">{specs.capacity || "-"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase font-medium">Voltage</div>
                        <div className="text-slate-900 font-semibold mt-0.5">{specs.voltage || "-"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase font-medium">Chemistry</div>
                        <div className="text-slate-900 font-semibold mt-0.5">{specs.chemistry || "-"}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase font-medium">Weight</div>
                        <div className="text-slate-900 font-semibold mt-0.5">{specs.weight || "-"}</div>
                    </div>
                </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <h3>Lifecycle Events</h3>
                </div>

                <div className="pl-2">
                    <div className="relative border-l-2 border-slate-100 pl-6 pb-6 space-y-6">
                        {/* Event 1 */}
                        <div className="relative">
                            <div className="absolute -left-[31px] bg-emerald-500 h-4 w-4 rounded-full border-[3px] border-white shadow-sm"></div>
                            <div className="flex flex-col">
                                <span className="text-slate-900 font-medium">Manufacturing Complete</span>
                                <span className="text-sm text-slate-500">
                                    {passportData.manufacture_date ? new Date(passportData.manufacture_date).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    }) : "-"}
                                </span>
                            </div>
                        </div>
                        {/* Event 2 */}
                        <div className="relative">
                            <div className="absolute -left-[31px] bg-blue-500 h-4 w-4 rounded-full border-[3px] border-white shadow-sm"></div>
                            <div className="flex flex-col">
                                <span className="text-slate-900 font-medium">Passport Issued</span>
                                <span className="text-sm text-slate-500">
                                    {passportData.created_at ? new Date(passportData.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <Smartphone className="h-3 w-3" />
                    Verify this passport by scanning the QR code
                </p>
            </div>
        </div>
    )
}
