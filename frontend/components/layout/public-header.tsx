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

 const linkClass = "text-sm font-medium transition-colors hover:text-white"

 return (
 <header
 className="fixed top-0 w-full z-50 border-b"
 style={{
 background: "rgba(8,18,14,0.85)",
 backdropFilter: "blur(20px)",
 WebkitBackdropFilter: "blur(20px)",
 borderColor: "var(--ld-border)",
 }}
 >
 <div className="mx-auto w-full max-w-[1320px] px-6 h-16 flex items-center justify-between">
 <Link href="/" className="flex items-center gap-2 group">
 <BarChart3 className="h-7 w-7" style={{ color: "#0ea371" }} />
 <span className="text-xl tracking-tight text-white">EXPORTLENS</span>
 </Link>

 {/* Desktop Nav */}
 <nav className="hidden md:flex items-center gap-8">
 <Link href="/pricing" className={linkClass} style={{ color: "var(--ld-text-muted)" }}>
 Pricing
 </Link>
 <Link href="/docs" className={linkClass} style={{ color: "var(--ld-text-muted)" }}>
 Documentation
 </Link>
 <div className="h-4 w-px" style={{ background: "var(--ld-border)" }} />
 <Link href="/login" className={linkClass} style={{ color: "var(--ld-text-muted)" }}>
 Login
 </Link>
 <Link
 href="/contact"
 className="inline-flex items-center justify-center px-6 py-2.5 text-sm text-white transition-all duration-200 hover:opacity-90 rounded-[6px]"
 style={{ background: "#006239" }}
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
 className="text-white"
 >
 {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </Button>
 </div>
 </div>

 {/* Mobile Menu */}
 {mobileMenuOpen && (
 <div className="md:hidden border-t" style={{ background: "var(--ld-bg-dark)", borderColor: "var(--ld-border)" }}>
 <div className="mx-auto w-full max-w-[1320px] px-6 py-4 space-y-4">
 <Link href="/pricing" className="block py-2 hover:text-white transition-colors" style={{ color: "var(--ld-text-muted)" }}>Pricing</Link>
 <Link href="/docs" className="block py-2 hover:text-white transition-colors" style={{ color: "var(--ld-text-muted)" }}>Documentation</Link>
 <Link href="/login" className="block py-2 hover:text-white transition-colors" style={{ color: "var(--ld-text-muted)" }}>Login</Link>
 <Link
 href="/contact"
 className="w-full inline-flex items-center justify-center px-6 py-3 text-sm text-white transition-all duration-200 rounded-[6px] hover:opacity-90"
 style={{ background: "#006239" }}
 >
 Book a Demo
 </Link>
 </div>
 </div>
 )}
 </header>
 )
}
