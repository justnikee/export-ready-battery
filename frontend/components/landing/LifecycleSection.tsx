"use client"

import { motion } from "framer-motion"

const states = [
    { name: "CREATED", color: "bg-slate-400" },
    { name: "ACTIVE", color: "bg-emerald-600" },
    { name: "SHIPPED", color: "bg-slate-500" },
    { name: "IN_SERVICE", color: "bg-slate-600" },
    { name: "RECYCLED", color: "bg-amber-500" },
    { name: "END_OF_LIFE", color: "bg-slate-400" }
]

export function LifecycleSection() {
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
                            Compliance happens over time - not at creation.
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="hidden md:block absolute left-0 right-0 top-5 h-px bg-slate-200" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {states.map((state, i) => (
                                <div
                                    key={i}
                                    className="rounded-[2px] border border-slate-200 bg-white px-3 py-2.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${state.color}`} />
                                        <span className="text-xs font-mono text-slate-700">{state.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-start mt-8">
                            <div className="flex flex-col items-start">
                                <div className="h-6 w-px bg-slate-200 ml-4" />
                                <div className="h-2 w-2 rounded-full bg-slate-400 ml-3 mt-2" />
                                <div className="mt-4 px-3 py-2 border border-rose-200 bg-rose-50 rounded-[2px]">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                                        <span className="text-xs font-mono text-rose-700">RECALLED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-10 max-w-[60ch] text-sm text-slate-600"
                    >
                        ExportLens enforces this lifecycle at the system level, not through guidelines or best practices.
                    </motion.p>
                </div>
            </div>
        </section>
    )
}
