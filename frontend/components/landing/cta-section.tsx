"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function CTASection() {
    return (
        <section className="py-20 bg-slate-50 border-t border-slate-200">
            <div className="mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl"
                >
                    <h2 className="text-2xl md:text-3xl font-heading font-semibold text-slate-900 mb-3">
                        Compliance you don&apos;t have to explain.
                    </h2>
                    <p className="text-sm text-slate-600 mb-8 max-w-[60ch]">
                        Your batteries are already regulated. The only question is whether your data is audit-ready.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
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
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
