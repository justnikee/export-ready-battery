"use client"

import { motion } from "framer-motion"
import { ChevronRight, AlertTriangle } from "lucide-react"

const states = [
    { key: "IN_PRODUCTION", label: "IN_PRODUCTION", color: "bg-amber-500" },
    { key: "MANUFACTURED", label: "MANUFACTURED", color: "bg-[#0B1F3B]" },
    { key: "IN_STOCK", label: "IN_STOCK", color: "bg-[#1F7A5F]" },
    { key: "SHIPPED", label: "SHIPPED", color: "bg-[#1F7A5F]" },
    { key: "IN_USE", label: "IN_USE", color: "bg-emerald-500" },
    { key: "COLLECTED", label: "COLLECTED", color: "bg-slate-400" },
    { key: "RECYCLED", label: "RECYCLED", color: "bg-slate-600" }
]

export function LifecycleSection() {
    return (
        <section className="py-24 bg-white">
            <div className="mx-auto w-full max-w-6xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-10 text-center"
                >
                    <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#0B1F3B] mb-3">
                        One lifecycle. Zero shortcuts.
                    </h2>
                    <p className="text-sm text-slate-600 max-w-[50ch] mx-auto">
                        The 7 lifecycle states required by EU Battery Regulation, enforced by ExportLens at the system level.
                    </p>
                </motion.div>

                {/* Lifecycle Diagram Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-8"
                >
                    {/* Main lifecycle flow */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        {states.map((state, index) => (
                            <div key={state.key} className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${state.color}`} />
                                        <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-700 whitespace-nowrap">
                                            {state.label}
                                        </span>
                                    </div>
                                </div>
                                {index < states.length - 1 && (
                                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* RECALLED state - special branch */}
                    <div className="mt-6 pt-6 border-t border-dashed border-slate-300">
                        <div className="flex items-center justify-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-rose-400" />
                            <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    <span className="text-[11px] font-mono font-medium text-rose-700">RECALLED</span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500">Can occur from any active state</span>
                        </div>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-8 text-sm text-slate-600 text-center max-w-[60ch] mx-auto"
                >
                    ExportLens enforces this lifecycle at the system level, not through guidelines or best practices.
                </motion.p>
            </div>
        </section>
    )
}
