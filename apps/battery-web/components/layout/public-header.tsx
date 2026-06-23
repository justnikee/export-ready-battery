"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PublicHeader() {
  const pathname = usePathname();
  const isProductAppPage = /^\/battery(\/|$)/.test(pathname);
  const isHomePage = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isProductAppPage) return null;

  const linkClass = "text-sm font-medium transition-colors hover:text-gray-900";

  return (
    <header
      className={
        isHomePage
          ? "fixed top-0 w-full z-50 border-b border-white/20 bg-white/5 backdrop-blur-sm"
          : "fixed top-0 w-full z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-330 items-center justify-between px-6">
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo/logo-4.svg"
            className=""
            alt="ANVIORA"
            width={32}
            height={32}
          />
          <span className="text-xl tracking-tight text-gray-900 font-semibold">
            ANVIORA
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/pricing" className={`${linkClass} text-gray-600`}>
            Pricing
          </Link>
          <Link href="/docs" className={`${linkClass} text-gray-600`}>
            Documentation
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <Link href="/login" className={`${linkClass} text-gray-600`}>
            Login
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-gradient-cta-button px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-95"
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
            className={
              isHomePage ? "text-slate-900 hover:bg-white/30" : "text-gray-900"
            }
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="mx-auto w-full max-w-330 space-y-4 px-6 py-4">
            <Link
              href="/pricing"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/login"
              className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-cta-button px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-95"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// Made with Bob
