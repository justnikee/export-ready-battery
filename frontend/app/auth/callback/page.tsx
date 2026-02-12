"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import { Suspense } from "react"

function CallbackHandler() {
    const searchParams = useSearchParams()
    const { login } = useAuth()
    const loginRef = useRef(login)
    loginRef.current = login
    const [error, setError] = useState<string | null>(null)
    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

        const token = searchParams.get("token")
        const refreshToken = searchParams.get("refresh_token")
        const tenantId = searchParams.get("tenant_id")
        const email = searchParams.get("email")
        const companyName = searchParams.get("company_name") || ""
        const errorParam = searchParams.get("error")

        if (errorParam) {
            setError(errorParam)
            return
        }

        if (!token || !refreshToken || !tenantId || !email) {
            setError("Missing authentication data. Please try again.")
            return
        }

        // Use AuthContext login — sets token, cookie, user state, and navigates
        loginRef.current(token, refreshToken, {
            id: tenantId,
            tenant_id: tenantId,
            email: email,
            company_name: companyName,
        })
    }, [searchParams])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <span className="text-red-600 text-xl">!</span>
                    </div>
                    <h2 className="text-lg font-semibold text-[#0B1F3B]">Authentication Failed</h2>
                    <p className="text-sm text-slate-500 max-w-sm">{error}</p>
                    <a
                        href="/login"
                        className="inline-block mt-2 px-6 py-2 bg-[#0B1F3B] text-white text-sm font-medium hover:bg-[#0B1F3B]/90 transition-colors"
                    >
                        Back to Login
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#1F7A5F] mx-auto" />
                <p className="text-sm text-slate-500">Completing sign-in...</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1F7A5F]" />
                </div>
            }
        >
            <CallbackHandler />
        </Suspense>
    )
}
