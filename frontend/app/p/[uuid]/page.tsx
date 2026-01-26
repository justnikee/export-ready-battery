"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { CertificateView } from "@/components/passport/certificate-view"
import { RequestMagicLinkModal } from "@/components/passport/request-magic-link-modal"
import { AlertCircle, Shield, Loader2, Wrench, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function PublicPassportPage() {
    const params = useParams()
    const [passport, setPassport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [showActionModal, setShowActionModal] = useState(false)

    useEffect(() => {
        const fetchPassport = async () => {
            try {
                const response = await api.get(`/passports/${params.uuid}`)
                setPassport(response.data)
                recordScan(params.uuid as string)
            } catch (err: any) {
                console.error("Failed to fetch passport", err)
                setError(err.response?.status === 404
                    ? "Passport not found. Please check the URL or QR code."
                    : "Failed to load passport details."
                )
            } finally {
                setLoading(false)
            }
        }
        if (params.uuid) {
            fetchPassport()
        }
    }, [params.uuid])

    const recordScan = async (passportId: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/scans/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passport_id: passportId })
            })
        } catch (e) {
            console.debug("Scan recording skipped", e)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                    <div className="text-center">
                        <p className="text-slate-900 font-semibold text-lg">Verifying Authentic Passport</p>
                        <p className="text-slate-500 text-sm mt-1">Connecting to blockchain ledger...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-red-100 p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-24 md:pb-12 text-white relative overflow-hidden">
            {/* Animated background gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-3xl" />
            </div>

            {/* Header / Brand - Dark Mode */}
            <div className="w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 py-4 px-4 md:px-8 sticky top-0 z-20 shadow-sm print:hidden">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <span className="font-bold text-xs">ER</span>
                        </div>
                        <span className="text-slate-200 font-bold tracking-tight hidden md:inline">EXPORTREADY</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Download PDF Button */}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-white/10 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden sm:inline">Download PDF</span>
                        </button>

                        {/* Desktop CTA */}
                        <button
                            onClick={() => setShowActionModal(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Install & Register Warranty
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 px-4 md:px-6 pt-8">
                <main className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <CertificateView passport={passport} />
                    </motion.div>
                </main>
            </div>

            {/* Mobile Sticky CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/10 md:hidden z-30">
                <button
                    onClick={() => setShowActionModal(true)}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    <CheckCircle className="h-5 w-5" />
                    Install & Register Warranty
                </button>
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <RequestMagicLinkModal
                    passportId={params.uuid as string}
                    onClose={() => setShowActionModal(false)}
                />
            )}
        </div>
    )
}
