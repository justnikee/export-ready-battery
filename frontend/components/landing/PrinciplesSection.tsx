"use client"

import { motion } from "framer-motion"
import { Layers, Shield, Globe2, Scale } from "lucide-react"

const principles = [
    {
        icon: Layers,
        title: "Lifecycle-first",
        description: "Every battery follows a strict state machine - not editable status tags.",
        accent: "bg-[#0B1F3B]/5 text-[#0B1F3B] border-[#0B1F3B]/10"
    },
    {
        icon: Shield,
        title: "Audit-grade by default",
        description: "All changes are logged, attributed, and preserved as evidence.",
        accent: "bg-[#1F7A5F]/10 text-[#1F7A5F] border-[#1F7A5F]/20"
    },
    {
        icon: Globe2,
        title: "India + EU native",
        description: "Built for BPAN, EPR, BIS, and EU Battery Regulation - not retrofitted.",
        accent: "bg-[#0B1F3B]/5 text-[#0B1F3B] border-[#0B1F3B]/10"
    },
    {
        icon: Scale,
        title: "Enforcement over flexibility",
        description: "If a regulator screenshots it, it holds up.",
        accent: "bg-[#1F7A5F]/10 text-[#1F7A5F] border-[#1F7A5F]/20"
    }
]

export function PrinciplesSection() {
    return (
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 text-center"
                >
                    <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#0B1F3B]">
                        Designed around regulation, not convenience.
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 max-w-[50ch] mx-auto">
                        Core principles that make ExportLens audit-ready from day one.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {principles.map((principle, i) => {
                        const Icon = principle.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="group rounded-lg border border-slate-200 bg-white p-6 transition-all hover:shadow-md hover:border-[#1F7A5F]/30"
                            >
                                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg border ${principle.accent} mb-4`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
                                    {principle.title}
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {principle.description}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
