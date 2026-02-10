"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-white pt-32 pb-32 min-h-[85vh] flex items-center border-b border-slate-200">
            {/* Subtle background pattern */}
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(11,31,59,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,31,59,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"
            />

            <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-center gap-2 mb-8"
                    >
                        <span className="inline-flex items-center gap-2 px-5 py-2 bg-[#1F7A5F]/10 border border-[#1F7A5F]/20 rounded-full">
                            <span className="text-xs font-medium text-[#0B1F3B]">Regulatory Compliance Infrastructure</span>
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-[#0B1F3B] leading-[1.1]"
                    >
                        Battery Passports,
                        <span className="block text-[#1F7A5F]">
                            Built for Enforcement.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 text-lg sm:text-xl text-slate-600 max-w-[55ch] mx-auto leading-relaxed"
                    >
                        ExportLens delivers audit-grade passports for EU and India with lifecycle evidence, immutable
                        records, and regulator-ready compliance by default.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-10 flex flex-wrap items-center justify-center gap-5"
                    >
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center bg-[#0B1F3B] px-10 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1F7A5F]"
                        >
                            Book a Demo
                        </Link>
                        <Link
                            href="/docs"
                            className="inline-flex items-center justify-center px-10 py-4 text-sm font-semibold text-[#0B1F3B] border border-[#0B1F3B] transition-all duration-200 hover:bg-[#0B1F3B] hover:text-white"
                        >
                            Read Documentation
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="mt-16 flex items-center justify-center gap-6 text-xs text-slate-500"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#0B1F3B]" />
                            <span className="font-mono">EU Battery Regulation (2023/1542)</span>
                        </div>
                        <div className="h-4 w-px bg-slate-300" />
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#1F7A5F]" />
                            <span className="font-mono">India Battery Aadhaar</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
