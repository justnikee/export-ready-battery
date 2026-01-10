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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-8">
            {/* Mobile-first layout container */}
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative">
                <div className="bg-slate-900 text-white p-6 pb-12 pt-8">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <div className="h-6 w-6 rounded-full border border-white/50 flex items-center justify-center text-xs">ER</div>
                        <span className="text-sm font-medium tracking-wide">EXPORTREADY</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Digital Passport</h1>
                </div>

                <div className="-mt-8 px-6">
                    <PassportView passport={passport} />
                </div>
            </div>
        </div>
    )
}
