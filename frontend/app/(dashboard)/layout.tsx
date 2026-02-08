"use client"

import { useAuth } from "@/context/auth-context"
import { DashboardSidebar, useSidebarState } from "@/components/dashboard/DashboardSidebar"
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar"
import { LoadingBar } from "@/components/ui/loading-bar"
import { useEffect, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { clsx } from "clsx"

function LoadingBarWrapper() {
    return (
        <Suspense fallback={null}>
            <LoadingBar />
        </Suspense>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const search = searchParams.toString()
    const sidebar = useSidebarState()

    // Onboarding check - uses DB state only (no localStorage)
    useEffect(() => {
        if (!loading && user) {
            if (!user.onboarding_completed) {
                router.push("/onboarding")
            }
        }
    }, [user, loading, router])

    // Redirect unauthenticated users to login with return path
    useEffect(() => {
        if (!loading && !user) {
            const redirectTo = search ? `${pathname}?${search}` : pathname
            router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`)
        }
    }, [loading, user, router, pathname, search])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
                Redirecting to login...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Loading Bar */}
            <LoadingBarWrapper />

            {/* Sidebar */}
            <DashboardSidebar
                isOpen={sidebar.isOpen}
                onClose={() => sidebar.setIsOpen(false)}
                isCollapsed={sidebar.isCollapsed}
                onToggleCollapse={sidebar.toggleCollapse}
            />

            {/* Main Content Area */}
            <div className={clsx(
                "min-h-screen flex flex-col transition-all duration-300",
                sidebar.isCollapsed ? "md:ml-16" : "md:ml-60"
            )}>
                {/* Top Bar */}
                <DashboardTopBar
                    onMenuClick={sidebar.toggleOpen}
                />

                {/* Page Content */}
                <main className="flex-1 w-full">
                    {children}
                </main>
            </div>
        </div>
    )
}
