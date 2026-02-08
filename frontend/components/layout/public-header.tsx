"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
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
            className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b ${
                isHome ? "bg-white/90 border-slate-200" : "bg-zinc-950/80 border-zinc-800"
            }`}
        >
            <div className="mx-auto w-full max-w-6xl px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <Image src="/logo/logo.svg" alt="ExportReady" width={140} height={28} className="h-7 w-auto" />
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
                    <Button
                        asChild
                        size="sm"
                        className={
                            isHome
                                ? "bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                                : "bg-white text-slate-900 hover:bg-slate-100 font-semibold"
                        }
                    >
                        <Link href="/contact">Book a Demo</Link>
                    </Button>
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
                    className={`md:hidden border-t ${
                        isHome ? "bg-white border-slate-200" : "bg-zinc-950 border-zinc-800"
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
                        <Button
                            asChild
                            className={`w-full ${
                                isHome ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-slate-900"
                            }`}
                        >
                            <Link href="/contact">Book a Demo</Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    )
}
