"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { CertificateView } from "@/components/passport/certificate-view"
import { RequestMagicLinkModal } from "@/components/passport/request-magic-link-modal"
import { AlertCircle, Loader2, CheckCircle, Download, Wrench } from "lucide-react"

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
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="h-10 w-10 text-slate-600 animate-spin" />
                    <div className="text-center">
                        <p className="text-slate-900 font-semibold text-lg">Verifying Battery Passport</p>
                        <p className="text-slate-500 text-sm mt-1">Loading official records...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-slate-200 p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
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
        <div className="min-h-screen bg-slate-100 pb-24 md:pb-8">
            {/* Official Header Bar */}
            <header className="w-full bg-white border-b border-slate-200 py-3 px-4 md:px-8 sticky top-0 z-20 shadow-sm print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                            <span className="font-bold text-sm">ER</span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-slate-900 font-bold text-sm tracking-tight">EXPORTREADY</p>
                            <p className="text-slate-500 text-xs">Battery Passport Registry</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Download PDF Button */}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg border border-slate-200 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download PDF</span>
                        </button>

                        {/* Desktop CTA */}
                        <button
                            onClick={() => setShowActionModal(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
                        >
                            <Wrench className="h-4 w-4" />
                            Install & Register Warranty
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - The "Paper" */}
            <main className="px-4 md:px-6 pt-6 md:pt-8">
                <div className="max-w-4xl mx-auto">
                    {/* The Certificate Paper */}
                    <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-0">
                        <CertificateView passport={passport} />
                    </div>
                </div>
            </main>

            {/* Mobile Sticky CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 md:hidden z-30 shadow-lg print:hidden">
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        PDF
                    </button>
                    <button
                        onClick={() => setShowActionModal(true)}
                        className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Wrench className="h-4 w-4" />
                        Install & Register Warranty
                    </button>
                </div>
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
