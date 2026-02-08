"use client"

import { motion } from "framer-motion"

const audiences = [
    {
        title: "Indian battery manufacturers",
        description: "Export-facing. BIS/EPR-compliant. Need EU passport readiness."
    },
    {
        title: "Recyclers and EPR aggregators",
        description: "Need tamper-evident lifecycle records for compliance claims."
    },
    {
        title: "EV OEMs and fleet operators",
        description: "Need consistent, auditable battery data across suppliers."
    }
]

export function AudienceSection() {
    return (
        <section className="py-20 bg-white">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-slate-900">
                            Built for
                        </h2>
                        <p className="mt-3 text-sm text-slate-600 max-w-[60ch]">
                            Manufacturers and operators who ship across regulated markets.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {audiences.map((audience, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="border-t border-slate-200 pt-5"
                            >
                                <h3 className="text-base font-semibold text-slate-900">
                                    {audience.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 max-w-[60ch]">
                                    {audience.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
