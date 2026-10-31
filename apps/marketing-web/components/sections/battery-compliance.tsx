"use client";

import { motion } from "framer-motion";

const timeline = [
  { date: "18 Feb 2027", label: "Passport for LMT, industrial >2 kWh, EV (Art. 77). QR on all batteries (Art. 13).", current: true, danger: true },
  { date: "18 Feb 2027", label: "Art. 11 removability (portable / LMT) is product design — not a software tick.", current: false },
  { date: "18 Aug 2027", label: "Chapter VII due diligence (Art. 48). Not a Feb 2027 passport field.", current: false },
  { date: "18 Aug 2028", label: "Art. 8 recycled-content documentation (LMT from 2033). Minima 2031 / LMT 2036.", current: false },
  { date: "Art. 7", label: "Carbon clocks wait on Commission acts — calendar dates are not free-standing.", current: false },
];

export default function BatteryCompliance() {
  return (
    <section className="py-20 lg:py-28 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase rounded-none border border-emerald-500/20 mb-5">
              EU MANDATE TIMELINE
            </div>
            <h2 className="font-heading text-text text-[clamp(32px,4.2vw,48px)] font-bold tracking-[-0.035em] leading-[1.08] mb-5 text-balance">
              February 2027. The deadline that won&apos;t move.
            </h2>
            <p className="text-[16px] leading-[1.65] text-text-muted text-pretty mb-4">
              On 18 February 2027 the buyer will ask for a QR-linked record on LMT,
              large industrial, and EV packs. That is identity and a structured page —
              not carbon class and not a CPCB stamp.
            </p>
            <p className="text-[16px] leading-[1.65] text-slate-950 font-semibold">
              Anviora Battery gets you ready instead of scrambling.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-none border border-border bg-white p-7 lg:p-9 shadow-xs"
          >
            <div className="absolute left-[35px] lg:left-[43px] top-10 bottom-10 w-px bg-border" />
            {timeline.map((item) => (
              <div key={item.date} className="relative flex items-start gap-4 py-3.5">
                <div
                  className={`relative z-[1] w-[14px] h-[14px] rounded-none mt-1 shrink-0 ${
                    item.danger
                      ? "bg-red-600 ring-4 ring-red-500/20"
                      : "bg-slate-300 border border-slate-400"
                  }`}
                />
                <div>
                  <div
                    className={`font-mono text-[13px] font-bold ${
                      item.danger ? "text-red-700" : "text-slate-950"
                    }`}
                  >
                    {item.date}
                  </div>
                  <div className={`text-[14px] ${item.danger ? "font-semibold text-slate-950" : "text-text-muted"}`}>{item.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
