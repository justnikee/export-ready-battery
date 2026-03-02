"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const features = [
    {
        icon: "code",
        title: "Real-time API",
        blurb: "< 50ms latency",
        description:
            "Synchronous validation of battery specs against evolving regulatory databases with sub-50ms latency. Integrate directly into your production line ERP.",
        detail: [
            "REST + webhooks",
            "OpenAPI 3.1 spec",
            "Rate: 10k req/min",
            "< 50ms p95 latency",
        ],
    },
    {
        icon: "qr_code",
        title: "EU Passport",
        blurb: "QR-verified",
        description:
            "Automated generation of QR codes and digital product passports formatted strictly per EU Battery Regulation 2023/1542 requirements.",
        detail: [
            "Reg. 2023/1542 ready",
            "QR + PDF output",
            "Multilingual support",
            "Immutable versioning",
        ],
    },
    {
        icon: "verified_user",
        title: "BIS Certification",
        blurb: "India market",
        description:
            "Streamlined workflows for Bureau of Indian Standards compliance checks, BIS R-Number validation, and IEC format documentation.",
        detail: [
            "BIS R-Number lookup",
            "IEC 62133 format",
            "EPR alignment",
            "Auto-renewal alerts",
        ],
    },
    {
        icon: "history",
        title: "Audit Logs",
        blurb: "10-year retention",
        description:
            "Immutable record-keeping of all compliance checks, ready for external regulatory audits at any time. Cryptographically signed timestamps.",
        detail: [
            "Cryptographic signing",
            "10-year retention",
            "SFTP + API export",
            "Regulator-ready reports",
        ],
    },
];

export function FeaturesSection() {
    const [active, setActive] = useState(0);
    const f = features[active];

    return (
        <section
            className="py-24 border-b"
            style={{
                background: "var(--ld-bg-dark)",
                borderColor: "var(--ld-border)",
            }}
        >
            <div className="mx-auto w-full max-w-[1320px] px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                            Enterprise-grade validation infrastructure
                        </h2>
                        <p className="mt-3 text-base max-w-[52ch]" style={{ color: "var(--ld-text-muted)" }}>
                            Built for high-volume manufacturers and exporters needing strict regulatory adherence without slowing down production lines.
                        </p>
                    </div>
                    <Link
                        href="/docs"
                        className="shrink-0 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
                        style={{ color: "var(--ld-accent)" }}
                    >
                        View all capabilities
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Tab panel — left tabs, right detail. No grid. */}
                <div className="flex flex-col lg:flex-row gap-0 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--ld-border)" }}>

                    {/* Left: vertical tab list */}
                    <div
                        className="flex lg:flex-col overflow-x-auto lg:overflow-visible shrink-0"
                        style={{
                            background: "var(--ld-bg-surface)",
                            borderRight: "1px solid var(--ld-border)",
                            minWidth: 220,
                        }}
                    >
                        {features.map((feat, i) => (
                            <button
                                key={feat.title}
                                onClick={() => setActive(i)}
                                className="relative flex items-center gap-3 px-6 py-5 text-left transition-all duration-200 hover:bg-white/5 shrink-0 lg:shrink"
                                style={{
                                    borderBottom: "1px solid var(--ld-border)",
                                }}
                            >
                                {/* Active indicator */}
                                {active === i && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                                        style={{ background: "var(--ld-accent)" }}
                                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                    />
                                )}
                                <div
                                    className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                                    style={{
                                        background: active === i ? "rgba(14,163,113,0.18)" : "rgba(14,163,113,0.06)",
                                    }}
                                >
                                    <span
                                        className="material-symbols-outlined text-[16px]"
                                        style={{ color: active === i ? "var(--ld-accent)" : "var(--ld-text-muted)" }}
                                    >
                                        {feat.icon}
                                    </span>
                                </div>
                                <div>
                                    <span
                                        className="block text-sm font-semibold leading-tight"
                                        style={{ color: active === i ? "#fff" : "var(--ld-text-muted)" }}
                                    >
                                        {feat.title}
                                    </span>
                                    <span className="block text-[10px] mt-0.5" style={{ color: "var(--ld-text-muted)" }}>
                                        {feat.blurb}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Right: detail panel */}
                    <div className="flex-1 p-8 lg:p-12" style={{ background: "var(--ld-bg-mid)" }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div
                                    className="h-12 w-12 rounded-xl flex items-center justify-center border mb-6"
                                    style={{
                                        background: "rgba(14,163,113,0.12)",
                                        borderColor: "rgba(14,163,113,0.25)",
                                    }}
                                >
                                    <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--ld-accent)" }}>
                                        {f.icon}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
                                <p className="text-base leading-relaxed mb-8 max-w-[52ch]" style={{ color: "var(--ld-text-muted)" }}>
                                    {f.description}
                                </p>

                                {/* Spec list */}
                                <ul className="flex flex-wrap gap-3">
                                    {f.detail.map((d) => (
                                        <li
                                            key={d}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium"
                                            style={{
                                                background: "var(--ld-bg-surface)",
                                                borderColor: "var(--ld-border)",
                                                color: "var(--ld-text-muted)",
                                            }}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--ld-accent)" }} />
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Anomaly Detection alert bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-4 flex items-center gap-4 rounded-xl border px-6 py-4"
                    style={{
                        background: "var(--ld-bg-surface)",
                        borderColor: "rgba(239,68,68,0.3)",
                    }}
                >
                    <div
                        className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(239,68,68,0.1)" }}
                    >
                        <span className="material-symbols-outlined text-[16px] text-red-400">warning</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-semibold shrink-0" style={{ color: "var(--ld-text-muted)" }}>
                            Anomaly Detection
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
                            High Severity
                        </span>
                        <p className="text-xs truncate" style={{ color: "var(--ld-text-muted)" }}>
                            Batch #9921 exceeds Nickel threshold for EU import (Reg 2023/1542)
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
