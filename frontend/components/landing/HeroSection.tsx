"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-white pt-28 pb-20 border-b border-slate-200">
            <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:48px_48px]"
            />
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-slate-500"
                    >
                        <span className="h-px w-10 bg-slate-300" />
                        Regulatory Compliance Infrastructure
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-heading font-semibold tracking-tight text-slate-900 leading-[1.05]"
                    >
                        Battery Passports,
                        <span className="block">Built for Enforcement.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 text-base sm:text-lg text-slate-600 max-w-[60ch] mx-auto leading-relaxed"
                    >
                        ExportLens delivers audit-grade passports for EU and India with lifecycle evidence, immutable
                        records, and regulator-ready compliance by default.
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500"
                    >
                        Not a document tool. A compliance system.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-10 flex flex-wrap items-center justify-center gap-4"
                    >
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 rounded-[2px] bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Book a Demo <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/docs"
                            className="text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
                        >
                            Read Documentation
                        </Link>
                        <Link
                            href="/docs/compliance"
                            className="text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
                        >
                            See Compliance Model
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="mt-12 border-t border-slate-200 pt-4 text-xs font-mono uppercase tracking-[0.18em] text-slate-500 text-center"
                    >
                        Coverage: EU Battery Regulation (2023/1542) · India Battery Aadhaar
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
