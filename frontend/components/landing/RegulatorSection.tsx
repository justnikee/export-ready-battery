"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const indiaChecks = [
    "Valid EPR registration",
    "Batch-level DVA calculation",
    "Import & customs linkage",
    "Recycler EPR proof",
    "Historical traceability"
]

const euChecks = [
    "State of Health (SoH)",
    "Recycled content percentage",
    "Carbon footprint declaration",
    "Ownership & lifecycle events",
    "Manufacturer responsibility"
]

export function RegulatorSection() {
    return (
        <section className="py-24 bg-white">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12"
                    >
                        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-slate-900">
                            What regulators actually look for
                        </h2>
                    </motion.div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="h-full rounded-[2px] border border-slate-200 bg-white px-6 py-5"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">India Compliance</p>
                            <ul className="mt-4 space-y-2">
                                {indiaChecks.map((item, i) => (
                                    <li key={i} className="text-sm text-slate-600">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.08 }}
                            className="h-full rounded-[2px] border border-slate-200 bg-white px-6 py-5"
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">EU Compliance</p>
                            <ul className="mt-4 space-y-2">
                                {euChecks.map((item, i) => (
                                    <li key={i} className="text-sm text-slate-600">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-12"
                    >
                        <Link
                            href="/docs"
                            className="inline-flex items-center gap-2 text-sm text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
                        >
                            See how ExportLens enforces this
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
