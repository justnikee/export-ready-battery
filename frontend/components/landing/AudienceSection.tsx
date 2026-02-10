"use client"

import { motion } from "framer-motion"
import { Factory, Scale, Building2, FileCheck } from "lucide-react"

const audiences = [
    {
        icon: Factory,
        title: "Battery Manufacturers",
        description: "Generate compliant passports at production. Track every unit from cell to shipment.",
        benefit: "Export to EU without document risk"
    },
    {
        icon: Scale,
        title: "Compliance Officers",
        description: "Audit-grade records for EPR, PLI, and Battery Regulation enforcement.",
        benefit: "Regulator-ready at all times"
    },
    {
        icon: Building2,
        title: "OEMs & Integrators",
        description: "Receive batteries with verified provenance. No retrofitting required.",
        benefit: "Seamless supply chain integration"
    },
    {
        icon: FileCheck,
        title: "Recyclers & Collectors",
        description: "Accept batteries with complete history. Simplify end-of-life reporting.",
        benefit: "Full lifecycle visibility"
    }
]

export function AudienceSection() {
    return (
        <section className="py-24 bg-white">
            <div className="mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 text-center"
                >
                    <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#0B1F3B] mb-3">
                        Built for the full battery ecosystem.
                    </h2>
                    <p className="text-sm text-slate-600 max-w-[55ch] mx-auto">
                        From production floor to recycling facility - compliance that follows the battery.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {audiences.map((audience, i) => {
                        const Icon = audience.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="group rounded-xl border border-slate-200 bg-slate-50 p-6 hover:shadow-md hover:border-[#1F7A5F]/30 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#1F7A5F]/10 text-[#1F7A5F] border border-[#1F7A5F]/20 shrink-0">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-[#0B1F3B] mb-1">{audience.title}</h3>
                                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{audience.description}</p>
                                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F7A5F]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#1F7A5F]" />
                                            {audience.benefit}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
