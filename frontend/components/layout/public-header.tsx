"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Battery, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import clsx from "clsx"
import { useState } from "react"

export function PublicHeader() {
    const pathname = usePathname()
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/onboarding"
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    if (isAuthPage) return null

    return (
        <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-1.5 rounded-lg shadow-lg shadow-purple-500/25">
                        <Battery className="h-5 w-5" />
                    </div>
                    ExportReady
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Pricing
                    </Link>
                    <Link href="/docs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Documentation
                    </Link>
                    <div className="h-4 w-[1px] bg-zinc-700" />
                    <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Login
                    </Link>
                    <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200 font-semibold">
                        <Link href="/register">Get Started</Link>
                    </Button>
                </nav>

                {/* Mobile Nav Toggle */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-white"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-zinc-900 border-t border-zinc-800 p-4 space-y-4">
                    <Link href="/pricing" className="block text-zinc-300 hover:text-white py-2">Pricing</Link>
                    <Link href="/docs" className="block text-zinc-300 hover:text-white py-2">Documentation</Link>
                    <Link href="/login" className="block text-zinc-300 hover:text-white py-2">Login</Link>
                    <Button asChild className="w-full bg-white text-black">
                        <Link href="/register">Get Started</Link>
                    </Button>
                </div>
            )}
        </header>
    )
}
