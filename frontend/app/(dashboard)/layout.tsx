"use client"

import { useAuth } from "@/context/auth-context"
import { TopNav } from "@/components/dashboard/TopNav"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    // Onboarding check - uses DB state only (no localStorage)
    useEffect(() => {
        if (!loading && user) {
            // Only check DB state - no localStorage fallback needed
            if (!user.onboarding_completed) {
                router.push("/onboarding")
            }
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <TopNav />
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    )
}
