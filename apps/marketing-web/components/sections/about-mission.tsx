"use client";

import { motion } from "framer-motion";

const NUMBERS = [
  {
    stat: "₹6.73L Cr",
    label: "India's battery market by 2031",
    sub: "17.6% CAGR — the fastest-growing segment in Indian manufacturing",
  },
  {
    stat: "18 Feb 2027",
    label: "EU Battery Passport becomes mandatory",
    sub: "No passport = no EU market. Affects every LFP, NMC, and lead-acid battery",
  },
  {
    stat: "₹3L+",
    label: "What one compliance consultant charges",
    sub: "For advice alone — not software, not automation, not ongoing monitoring",
  },
  {
    stat: "1",
    label: "Dataset for both India and EU",
    sub: "Enter data once in Anviora. Satisfy BIS, CPCB, DGFT, and EU regulators simultaneously",
  },
];

export default function AboutMission() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1232px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-start">
          {/* Left: narrative */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
              Our mission
            </div>
            <h2 className="font-serif text-[clamp(30px,4vw,48px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink mb-6">
              Give every Indian manufacturer the same regulatory firepower as a Fortune 500.
            </h2>
            <div className="grid gap-5 text-[16px] leading-[1.7] text-[#131313]">
              <p>
                A 50-person factory in Pune shouldn&apos;t need to hire a compliance team
                to export to Europe. But that&apos;s the reality for thousands of manufacturers
                today — EU Battery Regulation 2023/1542 is 200+ pages of technical
                requirements, with delegated acts still being added.
              </p>
              <p>
                We built Anviora to invert that. Upload your existing certificates — BIS,
                UN38.3, EPR registration, IEC 62133. Our platform reads them, maps the data,
                validates against live regulations, and issues a W3C Verifiable Credential
                with a BPAN V2 serial and QR code your buyer scans in ten seconds.
              </p>
              <p>
                The same data that satisfies EU buyers also handles your BIS renewal reminders,
                CPCB EPR filings, DGFT TRACE claims, and India Customs traceability
                requirements. One record. Two regulators. Zero scramble.
              </p>
            </div>
          </motion.div>

          {/* Right: numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {NUMBERS.map((n, i) => (
              <motion.div
                key={n.stat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-6 rounded-3xl bg-paper transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="font-serif text-[clamp(22px,2.8vw,34px)] font-semibold tracking-[-0.02em] text-crew-ink mb-1 leading-tight">
                  {n.stat}
                </div>
                <div className="text-[14px] font-semibold text-crew-ink mb-2">{n.label}</div>
                <div className="text-[13px] leading-[1.5] text-crew-muted">{n.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
