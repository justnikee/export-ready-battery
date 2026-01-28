"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Building2, Mail, MapPin, ArrowRight, ArrowLeft, CheckCircle2,
    Globe, Shield, FileCheck, Sparkles, Zap, Target
} from "lucide-react"

// Step configuration
const STEPS = [
    { id: 1, title: "Company Profile", icon: Building2, description: "Basic information about your organization" },
    { id: 2, title: "Target Markets", icon: Target, description: "Where will you sell batteries?" },
    { id: 3, title: "Compliance Setup", icon: Shield, description: "Regulatory credentials (optional)" },
    { id: 4, title: "All Set!", icon: Sparkles, description: "Review and complete setup" },
]

export default function OnboardingPage() {
    const { user, refreshUser, updateUser } = useAuth()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward

    // Form data across all steps
    const [formData, setFormData] = useState({
        // Step 1: Company Profile
        company_name: "", // Added as fallback
        address: "",
        support_email: "",
        website: "",
        logo_url: "",
        // Step 2: Markets (stored in address or metadata)
        primary_market: "both", // "eu", "india", "both"
        // Step 3: Compliance
        epr_registration_number: "",
        bis_r_number: "",
        iec_code: "",
    })

    // Pre-fill with existing user data
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                company_name: user.company_name || "",
                address: user.address || "",
                support_email: user.support_email || "",
                website: user.website || "",
                logo_url: user.logo_url || "",
                epr_registration_number: user.epr_registration_number || "",
                bis_r_number: user.bis_r_number || "",
                iec_code: user.iec_code || "",
            }))
        }
    }, [user])

    const handleNext = () => {
        if (currentStep < 4) {
            setDirection(1)
            setCurrentStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1)
            setCurrentStep(prev => prev - 1)
        }
    }

    const [error, setError] = useState<string | null>(null)

    const handleComplete = async () => {
        setLoading(true)
        setError(null)

        // Ensure we have a company name
        const companyName = user?.company_name || formData.company_name; // Fallback if we decided to add it to formData

        if (!companyName) {
            setError("Company name is missing. Please refresh the page or contact support.");
            setLoading(false);
            return;
        }

        try {
            console.log("Submitting profile update...", {
                company_name: companyName,
                ...formData
            })

            const response = await api.put("/auth/profile", {
                company_name: companyName,
                address: formData.address,
                support_email: formData.support_email,
                website: formData.website,
                logo_url: formData.logo_url,
                epr_registration_number: formData.epr_registration_number,
                bis_r_number: formData.bis_r_number,
                iec_code: formData.iec_code,
            })

            console.log("Profile update response:", response.data)

            // OPTIMISTIC UPDATE: Update context immediately with local state
            // This prevents the race condition where refreshUser() might be too slow
            if (response.data) {
                updateUser(response.data)
            } else {
                // Fallback: manually set flag if response is somehow empty
                updateUser({ onboarding_completed: true })
            }

            // Trigger background refresh for consistency
            refreshUser()

            router.push("/dashboard")
        } catch (err: any) {
            console.error("Failed to complete onboarding:", err)
            setError(err?.response?.data?.error || err?.message || "Failed to save profile. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Validation for each step
    const isStep1Valid = formData.company_name?.trim() !== "" && formData.address.trim() !== "" && formData.support_email.trim() !== ""
    const isStep2Valid = true // Market selection always valid (has default)
    const isStep3Valid = true // Optional step

    const canProceed = () => {
        switch (currentStep) {
            case 1: return isStep1Valid
            case 2: return isStep2Valid
            case 3: return isStep3Valid
            default: return true
        }
    }

    // Animation variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-2xl space-y-8 relative z-10">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{
                                    scale: currentStep >= step.id ? 1 : 0.8,
                                    backgroundColor: currentStep >= step.id ? "#14b8a6" : "#334155"
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentStep > step.id ? "bg-teal-500" :
                                    currentStep === step.id ? "bg-teal-500 ring-4 ring-teal-500/30" :
                                        "bg-slate-700"
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                    <step.icon className={`w-5 h-5 ${currentStep >= step.id ? "text-white" : "text-slate-400"}`} />
                                )}
                            </motion.div>
                            {index < STEPS.length - 1 && (
                                <div className={`w-12 h-1 mx-1 rounded-full transition-colors ${currentStep > step.id ? "bg-teal-500" : "bg-slate-700"
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step title */}
                <div className="text-center space-y-2">
                    <motion.p
                        key={`step-${currentStep}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-teal-400 text-sm font-medium uppercase tracking-wider"
                    >
                        Step {currentStep} of {STEPS.length}
                    </motion.p>
                    <motion.h1
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-white"
                    >
                        {STEPS[currentStep - 1].title}
                    </motion.h1>
                    <motion.p
                        key={`desc-${currentStep}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-slate-400"
                    >
                        {STEPS[currentStep - 1].description}
                    </motion.p>
                </div>

                {/* Form Card */}
                <motion.div
                    className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden"
                    layout
                >
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* Step 1: Company Profile */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            Company Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full h-12 rounded-xl border border-slate-700 bg-slate-800/50 px-4 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                                placeholder="Acme Corp"
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            Manufacturer Address <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <textarea
                                                required
                                                className="w-full min-h-[100px] rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none"
                                                placeholder="123 Industrial Park, Energy City, Country"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            This will appear on all your battery passports
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            Support Email <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="email"
                                                required
                                                className="w-full h-12 rounded-xl border border-slate-700 bg-slate-800/50 px-4 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                                placeholder="support@company.com"
                                                value={formData.support_email}
                                                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            Website <span className="text-slate-500">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="url"
                                                className="w-full h-12 rounded-xl border border-slate-700 bg-slate-800/50 px-4 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                                placeholder="https://company.com"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Target Markets */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <p className="text-slate-400 text-sm">
                                        Select the markets where you plan to sell your batteries. This helps us show relevant compliance requirements.
                                    </p>

                                    <div className="grid gap-4">
                                        {[
                                            { id: "eu", label: "European Union", desc: "EU Battery Regulation compliant passports", icon: "🇪🇺" },
                                            { id: "india", label: "India", desc: "BWM Rules 2022 & BIS compliant", icon: "🇮🇳" },
                                            { id: "both", label: "Both Markets", desc: "Full compliance for global export", icon: "🌍" },
                                        ].map((market) => (
                                            <motion.button
                                                key={market.id}
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData({ ...formData, primary_market: market.id })}
                                                className={`w-full p-4 rounded-xl border text-left transition-all ${formData.primary_market === market.id
                                                    ? "border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30"
                                                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl">{market.icon}</span>
                                                    <div>
                                                        <p className="font-semibold text-white">{market.label}</p>
                                                        <p className="text-sm text-slate-400">{market.desc}</p>
                                                    </div>
                                                    {formData.primary_market === market.id && (
                                                        <CheckCircle2 className="ml-auto h-6 w-6 text-teal-500" />
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Compliance */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                        <Zap className="h-5 w-5 text-amber-400 shrink-0" />
                                        <p className="text-sm text-amber-200">
                                            These fields are optional. You can add them later in Settings.
                                        </p>
                                    </div>

                                    {(formData.primary_market === "india" || formData.primary_market === "both") && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">
                                                    EPR Registration Number
                                                </label>
                                                <div className="relative">
                                                    <FileCheck className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                    <input
                                                        type="text"
                                                        className="w-full h-12 rounded-xl border border-slate-700 bg-slate-800/50 px-4 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                                        placeholder="EPR-XXXX-XXXX"
                                                        value={formData.epr_registration_number}
                                                        onChange={(e) => setFormData({ ...formData, epr_registration_number: e.target.value })}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">CPCB Extended Producer Responsibility</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-300">
                                                    BIS-R Number
                                                </label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                    <input
                                                        type="text"
                                                        className="w-full h-12 rounded-xl border border-slate-700 bg-slate-800/50 px-4 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                                        placeholder="R-XXXXX"
                                                        value={formData.bis_r_number}
                                                        onChange={(e) => setFormData({ ...formData, bis_r_number: e.target.value })}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">BIS CRS registration (IS 16046)</p>
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">
                                            IEC Code
                                        </label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                            <input
                                                type="text"
                                                className="w-full h-12 rounded-xl border border-slate-700 bg-slate-800/50 px-4 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                                placeholder="XXXXXXXXXX"
                                                value={formData.iec_code}
                                                onChange={(e) => setFormData({ ...formData, iec_code: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">Import Export Code for importers</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div className="text-center py-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-teal-500 to-emerald-500 mb-4"
                                        >
                                            <CheckCircle2 className="w-10 h-10 text-white" />
                                        </motion.div>
                                        <h2 className="text-xl font-semibold text-white">You're all set!</h2>
                                        <p className="text-slate-400 mt-1">Here's a summary of your profile</p>
                                    </div>

                                    <div className="space-y-4 bg-slate-800/50 rounded-xl p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Address</p>
                                                <p className="text-white">{formData.address || "-"}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setDirection(-1); setCurrentStep(1) }}
                                                className="text-teal-400 text-sm hover:underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <div className="border-t border-slate-700" />
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Support Email</p>
                                                <p className="text-white">{formData.support_email || "-"}</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-700" />
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Target Market</p>
                                                <p className="text-white capitalize">{formData.primary_market === "both" ? "EU & India" : formData.primary_market.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        {formData.epr_registration_number && (
                                            <>
                                                <div className="border-t border-slate-700" />
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">EPR Number</p>
                                                    <p className="text-white">{formData.epr_registration_number}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentStep === 1
                                ? "text-slate-600 cursor-not-allowed"
                                : "text-slate-300 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-linear-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold hover:from-teal-400 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Launch Dashboard
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Skip link for optional steps */}
                {currentStep === 3 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-slate-500 text-sm"
                    >
                        Don't have these details?{" "}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="text-teal-400 hover:underline"
                        >
                            Skip for now
                        </button>
                    </motion.p>
                )}

                {/* Error banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
                    >
                        <span>⚠️</span>
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-2 hover:opacity-80">✕</button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
