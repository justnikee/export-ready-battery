"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";

const rows = [
  { feature: "Team seats", starter: "2", growth: "10", enterprise: "100" },
  { feature: "Passport credits/mo", starter: "500", growth: "5,000", enterprise: "Custom" },
  { feature: "Product Passports", starter: "Basic", growth: "Full", enterprise: "Full + White-label" },
  { feature: "QR Codes", starter: true, growth: true, enterprise: true },
  { feature: "AI Certificate & Datasheet Parsing", starter: true, growth: true, enterprise: true },
  { feature: "Blockchain Anchoring (Bitcoin)", starter: true, growth: true, enterprise: true },
  { feature: "Compliance Scoring", starter: "Basic", growth: "Full", enterprise: "Full" },
  { feature: "Certificate Alerts", starter: true, growth: true, enterprise: true },
  { feature: "Carbon Calculator", starter: true, growth: true, enterprise: true },
  { feature: "EU Battery Regulation Compliance", starter: false, growth: true, enterprise: true },
  { feature: "Mass Balance Ledger", starter: false, growth: true, enterprise: true },
  { feature: "Fleet Health & BMS Telemetry", starter: false, growth: true, enterprise: true },
  { feature: "Supplier Due Diligence (CMRT)", starter: false, growth: true, enterprise: true },
  { feature: "DGFT Export Claims", starter: false, growth: true, enterprise: true },
  { feature: "API Access", starter: false, growth: true, enterprise: true },
  { feature: "Tally Integration", starter: false, growth: true, enterprise: true },
  { feature: "Support", starter: "Email (48h)", growth: "Priority (24h)", enterprise: "SLA + Phone" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} strokeWidth={2.5} className="text-emerald-700 mx-auto" />;
  if (value === false) return <Minus size={16} className="text-slate-300 mx-auto" />;
  return <span className="text-[13px] font-mono font-medium text-slate-800">{value}</span>;
}

export default function PricingCompare() {
  return (
    <section className="py-16 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-text text-[clamp(28px,3.8vw,42px)] font-bold tracking-[-0.035em] text-center mb-10"
        >
          Feature Comparison
        </motion.h2>

        <p className="sm:hidden text-[12px] font-mono text-text-dim mb-3">Swipe to see all plans →</p>
        <div className="overflow-x-auto border border-border bg-white rounded-none">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="sticky left-0 bg-slate-50 text-left text-[13px] font-mono uppercase tracking-wider font-bold text-slate-900 py-4 px-5">
                  Feature
                </th>
                <th className="text-center text-[13px] font-mono uppercase tracking-wider font-bold text-slate-900 py-4 px-4 w-[140px]">
                  Starter
                </th>
                <th className="text-center text-[13px] font-mono uppercase tracking-wider font-bold text-emerald-950 py-4 px-4 w-[140px] bg-emerald-500/10">
                  Growth
                </th>
                <th className="text-center text-[13px] font-mono uppercase tracking-wider font-bold text-slate-900 py-4 px-4 w-[140px]">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr
                  key={row.feature}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="sticky left-0 bg-white text-[14px] font-medium text-slate-900 py-3.5 px-5 border-r border-border/40">
                    {row.feature}
                  </td>
                  <td className="text-center py-3.5 px-4 border-r border-border/40">
                    <Cell value={row.starter} />
                  </td>
                  <td className="text-center py-3.5 px-4 bg-emerald-500/5 border-r border-border/40">
                    <Cell value={row.growth} />
                  </td>
                  <td className="text-center py-3.5 px-4">
                    <Cell value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
