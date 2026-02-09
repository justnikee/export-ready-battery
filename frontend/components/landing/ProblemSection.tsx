"use client"

import { motion } from "framer-motion"
import { AlertCircle, XCircle } from "lucide-react"

const bullets = [
    { text: "EU Battery Passports require dynamic lifecycle data, not static PDFs" },
    { text: "India EPR audits are retroactive and evidence-driven" },
    { text: "Deleting or editing records is non-compliant by design" }
]

export function ProblemSection() {
    return (
        <section className="relative bg-white py-24">
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full">
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                            <span className="text-xs font-medium text-rose-700 uppercase tracking-wide">Critical Risk</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-[#0B1F3B] leading-tight">
                            Battery compliance isn&apos;t paperwork.
                            <br />
                            <span className="text-rose-600">It&apos;s legal liability.</span>
                        </h2>

                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[60ch] mx-auto">
                            A single missing field, invalid lifecycle event, or unverifiable QR scan can block exports,
                            fail EU audits, or invalidate PLI claims - even years later.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-10 bg-slate-50 rounded-xl border border-slate-200 p-6 md:p-8 max-w-xl mx-auto"
                    >
                        <div className="space-y-4">
                            {bullets.map((bullet, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                    <p className="text-sm text-slate-700 text-left">{bullet.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
