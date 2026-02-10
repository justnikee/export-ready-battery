"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    Building2, Plus, Trash2, AlertCircle, CheckCircle,
    Loader2, Key, Users, Copy,
    Calendar, Hash
} from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface TrustedPartner {
    id: string
    company_name: string
    email_domain: string
    role: string
    contact_email?: string
    is_active: boolean
    created_at: string
}

interface PartnerCode {
    id: string
    code: string
    role: string
    description?: string
    max_uses?: number
    current_uses: number
    expires_at?: string
    is_active: boolean
    created_at: string
}

interface PartnerCodePayload {
    code: string
    role: string
    description?: string
    max_uses?: number
    expires_at?: string
}

const ROLES = ["TECHNICIAN", "RECYCLER", "LOGISTICS"]

export default function PartnersPage() {
    const [activeTab, setActiveTab] = useState<"trusted" | "codes">("trusted")
    const [pendingDeletePartner, setPendingDeletePartner] = useState<string | null>(null)
    const [pendingDeactivateCode, setPendingDeactivateCode] = useState<string | null>(null)

    // Trusted Partners state
    const [partners, setPartners] = useState<TrustedPartner[]>([])
    const [loadingPartners, setLoadingPartners] = useState(true)
    const [showAddPartner, setShowAddPartner] = useState(false)
    const [newPartner, setNewPartner] = useState({
        company_name: "",
        email_domain: "",
        role: "TECHNICIAN",
        contact_email: ""
    })

    // Partner Codes state
    const [codes, setCodes] = useState<PartnerCode[]>([])
    const [loadingCodes, setLoadingCodes] = useState(true)
    const [showAddCode, setShowAddCode] = useState(false)
    const [newCode, setNewCode] = useState({
        code: "",
        role: "TECHNICIAN",
        description: "",
        max_uses: "",
        expires_at: ""
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token")
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }, [])

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

    // Fetch trusted partners
    const fetchPartners = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/partners/trusted`, {
                headers: getAuthHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setPartners(data.partners || [])
            }
        } catch (err) {
            console.error("Failed to fetch partners", err)
        } finally {
            setLoadingPartners(false)
        }
    }, [apiUrl, getAuthHeaders])

    // Fetch partner codes
    const fetchCodes = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/partners/codes`, {
                headers: getAuthHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setCodes(data.codes || [])
            }
        } catch (err) {
            console.error("Failed to fetch codes", err)
        } finally {
            setLoadingCodes(false)
        }
    }, [apiUrl, getAuthHeaders])

    useEffect(() => {
        fetchPartners()
        fetchCodes()
    }, [fetchCodes, fetchPartners])

    // Add trusted partner
    const handleAddPartner = async () => {
        setSubmitting(true)
        setError("")

        try {
            const response = await fetch(`${apiUrl}/partners/trusted`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(newPartner)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to add partner")
            }

            setSuccess("Trusted partner added successfully!")
            setShowAddPartner(false)
            setNewPartner({ company_name: "", email_domain: "", role: "TECHNICIAN", contact_email: "" })
            fetchPartners()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to add partner")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeletePartner = async (id: string) => {
        setPendingDeletePartner(null)

        try {
            await fetch(`${apiUrl}/partners/trusted/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            })
            fetchPartners()
        } catch (err) {
            console.error("Failed to delete partner", err)
        }
    }

    // Add partner code
    const handleAddCode = async () => {
        setSubmitting(true)
        setError("")

        try {
            const payload: PartnerCodePayload = {
                code: newCode.code.toUpperCase(),
                role: newCode.role,
                description: newCode.description || undefined
            }

            if (newCode.max_uses) {
                payload.max_uses = parseInt(newCode.max_uses)
            }
            if (newCode.expires_at) {
                payload.expires_at = new Date(newCode.expires_at).toISOString()
            }

            const response = await fetch(`${apiUrl}/partners/codes`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create code")
            }

            setSuccess("Partner code created successfully!")
            setShowAddCode(false)
            setNewCode({ code: "", role: "TECHNICIAN", description: "", max_uses: "", expires_at: "" })
            fetchCodes()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create code")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeactivateCode = async (id: string) => {
        setPendingDeactivateCode(null)

        try {
            await fetch(`${apiUrl}/partners/codes/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            })
            fetchCodes()
        } catch (err) {
            console.error("Failed to deactivate code", err)
        }
    }

    // Copy code to clipboard
    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setSuccess(`Code "${code}" copied to clipboard!`)
        setTimeout(() => setSuccess(""), 3000)
    }

    return (
        <>
            <div className="min-h-screen bg-slate-50 p-6 md:p-8 w-full mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Partner Management</h1>
                    <p className="text-slate-500 mt-1">
                        Manage trusted partners and access codes for external users
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                        <button onClick={() => setError("")} className="ml-auto text-red-500 hover:text-red-700">×</button>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3"
                    >
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <p className="text-emerald-700">{success}</p>
                        <button onClick={() => setSuccess("")} className="ml-auto text-emerald-600 hover:text-emerald-700">×</button>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("trusted")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === "trusted"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                    >
                        <Building2 className="h-4 w-4" />
                        Trusted Partners (Tier A)
                    </button>
                    <button
                        onClick={() => setActiveTab("codes")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === "codes"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                    >
                        <Key className="h-4 w-4" />
                        Partner Codes (Tier B)
                    </button>
                </div>

                {/* Trusted Partners Tab */}
                {activeTab === "trusted" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-700 text-sm">
                                <strong>Tier A:</strong> Any email from trusted domains will be automatically approved for magic link access.
                                Add your partners&apos; corporate email domains here.
                            </p>
                        </div>

                        {/* Add Partner Button */}
                        <button
                            onClick={() => setShowAddPartner(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Trusted Partner
                        </button>

                        {/* Add Partner Form */}
                        {showAddPartner && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                            >
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Trusted Partner</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={newPartner.company_name}
                                            onChange={(e) => setNewPartner({ ...newPartner, company_name: e.target.value })}
                                            placeholder="Green Recycling GmbH"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Email Domain</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                                            <input
                                                type="text"
                                                value={newPartner.email_domain}
                                                onChange={(e) => setNewPartner({ ...newPartner, email_domain: e.target.value.replace("@", "") })}
                                                placeholder="greenrecycler.eu"
                                                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Role</label>
                                        <select
                                            value={newPartner.role}
                                            onChange={(e) => setNewPartner({ ...newPartner, role: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        >
                                            {ROLES.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Contact Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={newPartner.contact_email}
                                            onChange={(e) => setNewPartner({ ...newPartner, contact_email: e.target.value })}
                                            placeholder="contact@greenrecycler.eu"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleAddPartner}
                                        disabled={submitting || !newPartner.company_name || !newPartner.email_domain}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Partner"}
                                    </button>
                                    <button
                                        onClick={() => setShowAddPartner(false)}
                                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Partners List */}
                        {loadingPartners ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                            </div>
                        ) : partners.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No trusted partners yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {partners.map((partner) => (
                                    <div
                                        key={partner.id}
                                        className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-medium">{partner.company_name}</p>
                                                <p className="text-slate-500 text-sm">
                                                    @{partner.email_domain} • {partner.role}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPendingDeletePartner(partner.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Partner Codes Tab */}
                {activeTab === "codes" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {/* Info Box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-700 text-sm">
                                <strong>Tier B:</strong> Partner codes are shared secrets for users without corporate email.
                                Share these codes with freelance mechanics, small recyclers, etc.
                            </p>
                        </div>

                        {/* Add Code Button */}
                        <button
                            onClick={() => setShowAddCode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Partner Code
                        </button>

                        {/* Add Code Form */}
                        {showAddCode && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                            >
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Create Partner Code</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Code</label>
                                        <input
                                            type="text"
                                            value={newCode.code}
                                            onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })}
                                            placeholder="INSTALL-2026"
                                            maxLength={20}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Role</label>
                                        <select
                                            value={newCode.role}
                                            onChange={(e) => setNewCode({ ...newCode, role: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        >
                                            {ROLES.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Description</label>
                                        <input
                                            type="text"
                                            value={newCode.description}
                                            onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                                            placeholder="Q1 2026 Installation Partners"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Max Uses (Optional)</label>
                                        <input
                                            type="number"
                                            value={newCode.max_uses}
                                            onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                                            placeholder="Unlimited"
                                            min="1"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-700 text-sm font-medium mb-1">Expires At (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={newCode.expires_at}
                                            onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleAddCode}
                                        disabled={submitting || !newCode.code}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Code"}
                                    </button>
                                    <button
                                        onClick={() => setShowAddCode(false)}
                                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Codes List */}
                        {loadingCodes ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                            </div>
                        ) : codes.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No partner codes yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {codes.map((code) => {
                                    const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                                    const isMaxed = code.max_uses && code.current_uses >= code.max_uses
                                    const isDisabled = !code.is_active || isExpired || isMaxed

                                    return (
                                        <div
                                            key={code.id}
                                            className={`bg-white rounded-lg border p-4 shadow-sm ${isDisabled ? "border-slate-200 opacity-60" : "border-slate-200"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isDisabled ? "bg-slate-100" : "bg-amber-100"
                                                        }`}>
                                                        <Key className={`h-5 w-5 ${isDisabled ? "text-slate-400" : "text-amber-600"}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-slate-900 font-mono font-semibold">{code.code}</code>
                                                            <button
                                                                onClick={() => copyCode(code.code)}
                                                                className="p-1 text-slate-400 hover:text-slate-700"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <p className="text-slate-500 text-sm">
                                                            {code.role} • {code.description || "No description"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-slate-600 text-sm">
                                                            <Hash className="h-3 w-3 inline mr-1" />
                                                            {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ""} uses
                                                        </p>
                                                        {code.expires_at && (
                                                            <p className="text-slate-500 text-xs">
                                                                <Calendar className="h-3 w-3 inline mr-1" />
                                                                {isExpired ? "Expired" : `Expires ${new Date(code.expires_at).toLocaleDateString()}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {!isDisabled && (
                                                        <button
                                                            onClick={() => setPendingDeactivateCode(code.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={!!pendingDeletePartner}
                onOpenChange={(open) => !open && setPendingDeletePartner(null)}
                title="Remove trusted partner?"
                description="Are you sure you want to remove this trusted partner? They will no longer be able to access the platform."
                confirmText="Remove Partner"
                variant="destructive"
                onConfirm={() => pendingDeletePartner && handleDeletePartner(pendingDeletePartner)}
            />

            <ConfirmDialog
                open={!!pendingDeactivateCode}
                onOpenChange={(open) => !open && setPendingDeactivateCode(null)}
                title="Deactivate partner code?"
                description="Are you sure you want to deactivate this partner code? It will no longer be usable."
                confirmText="Deactivate Code"
                variant="destructive"
                onConfirm={() => pendingDeactivateCode && handleDeactivateCode(pendingDeactivateCode)}
            />
        </>
    )
}
