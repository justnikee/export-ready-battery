"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    subtitle: "For first-time exporters",
    features: [
      { text: "1 user", included: true },
      { text: "3 batches/month", included: true },
      { text: "Basic product passport", included: true },
      { text: "QR code generation", included: true },
      { text: "Public passport pages", included: true },
      { text: "Email support (48h)", included: true },
      { text: "AI certificate parsing", included: false },
      { text: "Blockchain anchoring", included: false },
      { text: "Compliance alerts", included: false },
    ],
    cta: "Start Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹4,999",
    period: "/month",
    subtitle: "For growing manufacturers",
    badge: "Most Popular",
    features: [
      { text: "5 users", included: true },
      { text: "50 batches/month", included: true },
      { text: "AI certificate parsing", included: true },
      { text: "Compliance gap analysis", included: true },
      { text: "Certificate expiry alerts", included: true },
      { text: "Blockchain anchoring", included: true },
      { text: "Carbon footprint calculator", included: true },
      { text: "Mass balance ledger", included: true },
      { text: "Priority support (24h)", included: true },
    ],
    cta: "Start 14-Day Trial",
    href: "/signup?plan=growth",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "For large-scale operations",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Unlimited batches", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA + phone support", included: true },
      { text: "On-premise deployment", included: true },
      { text: "Audit assistance", included: true },
      { text: "White-label passports", included: true },
      { text: "API access", included: true },
    ],
    cta: "Contact Sales",
    href: "/demo",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative bg-white py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em] mb-4"
          >
            Simple Pricing. No Hidden Fees.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#64748B]"
          >
            Start free. Scale as you grow.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-[#4F46E5] shadow-xl shadow-[#4F46E5]/10 scale-[1.02] bg-white"
                  : "border-[#E2E8F0] bg-white"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#4F46E5] text-white text-xs font-semibold">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <p className="text-sm font-medium text-[#64748B] mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#0F172A]">{plan.price}</span>
                  {plan.period && <span className="text-[#64748B]">{plan.period}</span>}
                </div>
                <p className="text-sm text-[#64748B] mt-1">{plan.subtitle}</p>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check size={16} className="text-[#10B981] shrink-0" />
                    ) : (
                      <Minus size={16} className="text-[#CBD5E1] shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href={plan.href}
                className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${
                  plan.highlighted
                    ? "bg-[#4F46E5] text-white hover:bg-[#4338CA]"
                    : "border border-[#E2E8F0] text-[#0F172A] hover:border-[#0F172A]"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-[#64748B] mt-8"
        >
          All plans include: EU Battery Passport generation, QR codes, public passport pages, and basic compliance tracking. No setup fees. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
