"use client"

import { motion } from "framer-motion"

const principles = [
    {
        title: "Lifecycle-first",
        description: "Every battery follows a strict state machine - not editable status tags."
    },
    {
        title: "Audit-grade by default",
        description: "All changes are logged, attributed, and preserved as evidence."
    },
    {
        title: "India + EU native",
        description: "Built for BPAN, EPR, BIS, and EU Battery Regulation - not retrofitted."
    },
    {
        title: "Enforcement over flexibility",
        description: "If a regulator screenshots it, it holds up."
    }
]

export function PrinciplesSection() {
    return (
        <section className="py-20 bg-slate-50 border-y border-slate-200">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-slate-900">
                            Designed around regulation, not convenience.
                        </h2>
                    </motion.div>

                    <div className="space-y-5">
                        {principles.map((principle, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="rounded-[2px] border border-slate-200 bg-white px-6 py-5"
                            >
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    {principle.title}
                                </p>
                                <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-[62ch]">
                                    {principle.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
