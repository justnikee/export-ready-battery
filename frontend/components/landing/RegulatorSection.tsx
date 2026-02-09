"use client"

import { motion } from "framer-motion"
import { Globe, FileCheck, ScanLine, History } from "lucide-react"

const features = [
    {
        icon: Globe,
        title: "Live Data Access",
        description: "Regulators retrieve real-time lifecycle data via authenticated QR or secure API endpoints."
    },
    {
        icon: FileCheck,
        title: "Pre-validated Records",
        description: "Every field is validated before ingestion - regulators see compliant data, not error-prone exports."
    },
    {
        icon: ScanLine,
        title: "Tamper Awareness",
        description: "Each record has a provenance signature. Alterations are logged, visible, and permanent."
    },
    {
        icon: History,
        title: "Full Audit Trail",
        description: "All state changes, user actions, and events are retained for complete regulator transparency."
    }
]

export function RegulatorSection() {
    return (
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#0B1F3B] mb-3">
                            Built for regulator inspection.
                        </h2>
                        <p className="text-sm text-slate-600 max-w-[55ch] mx-auto">
                            Every passport is designed to be directly inspected by EU and India authorities - no formatting, no exports.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {features.map((feature, i) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="group bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md hover:border-[#1F7A5F]/30 transition-all"
                            >
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B1F3B]/5 border border-[#0B1F3B]/10 text-[#0B1F3B] mb-4">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-semibold text-[#0B1F3B] mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
