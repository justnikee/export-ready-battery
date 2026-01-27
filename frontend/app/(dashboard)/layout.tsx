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

    // Onboarding check - uses DB state (user.onboarding_completed)
    // Auth redirect is handled by middleware.ts
    useEffect(() => {
        if (!loading && user) {
            // Use DB onboarding state, fallback to localStorage for backward compatibility
            const onboardingFromDB = user.onboarding_completed
            const onboardingFromLocal = localStorage.getItem('onboarding_completed')
            const profileIncomplete = !user.address || !user.support_email

            if (profileIncomplete && !onboardingFromDB && !onboardingFromLocal) {
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
