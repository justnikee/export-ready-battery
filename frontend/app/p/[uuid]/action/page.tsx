"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Loader2, CheckCircle, AlertCircle, ArrowRight,
    Truck, Wrench, RotateCcw, Recycle, Shield,
    User, Building2, Trophy, Package
} from "lucide-react"

interface PassportInfo {
    passport: {
        uuid: string
        serial_number: string
        status: string
    }
    actor: {
        email: string
        role: string
    }
    allowed_transitions: string[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; description: string }> = {
    SHIPPED: {
        label: "Mark as Shipped",
        icon: Truck,
        color: "blue",
        description: "Battery has left the factory and is in transit"
    },
    IN_SERVICE: {
        label: "Mark as Installed",
        icon: Wrench,
        color: "emerald",
        description: "Battery has been installed in a device or vehicle"
    },
    RETURN_REQUESTED: {
        label: "Request Return",
        icon: Package,
        color: "orange",
        description: "Flag this battery for warranty return or service"
    },
    RETURNED: {
        label: "Mark as Returned",
        icon: RotateCcw,
        color: "amber",
        description: "Battery has been returned for warranty or end-of-life"
    },
    RECYCLED: {
        label: "Mark as Recycled",
        icon: Recycle,
        color: "purple",
        description: "Battery has been processed by a certified recycler"
    },
    RECALLED: {
        label: "Mark as Recalled",
        icon: AlertCircle,
        color: "red",
        description: "Battery has been recalled for safety or quality issues"
    },
}

export default function PassportActionPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const token = searchParams.get("token")
    const passportId = params.uuid as string

    const [loading, setLoading] = useState(true)
    const [info, setInfo] = useState<PassportInfo | null>(null)
    const [error, setError] = useState("")
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
    const [metadata, setMetadata] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [pointsAwarded, setPointsAwarded] = useState(0)
    const [partnerCode, setPartnerCode] = useState("")

    useEffect(() => {
        if (!token) {
            setError("No authentication token provided. Please request a new magic link.")
            setLoading(false)
            return
        }

        const fetchInfo = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
                const response = await fetch(`${apiUrl}/passport/${passportId}/action-info?token=${token}`)

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Failed to verify magic link")
                }

                const data = await response.json()
                setInfo(data)
            } catch (err: any) {
                setError(err.message || "Invalid or expired magic link")
            } finally {
                setLoading(false)
            }
        }

        fetchInfo()
    }, [passportId, token])

    const handleTransition = async () => {
        if (!selectedStatus || !token) return

        // Check if UNVERIFIED user needs partner code
        if (info?.actor?.role === "UNVERIFIED" && !partnerCode.trim()) {
            setError("Partner code is required for unverified accounts")
            return
        }

        setSubmitting(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

            // Build payload with optional partner_code
            const payload: any = {
                to_status: selectedStatus,
                metadata: metadata
            }
            if (partnerCode.trim()) {
                payload.partner_code = partnerCode.trim()
            }

            const response = await fetch(`${apiUrl}/passport/${passportId}/transition`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Transition failed")
            }

            // Capture points awarded from response
            if (data.points_awarded) {
                setPointsAwarded(data.points_awarded)
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || "Failed to update status")
        } finally {
            setSubmitting(false)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
                    <p className="text-slate-400">Verifying your access...</p>
                </motion.div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8 text-center"
                >
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push(`/p/${passportId}`)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Back to Passport
                    </button>
                </motion.div>
            </div>
        )
    }

    // Success state
    if (success) {
        const config = STATUS_CONFIG[selectedStatus || ""] || { color: "emerald", icon: CheckCircle }

        // Trigger confetti
        import('canvas-confetti').then((confetti) => {
            confetti.default({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#f59e0b']
            })
        })

        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-8 text-center"
                >
                    <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Status Updated!</h2>
                    <p className="text-slate-400 mb-2">
                        Battery status changed to <span className="text-emerald-400 font-semibold">{config.label}</span>
                    </p>
                    <p className="text-slate-500 text-sm mb-4">
                        This action has been recorded to the audit trail.
                    </p>

                    {/* Gamification Reward Display */}
                    {pointsAwarded > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Trophy className="w-8 h-8 text-amber-500" />
                                <div className="text-left">
                                    <h3 className="font-bold text-amber-400 text-lg">Warranty Registered! +{pointsAwarded} Partner Points</h3>
                                    <p className="text-sm text-amber-600/80">Battery Installed! Warranty Activated.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <button
                        onClick={() => router.push(`/p/${passportId}`)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                    >
                        View Updated Passport
                    </button>
                </motion.div>
            </div>
        )
    }

    // Main action selection
    return (
        <div className="min-h-screen bg-slate-950 py-8 px-4">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Shield className="h-6 w-6 text-emerald-400" />
                        <span className="text-slate-400 text-sm">Authenticated Action</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Update Battery Status</h1>
                    <p className="text-slate-500">
                        Serial: <code className="text-slate-400">{info?.passport?.serial_number}</code>
                    </p>
                </motion.div>

                {/* Actor Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-800 p-4 mb-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-white font-medium">{info?.actor?.email}</p>
                            <p className="text-slate-500 text-sm flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {info?.actor?.role}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Current Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-800 p-4 mb-6"
                >
                    <p className="text-slate-500 text-sm mb-1">Current Status</p>
                    <p className="text-lg font-semibold text-white">{info?.passport?.status}</p>
                </motion.div>

                {/* Available Transitions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                >
                    <p className="text-slate-400 text-sm mb-3">Select new status:</p>
                    <div className="space-y-3">
                        {info?.allowed_transitions?.map((status) => {
                            const config = STATUS_CONFIG[status] || {
                                label: status,
                                icon: ArrowRight,
                                color: "slate",
                                description: ""
                            }
                            const Icon = config.icon
                            const isSelected = selectedStatus === status

                            return (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`w-full p-4 rounded-xl border transition-all text-left ${isSelected
                                        ? `bg-${config.color}-500/10 border-${config.color}-500/50`
                                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg bg-${config.color}-500/10 flex items-center justify-center`}>
                                            <Icon className={`h-5 w-5 text-${config.color}-400`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{config.label}</p>
                                            <p className="text-slate-500 text-sm">{config.description}</p>
                                        </div>
                                        {isSelected && (
                                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Metadata Input */}
                {selectedStatus && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-800 p-4 mb-6"
                    >
                        <p className="text-slate-400 text-sm mb-3">Additional Details (Optional)</p>

                        {selectedStatus === "IN_SERVICE" && (
                            <input
                                type="text"
                                placeholder="Vehicle VIN or Device ID"
                                value={metadata.vehicle_vin || ""}
                                onChange={(e) => setMetadata({ ...metadata, vehicle_vin: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        )}

                        {selectedStatus === "SHIPPED" && (
                            <input
                                type="text"
                                placeholder="Tracking Number / AWB"
                                value={metadata.tracking_number || ""}
                                onChange={(e) => setMetadata({ ...metadata, tracking_number: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        )}

                        {selectedStatus === "RETURN_REQUESTED" && (
                            <input
                                type="text"
                                placeholder="Reason (e.g. Warranty, Defect, End of Life)"
                                value={metadata.return_reason || ""}
                                onChange={(e) => setMetadata({ ...metadata, return_reason: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        )}

                        {selectedStatus === "RETURNED" && (
                            <input
                                type="text"
                                placeholder="Return Reason"
                                value={metadata.return_reason || ""}
                                onChange={(e) => setMetadata({ ...metadata, return_reason: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        )}

                        {selectedStatus === "RECYCLED" && (
                            <input
                                type="text"
                                placeholder="Recycling Certificate Number"
                                value={metadata.recycling_cert || ""}
                                onChange={(e) => setMetadata({ ...metadata, recycling_cert: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        )}

                        {/* Partner Code Gate for UNVERIFIED users */}
                        {info?.actor?.role === "UNVERIFIED" && (
                            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                <p className="text-amber-400 text-sm mb-3 flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Public email detected. Please enter your shop&apos;s partner code.
                                </p>
                                <input
                                    type="text"
                                    placeholder="Enter Partner Access Code"
                                    value={partnerCode}
                                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-amber-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono uppercase"
                                />
                            </div>
                        )}

                        <textarea
                            placeholder="Additional notes..."
                            value={metadata.notes || ""}
                            onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
                            rows={2}
                            className="w-full mt-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                    </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleTransition}
                    disabled={!selectedStatus || submitting}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${selectedStatus
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-slate-800 cursor-not-allowed"
                        }`}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>
                            Confirm Status Update
                            <ArrowRight className="h-5 w-5" />
                        </>
                    )}
                </motion.button>

                {/* Cancel */}
                <button
                    onClick={() => router.push(`/p/${passportId}`)}
                    className="w-full mt-3 py-3 text-slate-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
