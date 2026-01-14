"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { Building2, Globe, Mail, MapPin, Image as ImageIcon, ShieldCheck, FileCheck, FileText } from "lucide-react"

export default function SettingsPage() {
    const { user, refreshUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        company_name: "",
        address: "",
        support_email: "",
        website: "",
        logo_url: "",
        // India Regulatory Fields
        epr_registration_number: "",
        bis_r_number: "",
        iec_code: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                company_name: user.company_name || "",
                address: user.address || "",
                support_email: user.support_email || "",
                website: user.website || "",
                logo_url: user.logo_url || "",
                epr_registration_number: user.epr_registration_number || "",
                bis_r_number: user.bis_r_number || "",
                iec_code: user.iec_code || ""
            })
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            await api.put("/auth/profile", formData)
            await refreshUser()
            setMessage({ type: 'success', text: "Organization profile updated successfully" })
        } catch (error) {
            console.error("Failed to update profile:", error)
            setMessage({ type: 'error', text: "Failed to update profile. Please try again." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl space-y-8 p-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Organization Settings</h2>
                <p className="text-zinc-500">Manage your company profile and default passport information.</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Company Name
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Acme Battery Co."
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Manufacturer Address
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 pl-9 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="123 Industrial Park, Energy City, Country"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-zinc-500">This address will appear on your battery passports.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Support Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Support Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <input
                                    type="email"
                                    className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="support@acme.com"
                                    value={formData.support_email}
                                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Website
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <input
                                    type="url"
                                    className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="https://acme.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Logo URL
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                                type="url"
                                className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="https://acme.com/logo.png"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-zinc-500">Provide a direct link to your company logo (PNG or SVG recommended).</p>
                    </div>

                    {/* India Regulatory Details Section */}
                    <div className="border-t border-zinc-800 pt-6 mt-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                India Regulatory Details (BWM & BIS)
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                Required for compliance with Battery Waste Management Rules 2022 and BIS Safety Standards.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* EPR Registration Number */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-zinc-300">
                                    EPR Registration Number
                                </label>
                                <div className="relative">
                                    <FileCheck className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                                    <input
                                        type="text"
                                        className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="EPR/B/2024/XXXX"
                                        value={formData.epr_registration_number}
                                        onChange={(e) => setFormData({ ...formData, epr_registration_number: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">CPCB Extended Producer Responsibility registration.</p>
                            </div>

                            {/* BIS R-Number */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none text-zinc-300">
                                    BIS R-Number (IS 16046)
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
                                    <input
                                        type="text"
                                        className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="R-12345678"
                                        value={formData.bis_r_number}
                                        onChange={(e) => setFormData({ ...formData, bis_r_number: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500">BIS CRS registration for IS 16046 safety standard.</p>
                            </div>
                        </div>

                        {/* IEC Code */}
                        <div className="space-y-2 mt-6">
                            <label className="text-sm font-medium leading-none text-zinc-300">
                                IEC Code (Import Export Code)
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 pl-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 md:w-1/2"
                                    placeholder="AAACT1234A"
                                    value={formData.iec_code}
                                    onChange={(e) => setFormData({ ...formData, iec_code: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-zinc-500">Required for importers of battery cells.</p>
                        </div>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
