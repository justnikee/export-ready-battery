"use client"

import Link from "next/link"

import { usePathname } from "next/navigation"
import { Menu, X, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function PublicHeader() {
    const pathname = usePathname()
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/onboarding"
    const isHome = pathname === "/"
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    if (isAuthPage) return null

    const linkClass = isHome
        ? "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        : "text-sm font-medium text-zinc-400 hover:text-white transition-colors"

    return (
        <header
            className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b ${isHome ? "bg-white/90 border-slate-200" : "bg-zinc-950/80 border-zinc-800"
                }`}
        >
            <div className="mx-auto w-full max-w-6xl px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <BarChart3 className="h-7 w-7 text-[#1F7A5F]" />
                    <span className={`text-xl font-bold tracking-tight ${isHome ? "text-[#0B1F3B]" : "text-white"}`}>EXPORTLENS</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/pricing" className={linkClass}>
                        Pricing
                    </Link>
                    <Link href="/docs" className={linkClass}>
                        Documentation
                    </Link>
                    <div className={`h-4 w-px ${isHome ? "bg-slate-200" : "bg-zinc-700"}`} />
                    <Link href="/login" className={linkClass}>
                        Login
                    </Link>
                    <Link
                        href="/contact"
                        className={
                            isHome
                                ? "inline-flex items-center justify-center bg-[#0B1F3B] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1F7A5F]"
                                : "inline-flex items-center justify-center bg-white px-6 py-2.5 text-sm font-semibold text-[#0B1F3B] transition-all duration-200 hover:bg-[#1F7A5F] hover:text-white"
                        }
                    >
                        Book a Demo
                    </Link>
                </nav>

                {/* Mobile Nav Toggle */}
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={isHome ? "text-slate-900" : "text-white"}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div
                    className={`md:hidden border-t ${isHome ? "bg-white border-slate-200" : "bg-zinc-950 border-zinc-800"
                        }`}
                >
                    <div className="mx-auto w-full max-w-6xl px-4 py-4 space-y-4">
                        <Link
                            href="/pricing"
                            className={`block py-2 ${isHome ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"}`}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/docs"
                            className={`block py-2 ${isHome ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"}`}
                        >
                            Documentation
                        </Link>
                        <Link
                            href="/login"
                            className={`block py-2 ${isHome ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"}`}
                        >
                            Login
                        </Link>
                        <Link
                            href="/contact"
                            className={`w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-all duration-200 ${isHome ? "bg-[#0B1F3B] text-white hover:bg-[#1F7A5F]" : "bg-white text-[#0B1F3B] hover:bg-[#1F7A5F] hover:text-white"
                                }`}
                        >
                            Book a Demo
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}
