"use client";

import { motion } from "framer-motion";

const timeline = [
  { date: "Aug 2024", label: "CE marking mandatory on ALL batteries", current: false },
  { date: "Feb 2025", label: "Carbon footprint declaration (EV batteries)", current: false },
  { date: "Feb 2026", label: "Carbon footprint expands to industrial >2kWh", current: false },
  { date: "Feb 2027", label: "Battery Passport MANDATORY", current: true, danger: true },
  { date: "Aug 2027", label: "Due diligence obligations active", current: false },
  { date: "Aug 2028", label: "Recycled content disclosure mandatory", current: false },
  { date: "2031", label: "Hard minimum recycled content targets", current: false },
];

export default function BatteryCompliance() {
  return (
    <section className="py-[88px] bg-crew-paper">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink">
              February 2027. The deadline that won&apos;t move.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-[#131313]">
              On 18 February 2027 the EU Battery Passport becomes mandatory — no
              passport, no EU market. Your buyers will ask for upstream proof before
              they place the order.
            </p>
            <p className="mt-4 text-[16px] leading-[1.6] text-crew-ink font-medium">
              Anviora Battery gets you ready instead of scrambling.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-crew-border" />
            {timeline.map((item) => (
              <div key={item.date} className="relative flex items-start gap-4 py-3">
                <div
                  className={`relative z-[1] w-[15px] h-[15px] rounded-full mt-0.5 shrink-0 ${
                    item.danger
                      ? "bg-[#dc2626] ring-4 ring-[rgba(220,38,38,0.18)]"
                      : "bg-crew-border"
                  }`}
                />
                <div>
                  <div
                    className={`text-[13px] font-semibold ${
                      item.danger ? "text-[#dc2626]" : "text-crew-ink"
                    }`}
                  >
                    {item.date}
                  </div>
                  <div className="text-[13px] text-crew-muted">{item.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
