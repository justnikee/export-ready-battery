"use client"

import { motion } from "framer-motion"

const passportData = {
    serial: "EU-BAT-2024-00142A",
    manufacturer: "Livguard Energy",
    chemistry: "LFP",
    capacity: "280Ah",
    market: "EU",
    lifecycle: "IN_SERVICE",
    events: [
        { event: "MANUFACTURED", date: "2024-01-15", actor: "Livguard" },
        { event: "QC_PASSED", date: "2024-01-18", actor: "Quality Lab" },
        { event: "SHIPPED", date: "2024-01-22", actor: "Logistics" },
        { event: "INSTALLED", date: "2024-02-05", actor: "Installer DE" }
    ]
}

export function PassportProofSection() {
    return (
        <section className="py-24 bg-white">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-slate-900 mb-3">
                            Every passport is proof.
                        </h2>
                        <p className="text-sm text-slate-600">
                            A real ExportLens battery passport, structured for audit review.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white border border-slate-200 overflow-hidden rounded-[2px]"
                    >
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    EU Passport
                                </span>
                                <span className="font-mono text-slate-900 text-sm">{passportData.serial}</span>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-[0.18em] border border-emerald-200">
                                Audit Ready
                            </span>
                        </div>

                        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-200">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">Manufacturer</p>
                                <p className="text-sm text-slate-900">{passportData.manufacturer}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">Chemistry</p>
                                <p className="text-sm text-slate-900">{passportData.chemistry}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">Capacity</p>
                                <p className="text-sm text-slate-900">{passportData.capacity}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">Market</p>
                                <p className="text-sm text-slate-900">{passportData.market}</p>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-3">
                                Lifecycle Events
                            </p>
                            <div className="space-y-2">
                                {passportData.events.map((evt, i) => (
                                    <div key={i} className="flex flex-wrap items-center gap-4 text-sm">
                                        <span className="font-mono text-slate-500 w-28">{evt.date}</span>
                                        <span className="text-slate-700 w-28">{evt.event}</span>
                                        <span className="text-slate-500">{evt.actor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-6 text-sm text-slate-600"
                    >
                        Immutable. Timestamped. Regulator-ready.
                    </motion.p>
                </div>
            </div>
        </section>
    )
}
