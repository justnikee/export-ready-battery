"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

const euFeatures = [
  { label: "EU Battery Regulation (2023/1542)", supported: true },
  { label: "Digital Product Passport (DPP)", supported: true },
  { label: "QR Code & Public Registry", supported: true },
  { label: "Carbon Footprint Declaration", supported: true },
  { label: "EPR Alignment", supported: true },
  { label: "Retroactive Audit Evidence", supported: true },
];

const indiaFeatures = [
  { label: "BPAN / Battery Aadhaar Registration", supported: true },
  { label: "India EPR Portal Integration", supported: true },
  { label: "BIS Certification Tracking", supported: true },
  { label: "PLI Scheme Documentation", supported: true },
  { label: "Extended Producer Responsibility", supported: true },
  { label: "CPCB Reporting Ready", supported: true },
];

function CoverageCard({
  region,
  badge,
  features,
  delay,
}: {
  region: string;
  badge: string;
  features: { label: string; supported: boolean }[];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex-1 min-w-0 rounded-2xl overflow-hidden border"
      style={{
        background: "var(--ld-bg-surface)",
        borderColor: "var(--ld-border)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 border-b flex items-center gap-3"
        style={{ borderColor: "var(--ld-border)" }}
      >
        <span
          className="text-xs px-2 py-1 rounded-md shrink-0"
          style={{
            background: "rgba(14,163,113,0.15)",
            color: "var(--ld-accent)",
            fontFamily: "monospace",
          }}
        >
          {badge}
        </span>
        <h3 className="text-white ">{region}</h3>
        <span
          className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: "rgba(14,163,113,0.15)",
            color: "var(--ld-accent)",
          }}
        >
          Supported
        </span>
      </div>

      {/* Feature list */}
      <ul className="p-6 space-y-3">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-3">
            {f.supported ? (
              <CheckCircle
                className="h-4 w-4 mt-0.5 shrink-0"
                style={{ color: "var(--ld-accent)" }}
              />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
            )}
            <span className="text-sm" style={{ color: "var(--ld-text-muted)" }}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function CoverageSection() {
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border mb-6"
            style={{
              background: "var(--ld-bg-surface)",
              borderColor: "var(--ld-border)",
              color: "var(--ld-accent)",
            }}
          >
            Global Coverage
          </span>
          <h2 className="text-3xl md:text-4xl text-white mb-4">
            Built for EU and India compliance.
          </h2>
          <p
            className="text-base max-w-[52ch] mx-auto"
            style={{ color: "var(--ld-text-muted)" }}
          >
            Battery regulation is accelerating globally. AnvayaLabs is
            architected natively for both markets — not retrofitted.
          </p>
        </motion.div>

        {/* Two coverage panels connected by a divider — no grid */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          <CoverageCard
            region="European Union Coverage"
            badge="EU"
            features={euFeatures}
            delay={0}
          />

          {/* Center decorative divider */}
          <div className="flex md:flex-col items-center justify-center py-6 md:py-0 px-6 shrink-0">
            <div className="hidden md:flex flex-col items-center gap-3 h-full">
              <div
                className="flex-1 w-px"
                style={{ background: "var(--ld-border)" }}
              />
              <span
                className="text-[10px] font-mono rounded-full w-7 h-7 flex items-center justify-center border shrink-0"
                style={{
                  background: "var(--ld-bg-surface)",
                  borderColor: "var(--ld-border)",
                  color: "var(--ld-accent)",
                }}
              >
                +
              </span>
              <div
                className="flex-1 w-px"
                style={{ background: "var(--ld-border)" }}
              />
            </div>
            <div
              className="md:hidden h-px w-full"
              style={{ background: "var(--ld-border)" }}
            />
          </div>

          <CoverageCard
            region="India Coverage"
            badge="IN"
            features={indiaFeatures}
            delay={0.1}
          />
        </div>
      </div>
    </section>
  );
}
