"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap } from "lucide-react";

// Mirrors the real per-plan pricing in
// services/battery-api/internal/services/razorpay_service.go — one-time
// Razorpay credit purchases, NOT recurring subscriptions. Each plan's
// monthly and annual variants are distinct SKUs (different quota/price),
// not the same number with a discount applied — see
// apps/battery-web/components/billing/battery-billing-page.tsx's
// defaultPackages for the source of truth this mirrors.
const plans = [
  {
    name: "Starter",
    description: "For first-time exporters",
    seats: "2 team seats",
    monthly: { price: "₹14,999", quotaCount: 500, pricePerUnit: "₹30" },
    annual: {
      price: "₹1,43,988",
      quotaCount: 6000,
      monthlyEquivalentInr: "₹11,999",
    },
    features: [
      "500 passport credits per purchase (₹30/passport)",
      "2 team seats",
      "India certificate vault (BIS / EPR / UN 38.3 numbers and PDFs)",
      "AI certificate & datasheet parsing (aid, not a filing)",
      "Optional OpenTimestamps on a certificate hash",
      "Carbon screening estimate (not a PEFCR declaration)",
      "Email support (48h response)",
    ],
    cta: "Get Started",
    href: "/request-access",
    highlighted: false,
  },
  {
    name: "Growth",
    description: "For growing manufacturers",
    seats: "10 team seats",
    monthly: { price: "₹44,999", quotaCount: 5000, pricePerUnit: "₹9" },
    annual: {
      price: "₹4,31,988",
      quotaCount: 60000,
      monthlyEquivalentInr: "₹35,999",
    },
    features: [
      "5,000 passport credits per purchase (₹9/passport)",
      "10 team seats",
      "Everything in Starter, plus:",
      "EU lot fields, public passport, partner magic links",
      "Mass-balance ledger and CMRT uploads (your records, not an audit)",
      "Internal DGFT claim tracker (not a TRACE filing)",
      "Developer API, webhooks, optional on-prem Tally XML",
      "Priority support (24h response)",
    ],
    cta: "Get Started",
    href: "/request-access",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    seats: "Up to 100 team seats",
    isEnterprise: true,
    features: [
      "50,000+ passport credits, from ₹1,50,000 per purchase",
      "Up to 100 team seats",
      "Everything in Growth, plus:",
      "Dedicated account manager",
      "Custom integrations (SAP, Oracle)",
      "SLA + phone support",
      "Audit assistance",
    ],
    cta: "Contact Sales",
    href: "/request-access",
    highlighted: false,
  },
];

export default function PricingCards() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-10 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        {/* Toggle Bar */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`font-mono text-xs uppercase tracking-wider ${!annual ? "text-slate-950 font-bold" : "text-text-dim"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-12 h-6 rounded-none bg-slate-200 border border-slate-300 transition-colors p-0.5"
          >
            <div
              className="w-5 h-4.5 rounded-none bg-emerald-600 shadow-xs transition-transform duration-200"
              style={{ transform: annual ? "translateX(22px)" : "translateX(0px)" }}
            />
          </button>
          <span className={`font-mono text-xs uppercase tracking-wider ${annual ? "text-slate-950 font-bold" : "text-text-dim"}`}>
            Annual
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-none">
            Save ~20%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => {
            const cycle = annual ? plan.annual : plan.monthly;
            const dark = plan.highlighted;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`relative flex flex-col justify-between p-8 lg:p-9 rounded-none transition-all duration-300 ease-out hover:-translate-y-2 ${
                  dark
                    ? "bg-blue text-white shadow-2xl shadow-emerald-950/20"
                    : "bg-white text-slate-900 border border-border hover:border-border-strong"
                }`}
              >
                <div>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-950 bg-amber-500 px-3.5 py-1 rounded-none shadow-xs whitespace-nowrap">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-heading text-[24px] font-bold tracking-[-0.02em] ${dark ? "text-white" : "text-slate-950"}`}>
                      {plan.name}
                    </h3>
                  </div>
                  <p className={`text-[14px] leading-[1.5] mb-6 ${dark ? "text-white/80" : "text-text-muted"}`}>
                    {plan.description}
                  </p>

                  {/* Price Block */}
                  <div className="mb-6 pb-6 border-b border-current/15">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-[38px] font-bold tracking-[-0.03em] leading-none">
                        {plan.isEnterprise ? "Custom" : cycle!.price}
                      </span>
                      {!plan.isEnterprise && (
                        <span className={`font-mono text-xs ${dark ? "text-white/70" : "text-text-dim"}`}>
                          {annual ? "/year" : "/month"}
                        </span>
                      )}
                    </div>

                    {!plan.isEnterprise && (
                      <div className="mt-3 flex items-center gap-1.5 font-mono text-[12px]">
                        <Zap size={13} className={dark ? "text-amber-300" : "text-emerald-700"} />
                        <span className={dark ? "text-white/90 font-medium" : "text-slate-800 font-medium"}>
                          {cycle!.quotaCount.toLocaleString("en-IN")} passports
                          {annual
                            ? ` @ ${plan.annual!.monthlyEquivalentInr}/mo equiv.`
                            : ` @ ${plan.monthly!.pricePerUnit}/passport`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[14px] leading-[1.5]">
                        <span className={`inline-flex items-center justify-center w-4 h-4 mt-0.5 rounded-none shrink-0 ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                        <span className={dark ? "text-white/90" : "text-slate-700"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <a
                  href={plan.href}
                  className={`inline-flex items-center justify-center gap-2 w-full h-[48px] rounded-none font-medium text-[14.5px] transition-all duration-200 ${
                    dark
                      ? "bg-white text-slate-950 hover:bg-slate-100 font-bold"
                      : "bg-emerald-700 text-white hover:bg-emerald-800 font-semibold"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={15} />
                </a>
              </motion.div>
            );
          })}
        </div>

        <p className="font-mono text-xs text-text-dim text-center mt-10 uppercase tracking-wider">
          Plans are one-time credit purchases, not auto-renewing subscriptions — buy again when you need more.
        </p>
      </div>
    </section>
  );
}
