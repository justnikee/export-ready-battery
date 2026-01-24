"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Truck, Wrench, RotateCcw, Recycle, X,
    Mail, Loader2, CheckCircle, AlertCircle,
    Key, ArrowRight
} from "lucide-react"

interface RequestMagicLinkModalProps {
    passportId: string
    onClose: () => void
}

const ACTIONS = [
    {
        status: "SHIPPED",
        label: "I'm shipping this battery",
        icon: Truck,
        color: "blue",
        role: "LOGISTICS"
    },
    {
        status: "IN_SERVICE",
        label: "I'm installing this battery",
        icon: Wrench,
        color: "emerald",
        role: "TECHNICIAN"
    },
    {
        status: "RETURNED",
        label: "I'm returning this battery",
        icon: RotateCcw,
        color: "amber",
        role: "CUSTOMER"
    },
    {
        status: "RECYCLED",
        label: "I'm recycling this battery",
        icon: Recycle,
        color: "purple",
        role: "RECYCLER"
    },
]

export function RequestMagicLinkModal({ passportId, onClose }: RequestMagicLinkModalProps) {
    const [step, setStep] = useState<"select" | "email" | "success" | "error">("select")
    const [selectedAction, setSelectedAction] = useState<typeof ACTIONS[0] | null>(null)
    const [email, setEmail] = useState("")
    const [partnerCode, setPartnerCode] = useState("")
    const [showPartnerCode, setShowPartnerCode] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [requiresCode, setRequiresCode] = useState(false)

    const handleSubmit = async () => {
        if (!selectedAction || !email) return

        setLoading(true)
        setError("")

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
            const response = await fetch(`${apiUrl}/auth/magic-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    passport_id: passportId,
                    email: email,
                    role: selectedAction.role,
                    partner_code: partnerCode || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.requires_code) {
                    setRequiresCode(true)
                    setShowPartnerCode(true)
                    setError(data.error || "Partner code required")
                } else {
                    throw new Error(data.error || "Failed to send magic link")
                }
                return
            }

            setStep("success")
        } catch (err: any) {
            setError(err.message)
            setStep("error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800">
                        <h2 className="text-lg font-semibold text-white">
                            {step === "select" && "What would you like to do?"}
                            {step === "email" && "Verify your identity"}
                            {step === "success" && "Check your email!"}
                            {step === "error" && "Something went wrong"}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {/* Step 1: Select Action */}
                        {step === "select" && (
                            <div className="space-y-3">
                                {ACTIONS.map((action) => {
                                    const Icon = action.icon
                                    return (
                                        <button
                                            key={action.status}
                                            onClick={() => {
                                                setSelectedAction(action)
                                                setStep("email")
                                            }}
                                            className="w-full p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-lg bg-${action.color}-500/10 flex items-center justify-center`}>
                                                    <Icon className={`h-5 w-5 text-${action.color}-400`} />
                                                </div>
                                                <span className="text-white font-medium flex-1">{action.label}</span>
                                                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Step 2: Email Input */}
                        {step === "email" && selectedAction && (
                            <div className="space-y-4">
                                <div className={`p-3 rounded-lg bg-${selectedAction.color}-500/10 border border-${selectedAction.color}-500/20`}>
                                    <div className="flex items-center gap-2">
                                        <selectedAction.icon className={`h-5 w-5 text-${selectedAction.color}-400`} />
                                        <span className={`text-${selectedAction.color}-400 font-medium`}>{selectedAction.label}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Your Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <p className="text-slate-500 text-xs mt-2">
                                        We&apos;ll send a verification link to confirm this action.
                                    </p>
                                </div>

                                {/* Partner Code Section */}
                                {(showPartnerCode || requiresCode) && (
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-2">
                                            Partner Code {requiresCode && <span className="text-red-400">*</span>}
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                            <input
                                                type="text"
                                                value={partnerCode}
                                                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                                                placeholder="INSTALL-2026"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                {!showPartnerCode && !requiresCode && (
                                    <button
                                        onClick={() => setShowPartnerCode(true)}
                                        className="text-slate-400 text-sm hover:text-white flex items-center gap-1"
                                    >
                                        <Key className="h-4 w-4" />
                                        I have a partner code
                                    </button>
                                )}

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setStep("select")
                                            setError("")
                                        }}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!email || loading || (requiresCode && !partnerCode)}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Send Link
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Success State */}
                        {step === "success" && (
                            <div className="text-center py-6">
                                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Magic Link Sent!</h3>
                                <p className="text-slate-400 mb-4">
                                    Check your inbox at <span className="text-white">{email}</span>
                                </p>
                                <p className="text-slate-500 text-sm">
                                    Click the link in the email to verify and complete the action.
                                    The link expires in 1 hour.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}

                        {/* Error State */}
                        {step === "error" && (
                            <div className="text-center py-6">
                                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                    <AlertCircle className="h-8 w-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Request Failed</h3>
                                <p className="text-slate-400 mb-4">{error}</p>
                                <button
                                    onClick={() => {
                                        setStep("email")
                                        setError("")
                                    }}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
