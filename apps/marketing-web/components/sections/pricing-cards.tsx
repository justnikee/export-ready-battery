"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    priceDetail: "",
    description: "For first-time exporters",
    features: [
      "1 user",
      "3 batches/month",
      "Basic product passport",
      "QR code generation",
      "Public passport pages",
      "Email support (48h response)",
    ],
    cta: "Start Free",
    href: "#",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹4,999",
    priceDetail: "/mo",
    annualPrice: "₹3,999",
    description: "For growing manufacturers",
    features: [
      "5 users",
      "50 batches/month",
      "AI certificate parsing",
      "Compliance gap analysis",
      "Certificate expiry alerts",
      "Blockchain anchoring",
      "Carbon footprint calculator",
      "Mass balance ledger",
      "Priority support (24h response)",
    ],
    cta: "Start 14-Day Trial",
    href: "#",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceDetail: "",
    description: "For large-scale operations",
    features: [
      "Unlimited users",
      "Unlimited batches",
      "Dedicated account manager",
      "Custom integrations (SAP, Oracle)",
      "SLA + phone support",
      "On-premise deployment option",
      "Audit assistance",
      "White-label passport pages",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

export default function PricingCards() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-10 bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6">
        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span
            className={`text-sm ${!annual ? "text-[#0d253d] font-medium" : "text-[#64748d]"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: annual ? "#533afd" : "#e3e8ee" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: annual ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
          <span
            className={`text-sm ${annual ? "text-[#0d253d] font-medium" : "text-[#64748d]"}`}
          >
            Annual
          </span>
          <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-white border rounded-xl p-6 transition-all duration-200 ${
                plan.highlighted
                  ? "border-[rgba(83,58,253,0.3)] shadow-[rgba(83,58,253,0.08)_0_4px_20px]"
                  : "border-[#e3e8ee]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-6">
                  <span
                    className="text-[11px] font-medium text-white px-2.5 py-1 rounded-full"
                    style={{ background: "#533afd" }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="text-[15px] font-medium text-[#0d253d]">
                {plan.name}
              </h3>
              <p className="text-[12px] text-[#64748d] mt-1">
                {plan.description}
              </p>

              <div className="mt-4 mb-6">
                <span
                  className="text-[32px] font-light text-[#0d253d]"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {plan.name === "Growth" && annual
                    ? plan.annualPrice
                    : plan.price}
                </span>
                <span className="text-[13px] text-[#64748d]">
                  {plan.priceDetail}
                </span>
                {plan.name === "Growth" && annual && (
                  <div className="text-[11px] text-[#64748d] line-through">
                    {plan.price + plan.priceDetail}
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-[13px] text-[#64748d] flex items-start gap-2"
                  >
                    <Check size={14} className="text-[#533afd] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`inline-flex items-center justify-center w-full h-[34px] rounded-full text-sm font-medium transition-opacity hover:opacity-90 ${
                  plan.highlighted
                    ? "text-white"
                    : "text-[#533afd] border border-[#533afd]"
                }`}
                style={plan.highlighted ? { background: "#533afd" } : {}}
              >
                {plan.cta}
                <ArrowRight size={14} className="ml-1" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
