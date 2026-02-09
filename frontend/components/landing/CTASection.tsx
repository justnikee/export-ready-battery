"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Phone } from "lucide-react"

export function CTASection() {
    return (
        <section className="py-24 bg-[#0B1F3B]">
            <div className="mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-white mb-4">
                        Ready to make compliance
                        <span className="block text-[#1F7A5F]">your competitive advantage?</span>
                    </h2>
                    <p className="text-base text-slate-300 max-w-[55ch] mx-auto mb-10">
                        Schedule a demo to see how ExportLens handles battery passports for EU and India regulation.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-5 mb-12">
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center bg-[#1F7A5F] px-10 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-white hover:text-[#0B1F3B]"
                        >
                            Book a Demo
                        </Link>
                        <Link
                            href="/docs"
                            className="inline-flex items-center px-10 py-4 text-sm font-medium text-white border border-white/40 transition-all duration-200 hover:bg-white hover:text-[#0B1F3B]"
                        >
                            Explore Documentation
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400">
                        <a href="mailto:hello@exportlens.com" className="flex items-center gap-2 hover:text-white transition-colors">
                            <Mail className="h-4 w-4" />
                            hello@exportlens.com
                        </a>
                        <span className="hidden sm:block h-4 w-px bg-slate-600" />
                        <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-white transition-colors">
                            <Phone className="h-4 w-4" />
                            +91 98765 43210
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
