"use client";

import { motion } from "framer-motion";
import { FileWarning, FileCheck2 } from "lucide-react";

const beforeDocs = [
  { name: "GOTS_cert_final_v3.pdf", where: "Email attachment" },
  { name: "REACH SVHC list.xlsx", where: "Someone's desktop" },
  { name: "OEKO-TEX 2024.pdf", where: "WhatsApp forward" },
  { name: "Dye lot register", where: "Paper ledger" },
];

const afterRows = [
  { name: "GOTS — 40 SKUs linked", status: "Valid to Aug 2027" },
  { name: "REACH — SVHC screened", status: "Compliant" },
  { name: "OEKO-TEX Standard 100", status: "Renewal in 90 days" },
  { name: "Dye lots — DL-2200…2261", status: "Traced to SKU" },
];

export default function TextileChallenge() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink text-balance">
              40 SKUs. 12 certificates. One audit.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-[#131313] text-pretty">
              Textile exporters manage BIS certificates, EU REACH compliance,
              OEKO-TEX documentation, and sustainability reports across dozens of
              SKUs. Every audit is a scramble through spreadsheets and email threads.
            </p>
            <p className="mt-4 text-[16px] leading-[1.6] text-crew-ink font-medium">
              Anviora Textile turns that chaos into a single source of truth.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before — scattered */}
            <div className="rounded-[28px] bg-[#fdece9] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileWarning size={14} className="text-[#dc2626]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#dc2626]">
                  Before
                </span>
              </div>
              <div className="grid gap-2">
                {beforeDocs.map((d, i) => (
                  <div
                    key={d.name}
                    className="rounded-xl bg-white/70 px-3 py-2.5"
                    style={{ transform: `rotate(${i % 2 === 0 ? -1.2 : 1.4}deg)` }}
                  >
                    <div className="text-[11.5px] font-medium text-crew-ink truncate">{d.name}</div>
                    <div className="text-[10.5px] text-[#b91c1c]">{d.where}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* After — unified */}
            <div className="rounded-[28px] bg-crew-coral-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck2 size={14} className="text-crew-coral" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-crew-coral">
                  After
                </span>
              </div>
              <div className="grid gap-2">
                {afterRows.map((r) => (
                  <div key={r.name} className="rounded-xl bg-white px-3 py-2.5">
                    <div className="text-[11.5px] font-medium text-crew-ink truncate">{r.name}</div>
                    <div className="text-[10.5px] font-semibold text-crew-coral">{r.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
