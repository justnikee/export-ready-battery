"use client"

import { motion } from "framer-motion"
import { Upload, Cog, Download } from "lucide-react"

const steps = [
    {
        icon: Upload,
        step: "01",
        title: "Ingest Batteries",
        description: "Upload via CSV or integrate through our API. Each battery enters the lifecycle automatically."
    },
    {
        icon: Cog,
        step: "02",
        title: "Track & Enforce",
        description: "System enforces valid state transitions. Every event is logged with timestamp and actor."
    },
    {
        icon: Download,
        step: "03",
        title: "Export & Prove",
        description: "Generate QR codes, PDFs, or API responses ready for EU or India auditors."
    }
]

export function ComplianceFlowSection() {
    return (
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 text-center"
                >
                    <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#0B1F3B] mb-3">
                        Three steps to audit-ready.
                    </h2>
                    <p className="text-sm text-slate-600 max-w-[50ch] mx-auto">
                        From battery intake to regulator-ready passport in minutes.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step, i) => {
                        const Icon = step.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative group"
                            >
                                <div className="bg-white rounded-xl border border-slate-200 p-6 h-full hover:shadow-md hover:border-[#1F7A5F]/30 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#0B1F3B] text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-3xl font-bold text-slate-200 font-mono">{step.step}</span>
                                    </div>
                                    <h3 className="text-base font-semibold text-[#0B1F3B] mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                                </div>
                                {/* {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="h-5 w-5 text-[#1F7A5F]" />
                                    </div>
                                )} */}
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
