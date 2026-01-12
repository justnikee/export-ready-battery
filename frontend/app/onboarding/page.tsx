"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { Building2, Mail, MapPin, ArrowRight, CheckCircle2 } from "lucide-react"

export default function OnboardingPage() {
    const { user, refreshUser } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // We only ask for the missing critical fields initially
    const [formData, setFormData] = useState({
        address: "",
        support_email: "",
        website: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // We include the existing company name to ensure validity with the backend model
            await api.put("/auth/profile", {
                company_name: user?.company_name, // Keep existing name
                ...formData
            })

            // Refresh user context to update state
            await refreshUser()

            // Mark onboarding as completed so user won't be redirected again
            localStorage.setItem('onboarding_completed', 'true')

            // Redirect to dashboard
            router.push("/dashboard")
        } catch (error) {
            console.error("Failed to complete onboarding:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-900/50 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Welcome to ExportReady!</h1>
                    <p className="text-zinc-400 text-lg">
                        Let's set up your manufacturer profile to ensure your battery passports are compliant.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Address Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Manufacturer Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <textarea
                                    required
                                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                                    placeholder="123 Industrial Park, Energy City, Country"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                This location will be displayed on all public battery passports.
                            </p>
                        </div>

                        {/* Support Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Support Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                                    placeholder="support@company.com"
                                    value={formData.support_email}
                                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Website (Optional)
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="url"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                                    placeholder="https://company.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                "Setting up..."
                            ) : (
                                <>
                                    Complete Setup
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
