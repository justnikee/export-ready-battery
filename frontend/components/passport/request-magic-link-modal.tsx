"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
 Truck, Wrench, Recycle, X, XCircle,
 Mail, Loader2, CheckCircle, AlertCircle,
 Key, ArrowRight
} from "lucide-react"
import { createTranslator, type Locale } from "@/lib/i18n/i18n"

interface RequestMagicLinkModalProps {
 passportId: string
 onClose: () => void
 locale?: Locale
 status?: string
}

export function RequestMagicLinkModal({ passportId, onClose, locale = 'en', status }: RequestMagicLinkModalProps) {
 const t = createTranslator(locale)

 const ACTIONS = [
 {
 action: "SHIP",
 label: t("modal_action_ship"),
 icon: Truck,
 color: "blue",
 role: "LOGISTICS"
 },
 {
 action: "INSTALL",
 label: t("modal_action_install"),
 icon: Wrench,
 color: "emerald",
 role: "TECHNICIAN"
 },
 {
 action: "RECYCLE",
 label: t("modal_action_recycle"),
 icon: Recycle,
 color: "purple",
 role: "RECYCLER"
 },
 {
 action: "CLOSE",
 label: t("modal_action_close"),
 icon: XCircle,
 color: "red",
 role: "RECYCLER"
 },
 ]

 // Only show CLOSE action if the battery is already RECYCLED
 const filteredActions = status === "RECYCLED"
 ? ACTIONS
 : ACTIONS.filter(a => a.action !== "CLOSE")

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
 action: selectedAction.action,
 partner_code: partnerCode || undefined
 })
 })

 const data = await response.json()

 if (!response.ok) {
 if (data.requires_code) {
 setRequiresCode(true)
 setShowPartnerCode(true)
 setError(data.error || t("modal_partner_code"))
 } else {
 throw new Error(data.error || "Failed to send magic link")
 }
 return
 }

 setStep("success")
 } catch (err: unknown) {
 const error = err as { message?: string }
 setError(error.message || "Failed to send magic link")
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
 className="bg-background rounded-2xl border border-border w-full max-w-md overflow-hidden"
 >
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h2 className="text-lg text-white">
 {step === "select" && t("modal_select_title")}
 {step === "email" && t("modal_verify_title")}
 {step === "success" && t("modal_success_title")}
 {step === "error" && t("modal_error_title")}
 </h2>
 <button onClick={onClose} className="text-muted-foreground hover:text-white">
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Content */}
 <div className="p-4">
 {/* Step 1: Select Action */}
 {step === "select" && (
 <div className="space-y-3">
 {filteredActions.map((action) => {
 const Icon = action.icon
 return (
 <button
 key={action.action}
 onClick={() => {
 setSelectedAction(action)
 setStep("email")
 }}
 className="w-full p-4 rounded-xl border border-border hover:border-border bg-secondary/50 hover:bg-primary/90 transition-all text-left group"
 >
 <div className="flex items-center gap-3">
 <div className={`h-10 w-10 rounded-lg bg-${action.color}-500/10 flex items-center justify-center`}>
 <Icon className={`h-5 w-5 text-${action.color}-400`} />
 </div>
 <span className="text-white font-medium flex-1">{action.label}</span>
 <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
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
 <label className="block text-muted-foreground text-sm mb-2">{t("modal_your_email")}</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@company.com"
 className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-emerald-500"
 />
 </div>
 <p className="text-muted-foreground text-xs mt-2">
 {t("modal_email_hint")}
 </p>
 </div>

 {/* Partner Code Section */}
 {(showPartnerCode || requiresCode) && (
 <div>
 <label className="block text-muted-foreground text-sm mb-2">
 {t("modal_partner_code")} {requiresCode && <span className="text-red-400">*</span>}
 </label>
 <div className="relative">
 <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
 <input
 type="text"
 value={partnerCode}
 onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
 placeholder="INSTALL-2026"
 className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-emerald-500 font-mono"
 />
 </div>
 </div>
 )}

 {!showPartnerCode && !requiresCode && (
 <div className="pt-2 border-t border-border">
 <button
 onClick={() => setShowPartnerCode(true)}
 className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-2 font-medium transition-colors"
 >
 <Key className="h-4 w-4" />
 {t("modal_have_code")}
 </button>
 <p className="text-muted-foreground text-xs mt-1 ml-6">
 {t("modal_code_hint")}
 </p>
 </div>
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
 className="flex-1 py-3 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors"
 >
 {t("modal_back")}
 </button>
 <button
 onClick={handleSubmit}
 disabled={!email || loading || (requiresCode && !partnerCode)}
 className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500/100 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {loading ? (
 <Loader2 className="h-5 w-5 animate-spin" />
 ) : (
 <>
 {t("modal_send")}
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
 <h3 className="text-xl text-white mb-2">{t("modal_success_heading")}</h3>
 <p className="text-muted-foreground mb-4">
 {t("modal_check_inbox")} <span className="text-white">{email}</span>
 </p>
 <p className="text-muted-foreground text-sm">
 {t("modal_link_expiry")}
 </p>
 <button
 onClick={onClose}
 className="mt-6 px-6 py-3 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors"
 >
 {t("modal_done")}
 </button>
 </div>
 )}

 {/* Error State */}
 {step === "error" && (
 <div className="text-center py-6">
 <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
 <AlertCircle className="h-8 w-8 text-red-400" />
 </div>
 <h3 className="text-xl text-white mb-2">{t("modal_failed_heading")}</h3>
 <p className="text-muted-foreground mb-4">{error}</p>
 <button
 onClick={() => {
 setStep("email")
 setError("")
 }}
 className="px-6 py-3 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors"
 >
 {t("modal_try_again")}
 </button>
 </div>
 )}
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>
 )
}
