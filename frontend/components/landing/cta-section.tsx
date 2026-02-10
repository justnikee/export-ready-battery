"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export function CTASection() {
    return (
        <section className="py-24 bg-[#0B1F3B] relative overflow-hidden">

            <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 border border-white/20 rounded-full mb-8">
                        <span className="text-sm text-white/90">Get started in minutes</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-4">
                        Compliance you don&apos;t have to explain.
                    </h2>
                    <p className="text-base md:text-lg text-slate-300 mb-10 max-w-[55ch] mx-auto">
                        Your batteries are already regulated. The only question is whether your data is audit-ready.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-5">
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center bg-[#1F7A5F] px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-white hover:text-[#0B1F3B]"
                        >
                            Book a Demo
                        </Link>
                        <Link
                            href="/docs"
                            className="inline-flex items-center justify-center px-10 py-4 text-base font-semibold text-white border border-white/40 transition-all duration-200 hover:bg-white hover:text-[#0B1F3B]"
                        >
                            Read Documentation
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
