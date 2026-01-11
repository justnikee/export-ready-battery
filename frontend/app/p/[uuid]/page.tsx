"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { PassportView } from "@/components/passport/passport-view"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PublicPassportPage() {
    const params = useParams()
    const [passport, setPassport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchPassport = async () => {
            try {
                // Note: Public endpoint doesn't require auth token, but our axios instance might inject it.
                // However, if the user isn't logged in, there's no token, so it works.
                // If logged in, the token is sent, which is fine too.
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

    // Record scan event (fire and forget, don't block page load)
    const recordScan = async (passportId: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/scans/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passport_id: passportId })
            })
        } catch (e) {
            // Silently fail - analytics shouldn't break the page
            console.debug("Scan recording skipped", e)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-200">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 border-t-4 border-slate-900 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-t-4 border-emerald-500 rounded-full animate-spin direction-reverse"></div>
                    </div>
                    <div className="text-slate-500 font-medium animate-pulse">Verifying Passport...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md shadow-lg border-red-200 bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-700 font-semibold text-lg">Verification Failed</AlertTitle>
                    <AlertDescription className="text-red-600 mt-1">{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-slate-950 pb-12">
            {/* Header / Brand */}
            <div className="w-full h-48 bg-gradient-to-b from-emerald-500/10 to-transparent flex flex-col items-center justify-center pt-8 pb-16">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <span className="font-bold text-lg">ER</span>
                    </div>
                    <span className="text-slate-200 font-semibold tracking-widest text-sm">EXPORTREADY</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                    Digital Battery Passport
                </h1>
            </div>

            {/* Main Content Card */}
            <div className="-mt-12 px-4 md:px-6">
                <main className="max-w-xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20 ring-1 ring-black/5">
                    <div className="p-1 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>
                    <div className="p-6 md:p-8">
                        <PassportView passport={passport} />
                    </div>
                </main>

                <div className="text-center mt-8 text-slate-500 text-sm">
                    <p>Secured by ExportReady Blockchain</p>
                    <p className="opacity-50 text-xs mt-1">ID: {params.uuid}</p>
                </div>
            </div>
        </div>
    )
}
