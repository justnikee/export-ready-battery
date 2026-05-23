"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const productLinks = [
  { label: "Battery Passport", href: "/battery" },
  { label: "Textile DPP", href: "/textile" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-navy-200/60"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              E
            </div>
            <span
              className={`font-semibold text-sm tracking-tight transition-colors ${
                scrolled ? "text-navy-900" : "text-white"
              }`}
            >
              ExportReady
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* Products dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductOpen(true)}
              onMouseLeave={() => setProductOpen(false)}
            >
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-emerald-500 ${
                  scrolled ? "text-navy-600" : "text-white/70"
                }`}
              >
                Products
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {productOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl border border-navy-200/60 shadow-lg overflow-hidden"
                  >
                    {productLinks.map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        className="block px-4 py-3 text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors"
                      >
                        {p.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-emerald-500 ${
                  scrolled ? "text-navy-600" : "text-white/70"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://app.exportready.io/login"
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-navy-600 hover:text-navy-900" : "text-white/70 hover:text-white"
              }`}
            >
              Sign In
            </a>
            <a
              href="/request-access"
              className="text-sm font-semibold bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Request Access
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-navy-900" : "text-white"
            }`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 bg-white border-b border-navy-200/60 md:hidden"
          >
            <div className="px-6 py-4 space-y-1">
              <p className="px-3 py-2 text-xs font-mono text-navy-400 uppercase tracking-wider">Products</p>
              {productLinks.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {p.label}
                </Link>
              ))}
              <div className="my-2 border-t border-navy-100" />
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-navy-100 flex flex-col gap-2">
                <a className="block px-3 py-2.5 text-sm font-medium text-navy-600">Sign In</a>
                <a
                  href="/request-access"
                  className="block text-center text-sm font-semibold bg-emerald-500 text-white px-4 py-2.5 rounded-lg"
                >
                  Request Access
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
