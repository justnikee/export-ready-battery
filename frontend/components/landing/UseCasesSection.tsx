"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const useCases = [
  {
    title: "BIS Certification",
    description:
      "Manage IS 16046 certification lifecycle, track R-numbers, and monitor test compliance",
    href: "/compliance",
  },
  {
    title: "EPR Obligations",
    description:
      "Automated tracking of collection targets, recycler certificates, and annual CPCB filings",
    href: "/compliance",
  },
  {
    title: "EU Battery Regulation",
    description:
      "Full 2023/1542 compliance: digital passports, carbon footprint, recycled content tracking",
    href: "/docs/compliance",
  },
  {
    title: "Digital Battery Passports",
    description:
      "Generate unique QR-coded passports with complete lifecycle data for every batch",
    href: "/batches",
  },
  {
    title: "CPCB Export Filing",
    description:
      "One-click Form 3 CSV generation ready for the CPCB EPR portal submission",
    href: "/compliance",
  },
];

export function UseCasesSection() {
  return (
    <section
      className="border-t"
      style={{
        background: "var(--ld-bg-dark)",
        borderColor: "var(--ld-border)",
      }}
    >
      <div className="max-w-[1320px] mx-auto px-6 py-24">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-4 block"
            style={{ color: "var(--ld-accent)" }}
          >
            Use Cases
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Compliance made simple
          </h2>
          <p
            className="text-base max-w-[52ch] mx-auto"
            style={{ color: "var(--ld-text-muted)" }}
          >
            From BIS certification to EU digital passports — every compliance
            workflow your manufacturing line needs, in one platform.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <Link
                href={uc.href}
                className="group flex flex-col h-full rounded-2xl border overflow-hidden transition-colors duration-200 hover:border-zinc-600"
                style={{
                  borderColor: "var(--ld-border)",
                  background: "var(--ld-bg-surface)",
                }}
              >
                {/* Illustration placeholder */}
                <div
                  className={`w-full ${
                    i < 2 ? "h-[220px]" : "h-[180px]"
                  } border-b-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-900/50`}
                >
                  <span className="text-zinc-500 text-sm">
                    {uc.title} Illustration
                  </span>
                </div>

                {/* Text */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-white font-semibold mb-2">{uc.title}</h3>
                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: "var(--ld-text-muted)" }}
                  >
                    {uc.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-medium mt-4 transition-colors group-hover:brightness-125"
                    style={{ color: "var(--ld-accent)" }}
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
