"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function DeveloperSection() {
  return (
    <section
      className="border-t"
      style={{
        background: "var(--ld-bg-dark)",
        borderColor: "var(--ld-border)",
      }}
    >
      <div className="max-w-[1320px] mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest mb-4 block"
              style={{ color: "var(--ld-accent)" }}
            >
              Developers
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Build with ExportReady
            </h2>

            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: "var(--ld-text-muted)" }}
            >
              Integrate compliance directly into your production software.
              ExportReady exposes everything through clean, versioned REST APIs
              — battery passport creation, compliance checks, batch management,
              and document generation.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/docs/api-reference"
                className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:brightness-125"
                style={{ color: "var(--ld-accent)" }}
              >
                API Documentation
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs"
                className="group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:brightness-125"
                style={{ color: "var(--ld-accent)" }}
              >
                Developer Guide
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Right — Code block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                background: "var(--ld-bg-surface)",
                borderColor: "var(--ld-border)",
              }}
            >
              {/* Terminal bar */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{
                  background: "var(--ld-bg-mid)",
                  borderColor: "var(--ld-border)",
                }}
              >
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <span
                  className="ml-2 text-xs font-mono"
                  style={{ color: "var(--ld-text-muted)" }}
                >
                  create-passport.ts
                </span>
              </div>

              <pre
                className="p-6 text-sm font-mono leading-relaxed overflow-x-auto"
                style={{ color: "var(--ld-text-muted)" }}
              >
                <code>
                  <span className="text-zinc-500">
                    {"// Create a battery passport"}
                  </span>
                  {"\n"}
                  <span className="text-blue-300">const</span>
                  <span className="text-white"> passport </span>
                  <span className="text-blue-300">= await</span>
                  <span className="text-white"> client.passports.</span>
                  <span className="text-amber-300">create</span>
                  <span className="text-white">{"({"}</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "var(--ld-accent)" }}>batch_id</span>
                  <span className="text-white">{": "}</span>
                  <span className="text-amber-300">
                    {'"BATCH-2025-001"'}
                  </span>
                  <span className="text-white">,</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "var(--ld-accent)" }}>market</span>
                  <span className="text-white">{": "}</span>
                  <span className="text-amber-300">{'"INDIA"'}</span>
                  <span className="text-white">,</span>
                  {"\n"}
                  {"  "}
                  <span style={{ color: "var(--ld-accent)" }}>specs</span>
                  <span className="text-white">{": {"}</span>
                  {"\n"}
                  {"    "}
                  <span style={{ color: "var(--ld-accent)" }}>chemistry</span>
                  <span className="text-white">{": "}</span>
                  <span className="text-amber-300">{'"Li-ion NMC"'}</span>
                  <span className="text-white">,</span>
                  {"\n"}
                  {"    "}
                  <span style={{ color: "var(--ld-accent)" }}>voltage</span>
                  <span className="text-white">{": "}</span>
                  <span className="text-amber-300">{'"48V"'}</span>
                  <span className="text-white">,</span>
                  {"\n"}
                  {"    "}
                  <span style={{ color: "var(--ld-accent)" }}>capacity</span>
                  <span className="text-white">{": "}</span>
                  <span className="text-amber-300">{'"20Ah"'}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-white">{"}"}</span>
                  {"\n"}
                  <span className="text-white">{"});"}</span>
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
