"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Battery, LayoutDashboard, FileText, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading, logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/admin/blog")
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex bg-slate-950 text-slate-100">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col">
                <div className="p-6">
                    <Link href="/admin/blog" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Battery className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-white text-lg">Admin Console</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link href="/admin/blog" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <FileText className="h-5 w-5" />
                        <span>Blog Posts</span>
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Back to App</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
                        onClick={logout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
