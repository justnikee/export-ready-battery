"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { Building2, Globe, Mail, MapPin, Image as ImageIcon } from "lucide-react"

export default function SettingsPage() {
    const { user, refreshUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        company_name: "",
        address: "",
        support_email: "",
        website: "",
        logo_url: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                company_name: user.company_name || "",
                address: user.address || "",
                support_email: user.support_email || "",
                website: user.website || "",
                logo_url: user.logo_url || ""
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
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Organization Settings</h2>
                <p className="text-slate-500">Manage your company profile and default passport information.</p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Company Name
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Acme Battery Co."
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Manufacturer Address
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="123 Industrial Park, Energy City, Country"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-slate-500">This address will appear on your battery passports.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Support Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Support Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="support@acme.com"
                                    value={formData.support_email}
                                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Website
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="url"
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="https://acme.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Logo URL
                        </label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="url"
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="https://acme.com/logo.png"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-slate-500">Provide a direct link to your company logo (PNG or SVG recommended).</p>
                    </div>

                    {/* Feedback Message */}
                    {message && (
                        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
