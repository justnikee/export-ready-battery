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

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else {
                // Check if user has already completed onboarding
                const onboardingCompleted = localStorage.getItem('onboarding_completed')
                const profileIncomplete = !user.address || !user.support_email

                // Only redirect to onboarding if:
                // 1. Profile is incomplete AND
                // 2. User hasn't already completed onboarding
                if (profileIncomplete && !onboardingCompleted) {
                    router.push("/onboarding")
                }
            }
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex has-screen items-center justify-center bg-black text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-zinc-100">
            <TopNav />
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    )
}
