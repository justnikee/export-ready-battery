"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { PassportView } from "@/components/passport/passport-view"
import { AlertCircle, Shield, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function PublicPassportPage() {
    const params = useParams()
    const [passport, setPassport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchPassport = async () => {
            try {
                const response = await api.get(`/passports/${params.uuid}`)
                setPassport(response.data)
                // Record the scan for analytics (fire and forget)
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

    // Record scan event (fire and forget)
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                {/* Animated background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6 relative z-10"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative h-16 w-16 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-lg">Verifying Passport</p>
                        <p className="text-slate-500 text-sm mt-1">Authenticating digital credentials...</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
                {/* Animated background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full relative z-10"
                >
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                            <AlertCircle className="h-8 w-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-slate-400">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-12">
            {/* Animated background gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-3xl" />
            </div>

            {/* Header / Brand */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full py-8 flex flex-col items-center justify-center"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-lg" />
                        <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                            <span className="font-bold text-lg">ER</span>
                        </div>
                    </div>
                    <span className="text-slate-300 font-semibold tracking-[0.2em] text-sm">EXPORTREADY</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Digital Battery Passport
                </h1>
                <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" />
                    Blockchain-verified authenticity
                </p>
            </motion.header>

            {/* Main Content */}
            <div className="relative z-10 px-4 md:px-6">
                <main className="max-w-2xl mx-auto">
                    <PassportView passport={passport} />
                </main>

                {/* Footer ID */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-8"
                >
                    <p className="text-slate-600 text-xs">
                        Passport ID: <code className="text-slate-500 font-mono">{params.uuid}</code>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
