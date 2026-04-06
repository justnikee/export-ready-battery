"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Briefcase } from "lucide-react"

export default function CareersPage() {
    return (
        <section className="pt-32 pb-24 px-4 bg-white">
            <div className="mx-auto w-full max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-6"
                >
                    <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#0B1F3B]">
                        Careers at ExportReady
                    </h1>
                    <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                        We are building compliance infrastructure for the global battery supply chain.
                        If you want to work on high-stakes systems with real-world impact, we should talk.
                    </p>
                </motion.div>

                {/* Open Roles Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto mb-16"
                >
                    <div className="p-8 rounded-xl border border-zinc-200 bg-zinc-50">
                        <div className="w-10 h-10 rounded-lg bg-[#1F7A5F]/10 flex items-center justify-center mb-4">
                            <Briefcase className="h-5 w-5 text-[#1F7A5F]" />
                        </div>
                        <h2 className="text-xl font-semibold text-[#0B1F3B] mb-2">Open Roles</h2>
                        <p className="text-sm text-zinc-600">
                            We are currently growing our product, engineering, and compliance teams. Send a short intro and
                            your resume to{" "}
                            <a className="text-[#1F7A5F] font-medium hover:underline" href="mailto:careers@exportready.com">
                                careers@exportready.com
                            </a>
                            .
                        </p>
                    </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center bg-[#0B1F3B] px-10 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1F7A5F]"
                    >
                        Contact Recruiting
                    </Link>
                    <Link
                        href="/about"
                        className="inline-flex items-center justify-center px-10 py-4 text-sm font-semibold text-[#0B1F3B] border border-[#0B1F3B] transition-all duration-200 hover:bg-[#0B1F3B] hover:text-white"
                    >
                        Learn About Us
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
