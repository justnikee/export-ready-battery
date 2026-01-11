"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Battery } from "lucide-react"
import { Button } from "@/components/ui/button"
import clsx from "clsx"

export function PublicHeader() {
    const pathname = usePathname()
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/onboarding"

    if (isAuthPage) return null

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                        <Battery className="h-5 w-5" />
                    </div>
                    ExportReady
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Pricing
                    </Link>
                    <Link href="/docs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Documentation
                    </Link>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Login
                    </Link>
                    <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                        <Link href="/onboarding">Get Started</Link>
                    </Button>
                </nav>

                {/* Mobile Nav Toggle (Simplified for now) */}
                <div className="md:hidden">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}
