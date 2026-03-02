"use client";

import { motion } from "framer-motion";

const features = [
    {
        icon: "code",
        title: "Developer-First API",
        description:
            "Integrate directly into your ERP or MES. Webhooks for status changes and instant validation responses.",
    },
    {
        icon: "auto_mode",
        title: "Dynamic Schema Updates",
        description:
            "We monitor global regulations. As laws change, our validation schemas update automatically without code changes.",
    },
    {
        icon: "lock",
        title: "Enterprise Security",
        description:
            "SSO, Role-Based Access Control, and encrypted data at rest and in transit.",
    },
];

export function DeveloperSection() {
    return (
        <section
            className="py-24 border-b"
            style={{
                background: "var(--ld-bg-surface)",
                borderColor: "var(--ld-border)",
            }}
        >
            <div className="mx-auto w-full max-w-[1320px] px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT: Code panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div
                            className="rounded-2xl overflow-hidden border"
                            style={{ borderColor: "var(--ld-border)" }}
                        >
                            {/* Terminal bar */}
                            <div
                                className="flex items-center gap-2 px-4 py-3 border-b"
                                style={{ background: "var(--ld-bg-mid)", borderColor: "var(--ld-border)" }}
                            >
                                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                                <span className="ml-2 text-xs font-mono" style={{ color: "var(--ld-text-muted)" }}>api-request.http</span>
                            </div>
                            <pre
                                className="p-6 text-xs font-mono leading-relaxed overflow-x-auto"
                                style={{ background: "var(--ld-bg-surface)", color: "var(--ld-text-muted)" }}
                            >
                                <code>
                                    <span className="text-blue-300">POST</span>{" "}
                                    <span className="text-white">/v1/passports</span>{"\n"}
                                    <span className="text-blue-300">Authorization</span>
                                    <span className="text-white">: Bearer </span>
                                    <span style={{ color: "var(--ld-accent)" }}>{"{API_KEY}"}</span>
                                    {"\n\n"}
                                    <span className="text-white">{"{"}</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"battery_id"</span>
                                    <span className="text-white">: </span>
                                    <span className="text-amber-300">"CELL-2024-EU-88234"</span>
                                    <span className="text-white">,</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"chemistry"</span>
                                    <span className="text-white">: </span>
                                    <span className="text-amber-300">"NMC"</span>
                                    <span className="text-white">,</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"capacity_kwh"</span>
                                    <span className="text-white">: </span>
                                    <span className="text-blue-300">75.4</span>
                                    <span className="text-white">,</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"market"</span>
                                    <span className="text-white">: </span>
                                    <span className="text-amber-300">["EU", "IN"]</span>{"\n"}
                                    <span className="text-white">{"}"}</span>{"\n\n"}
                                    <span style={{ color: "var(--ld-accent)" }}>{"→ 201 Created"}</span>{"\n"}
                                    <span className="text-white">{"{"}</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"passport_id"</span>
                                    <span className="text-white">: </span>
                                    <span className="text-amber-300">"BP-2024-EU-88234"</span>
                                    <span className="text-white">,</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"qr_url"</span>
                                    <span className="text-white">: </span>
                                    <span className="text-amber-300">"https://passport.exportlens.com/..."</span>
                                    <span className="text-white">,</span>{"\n"}
                                    {"  "}<span style={{ color: "var(--ld-accent)" }}>"compliance"</span>
                                    <span className="text-white">{": { "}</span>
                                    <span className="text-amber-300">"eu"</span>
                                    <span className="text-white">: true, </span>
                                    <span className="text-amber-300">"india"</span>
                                    <span className="text-white">: true {"}"}</span>{"\n"}
                                    <span className="text-white">{"}"}</span>
                                </code>
                            </pre>
                        </div>
                    </motion.div>

                    {/* RIGHT: Features text */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <span
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border mb-6"
                            style={{
                                background: "var(--ld-bg-mid)",
                                borderColor: "var(--ld-border)",
                                color: "var(--ld-accent)",
                            }}
                        >
                            Programmatic Compliance Control
                        </span>

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                            Developer-First API.
                        </h2>
                        <p className="text-base leading-relaxed mb-10" style={{ color: "var(--ld-text-muted)" }}>
                            Integrate battery compliance directly into your production software. ExportLens exposes everything through clean, versioned REST APIs.
                        </p>

                        <div className="space-y-6">
                            {features.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, x: 16 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div
                                        className="inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0"
                                        style={{ background: "rgba(14,163,113,0.12)", color: "var(--ld-accent)" }}
                                    >
                                        <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--ld-accent)" }}>
                                            {f.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                                        <p className="text-sm leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
                                            {f.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
