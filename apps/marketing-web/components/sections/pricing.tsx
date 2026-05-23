"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, ArrowRight, ChevronDown } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "one-time",
    desc: "For small exporters testing the EU market",
    activations: "10 batch activations",
    features: [
      "EU Battery Passport (2023/1542)",
      "India BIS / CPCB compliance",
      "QR-code generation",
      "Standard PDF labels",
      "CSV data import",
      "Email support",
    ],
    cta: "Request Access",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹19,999",
    period: "one-time",
    desc: "For growing exporters with regular EU shipments",
    activations: "50 batch activations",
    features: [
      "Everything in Starter",
      "Textile DPP support",
      "AI certificate parsing",
      "Blockchain traceability",
      "Real-time compliance alerts",
      "Importer mode (China/Korea)",
      "REST API access",
      "WhatsApp priority support",
    ],
    cta: "Request Access",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large manufacturers with complex supply chains",
    activations: "200+ batch activations",
    features: [
      "Everything in Growth",
      "Unlimited team members",
      "Custom ERP integrations",
      "On-premise deployment option",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label passports",
      "Custom label formats",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const pricingFaqs = [
  {
    question: "What is a batch activation?",
    answer:
      "A batch activation licenses you to generate digital passports for one production batch. Each batch can contain multiple units. Activations never expire — purchase what you need, top up anytime.",
  },
  {
    question: "Do licenses expire?",
    answer:
      "No. All batch activation licenses have lifetime validity. Once purchased, they remain in your account until used. No recurring fees unless you need more activations.",
  },
  {
    question: "Why don't you charge monthly?",
    answer:
      "Because your shipping schedule isn't monthly. Some months you export 20 batches. Some months you export zero. We fit your production cycle, not the other way around.",
  },
  {
    question: "Can I upgrade from Starter to Growth?",
    answer:
      "Yes. You can purchase additional activation packs at any time, or switch to a higher tier. Unused activations from your current plan carry forward.",
  },
  {
    question: "What's included in Enterprise on-premise?",
    answer:
      "Enterprise customers get a dedicated instance deployed on their infrastructure with full isolation, custom SLAs, and white-glove integration support. Contact sales for a detailed proposal.",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-navy-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
            Pricing
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight tracking-tight">
            Pay per batch. Not per month.
          </h2>
          <p className="mt-4 text-navy-500 max-w-md mx-auto">
            Buy activations once. Use them whenever you ship. No subscriptions. No surprise bills.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-xl border bg-white p-8 flex flex-col ${
                plan.highlighted
                  ? "border-emerald-500 border-2"
                  : "border-navy-200/60 hover:border-navy-300 transition-colors"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-semibold text-navy-900">{plan.name}</p>
                <p className="text-xs text-navy-400 mt-1">{plan.desc}</p>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold text-navy-900 tracking-tight">{plan.price}</span>
                <span className="text-sm text-navy-400">{plan.period}</span>
              </div>

              <p className="text-xs font-medium text-emerald-600 mb-6">{plan.activations}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-navy-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.name === "Enterprise" ? "mailto:founders@exportready.io" : "/request-access"}
                className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  plan.highlighted
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-navy-100 text-navy-900 hover:bg-navy-200"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 space-y-3">
          <p className="text-[11px] font-mono font-medium text-navy-400 uppercase tracking-[0.15em] mb-4 text-center">
            Common Questions
          </p>
          {pricingFaqs.map((faq, i) => (
            <PricingFaq key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingFaq({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-navy-200/60 rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-medium text-navy-800">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-navy-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-navy-500 leading-relaxed border-t border-navy-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}
