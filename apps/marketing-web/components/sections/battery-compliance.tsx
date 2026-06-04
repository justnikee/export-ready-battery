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
    <section className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[28px] sm:text-[36px] font-light leading-[1.12] text-[#0d253d]">
              February 2027. The Deadline That Won&apos;t Move.
            </h2>
            <p className="mt-4 text-[16px] leading-[1.55] text-[#64748d]">
              The EU Battery Passport becomes mandatory on 18 February 2027.
              Batteries without a valid passport cannot legally enter the EU
              market. Your European buyers will demand upstream compliance
              documentation before placing purchase orders.
            </p>
            <p className="mt-4 text-[16px] leading-[1.55] text-[#64748d]">
              <span className="text-[#0d253d] font-medium">
                Anviora Battery ensures you&apos;re ready — not scrambling.
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e3e8ee]" />
            {timeline.map((item, i) => (
              <div key={item.date} className="relative flex items-start gap-4 py-3">
                <div
                  className={`relative z-[1] w-[15px] h-[15px] rounded-full mt-0.5 shrink-0 ${
                    item.danger
                      ? "bg-[#ea2261] ring-4 ring-[rgba(234,34,97,0.2)]"
                      : "bg-[#e3e8ee]"
                  }`}
                />
                <div>
                  <div
                    className={`text-[13px] font-medium ${
                      item.danger ? "text-[#ea2261]" : "text-[#0d253d]"
                    }`}
                  >
                    {item.date}
                  </div>
                  <div className="text-[13px] text-[#64748d]">{item.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
