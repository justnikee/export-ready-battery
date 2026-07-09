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
  if (value === true) return <Check size={16} className="text-emerald-600 mx-auto" />;
  if (value === false) return <Minus size={16} className="text-[#e3e8ee] mx-auto" />;
  return <span className="text-[13px] text-[#64748d]">{value}</span>;
}

export default function PricingCompare() {
  return (
    <section className="py-[60px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[24px] sm:text-[28px] font-light leading-[1.12] text-[#0d253d] text-center mb-8"
        >
          Feature Comparison
        </motion.h2>

        <p className="sm:hidden text-[12px] text-[#64748d] mb-2">Swipe to see all plans →</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#e3e8ee]">
                <th className="sticky left-0 bg-white text-left text-[13px] font-medium text-[#0d253d] py-3 pr-4">
                  Feature
                </th>
                <th className="text-center text-[13px] font-medium text-[#0d253d] py-3 px-4 w-[140px]">
                  Starter
                </th>
                <th className="text-center text-[13px] font-medium text-[#0d253d] py-3 px-4 w-[140px] bg-[rgba(83,58,253,0.03)]">
                  Growth
                </th>
                <th className="text-center text-[13px] font-medium text-[#0d253d] py-3 px-4 w-[140px]">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className="border-b border-[#e3e8ee] hover:bg-[#f6f9fc] transition-colors"
                >
                  <td className="sticky left-0 bg-white text-[13px] text-[#0d253d] py-3 pr-4">
                    {row.feature}
                  </td>
                  <td className="text-center py-3 px-4">
                    <Cell value={row.starter} />
                  </td>
                  <td className="text-center py-3 px-4 bg-[rgba(83,58,253,0.03)]">
                    <Cell value={row.growth} />
                  </td>
                  <td className="text-center py-3 px-4">
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
