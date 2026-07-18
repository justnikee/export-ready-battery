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
      "India Compliance — BIS, EPR, PLI, AIS-156/038",
      "AI certificate & datasheet parsing",
      "Blockchain anchoring (Bitcoin / OpenTimestamps)",
      "Carbon footprint calculator",
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
      "EU Battery Regulation compliance (Art. 7/8/11/77)",
      "Fleet health & BMS telemetry monitoring",
      "Mass balance ledger & supplier due diligence (CMRT)",
      "DGFT export claim automation",
      "Developer API, webhooks & Tally sync",
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
    <section className="py-10">
      <div className="max-w-[1232px] mx-auto px-6">
        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span
            className={`text-sm ${!annual ? "text-crew-ink font-medium" : "text-crew-muted"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: annual ? "#157a5b" : "#e3e8ee" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: annual ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
          <span
            className={`text-sm ${annual ? "text-crew-ink font-medium" : "text-crew-muted"}`}
          >
            Annual
          </span>
          <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
            Save ~20%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans.map((plan, i) => {
            const cycle = annual ? plan.annual : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`relative flex flex-col rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1 ${
                  plan.highlighted ? "bg-crew-coral-soft" : "bg-paper"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <span
                      className="text-[11px] font-medium text-white px-2.5 py-1 rounded-full"
                      style={{ background: "#157a5b" }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <h3 className="text-[15px] font-medium text-crew-ink">
                  {plan.name}
                </h3>
                <p className="text-[12px] text-crew-muted mt-1">
                  {plan.description}
                </p>

                <div className="mt-4 mb-2">
                  <span
                    className="text-[32px] font-semibold tracking-[-0.02em] text-crew-ink"
                    style={{ fontFeatureSettings: '"tnum"' }}
                  >
                    {plan.isEnterprise ? "Custom" : cycle!.price}
                  </span>
                  {!plan.isEnterprise && (
                    <span className="text-[13px] text-crew-muted">
                      {annual ? "/yr" : "/mo"}
                    </span>
                  )}
                </div>

                {!plan.isEnterprise && (
                  <>
                    <div className="inline-flex items-center gap-1.5 mb-1">
                      <Zap size={12} className="text-[#157a5b]" />
                      <span className="text-[12px] text-crew-muted">
                        <span className="text-crew-ink font-medium">
                          {cycle!.quotaCount.toLocaleString("en-IN")} passports
                        </span>
                        {annual
                          ? ` upfront @ ${(plan.annual as { monthlyEquivalentInr: string }).monthlyEquivalentInr}/mo equiv.`
                          : ` @ ${(plan.monthly as { pricePerUnit: string }).pricePerUnit}/passport`}
                      </span>
                    </div>
                    {annual && (
                      <p className="text-[11px] text-[#94a3b8] mb-4">
                        Billed {cycle!.price} once/year — not auto-renewing
                      </p>
                    )}
                    {!annual && <div className="mb-4" />}
                  </>
                )}
                {plan.isEnterprise && <div className="mb-4" />}

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-[13px] text-crew-muted flex items-start gap-2"
                    >
                      <Check size={14} className="text-[#157a5b] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`inline-flex items-center justify-center w-full h-[34px] rounded-full text-sm font-medium transition-opacity hover:opacity-90 ${
                    plan.highlighted
                      ? "text-white"
                      : "text-[#157a5b] border border-[#157a5b]"
                  }`}
                  style={plan.highlighted ? { background: "#157a5b" } : {}}
                >
                  {plan.cta}
                  <ArrowRight size={14} className="ml-1" />
                </a>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[12px] text-[#94a3b8] text-center mt-6">
          Plans are one-time credit purchases, not auto-renewing subscriptions — buy again when you need more.
        </p>
      </div>
    </section>
  );
}
