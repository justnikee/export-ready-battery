"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { PricingCard } from "@/components/pricing/PricingCard"
import { Check, Minus, HelpCircle, ArrowRight } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const comparisonRows = [
  { feature: "Batch Activations", starter: "10", growth: "50", enterprise: "200+" },
  { feature: "EU Battery Passport (2023/1542)", starter: "✓", growth: "✓", enterprise: "✓" },
  { feature: "India BIS / CPCB Compliance", starter: "✓", growth: "✓", enterprise: "✓" },
  { feature: "PDF Label Generation", starter: "Standard", growth: "Priority", enterprise: "Custom" },
  { feature: "QR Passport Generation", starter: "✓", growth: "✓", enterprise: "✓" },
  { feature: "Importer Mode (China/Korea)", starter: "—", growth: "✓", enterprise: "✓" },
  { feature: "REST API Access", starter: "—", growth: "✓", enterprise: "✓" },
  { feature: "BLAKE2b Audit Trail", starter: "✓", growth: "✓", enterprise: "✓" },
  { feature: "WhatsApp Priority Support", starter: "—", growth: "✓", enterprise: "✓" },
  { feature: "Dedicated Account Manager", starter: "—", growth: "—", enterprise: "✓" },
  { feature: "Custom Label Formats", starter: "—", growth: "—", enterprise: "✓" },
  { feature: "SLA Guarantees", starter: "—", growth: "—", enterprise: "✓" },
  { feature: "On-Premise Deployment", starter: "—", growth: "—", enterprise: "✓" },
]

const pricingFaqs = [
  {
    question: "What is a batch activation?",
    answer:
      "A batch activation licenses you to generate digital battery passports for one production batch. Each batch can contain multiple battery units. Activations never expire — purchase what you need, top up anytime.",
  },
  {
    question: "Do licenses expire?",
    answer:
      "No. All batch activation licenses have lifetime validity. Once purchased, they remain in your account until used. No recurring fees unless you need more activations.",
  },
  {
    question: "Can I upgrade from Starter to Growth?",
    answer:
      "Yes. You can purchase additional activation packs at any time, or switch to a higher tier. Unused activations from your current plan carry forward.",
  },
  {
    question: "What's included in Enterprise on-premise deployment?",
    answer:
      "Enterprise customers get a dedicated instance deployed on their infrastructure with full isolation, custom SLAs, and white-glove integration support. Contact sales for a detailed proposal.",
  },
  {
    question: "Do you offer volume discounts?",
    answer:
      "Yes. Manufacturers processing 500+ batches per month qualify for volume pricing. Contact our sales team for a custom quote based on your production volume.",
  },
]

export default function PricingPage() {
  return (
    <>
      <section className="pt-32 pb-24 px-4 bg-white">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-green/10 border border-accent-green/20 rounded-full">
              <span className="text-xs font-medium text-accent-green uppercase tracking-wide">
                Simple, transparent pricing
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
              Production Licenses for{" "}
              <span className="text-accent-green">Every Scale</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              One-time license purchases per batch activation quota. No subscriptions.
              No expiry. Top up whenever you need more.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <PricingCard
              planName="Starter"
              description="For pilot testing and small production runs."
              price={4999}
              priceSuffix="/ 10 batches"
              ctaText="Buy Starter License"
              ctaLink="/register?plan=starter"
              features={[
                { text: "10 Batch Activations" },
                { text: "EU & India Compliance Validation" },
                { text: "Standard PDF Label Generation" },
                { text: "QR Passport per Battery Unit" },
                { text: "BLAKE2b Audit Trail" },
                { text: "Email Support" },
              ]}
            />
            <PricingCard
              planName="Growth"
              description="For standard production runs and multi-market operations."
              price={19999}
              priceSuffix="/ 50 batches"
              recommended={true}
              ctaText="Buy Growth License"
              ctaLink="/register?plan=growth"
              ctaVariant="default"
              features={[
                { text: "50 Batch Activations", highlight: true },
                { text: "Everything in Starter" },
                { text: "Priority Label Generation" },
                { text: "Importer Mode (China/Korea)" },
                { text: "REST API Access" },
                { text: "WhatsApp Priority Support" },
              ]}
            />
            <PricingCard
              planName="Enterprise"
              description="For industrial-scale manufacturers with custom requirements."
              price={49999}
              priceSuffix="/ 200 batches"
              ctaText="Contact Sales"
              ctaLink="/contact"
              ctaVariant="outline"
              features={[
                { text: "200+ Batch Activations", highlight: true },
                { text: "Everything in Growth" },
                { text: "Custom Label Formats" },
                { text: "On-Premise Deployment Option" },
                { text: "Dedicated Account Manager" },
                { text: "SLA Guarantees" },
              ]}
            />
          </div>

          {/* All Licenses Include */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 mb-20"
          >
            <h3 className="text-xl text-[#0B1F3B] mb-6 text-center font-heading">
              All Licenses Include
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                "Unlimited Users",
                "Lifetime License Validity",
                "99.9% Uptime SLA",
                "Secure Cloud Storage",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                  <Check className="h-4 w-4 text-accent-green shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-2xl font-heading text-[#0B1F3B] text-center mb-10">
              Compare Plans
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_120px_120px_120px] bg-zinc-50 border-b border-gray-200">
                <div className="py-4 px-6 text-sm font-medium text-zinc-500">Feature</div>
                <div className="py-4 px-4 text-center text-sm font-medium text-zinc-500">Starter</div>
                <div className="py-4 px-4 text-center text-sm font-medium text-accent-green bg-accent-green/5">Growth</div>
                <div className="py-4 px-4 text-center text-sm font-medium text-zinc-500">Enterprise</div>
              </div>
              {/* Rows */}
              {comparisonRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_120px_120px_120px] items-center ${
                    i < comparisonRows.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="py-3.5 px-6 text-sm text-zinc-700">{row.feature}</div>
                  <div className="py-3.5 px-4 flex justify-center">
                    {row.starter === "✓" ? (
                      <Check className="h-4 w-4 text-accent-green" />
                    ) : row.starter === "—" ? (
                      <Minus className="h-4 w-4 text-gray-300" />
                    ) : (
                      <span className="text-xs text-zinc-600">{row.starter}</span>
                    )}
                  </div>
                  <div className="py-3.5 px-4 flex justify-center bg-accent-green/5">
                    {row.growth === "✓" ? (
                      <Check className="h-4 w-4 text-accent-green" />
                    ) : row.growth === "—" ? (
                      <Minus className="h-4 w-4 text-gray-300" />
                    ) : (
                      <span className="text-xs text-zinc-600">{row.growth}</span>
                    )}
                  </div>
                  <div className="py-3.5 px-4 flex justify-center">
                    {row.enterprise === "✓" ? (
                      <Check className="h-4 w-4 text-accent-green" />
                    ) : row.enterprise === "—" ? (
                      <Minus className="h-4 w-4 text-gray-300" />
                    ) : (
                      <span className="text-xs text-zinc-600">{row.enterprise}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pricing FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mb-16"
          >
            <div className="flex items-center gap-2 mb-8 justify-center">
              <HelpCircle className="h-5 w-5 text-accent-green" />
              <h2 className="text-2xl font-heading text-[#0B1F3B]">Pricing FAQ</h2>
            </div>
            <Accordion className="space-y-3">
              {pricingFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`pricing-faq-${i}`}
                  className="border border-gray-200 rounded-xl bg-white hover:border-green-300 transition-colors"
                >
                  <AccordionTrigger className="text-left text-base font-semibold text-gray-900 hover:text-accent-green py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-zinc-600 leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <div className="text-center">
            <p className="text-zinc-600">
              Need a custom enterprise plan?{" "}
              <Link
                href="/contact"
                className="text-accent-green hover:underline transition-colors font-medium"
              >
                Contact us
              </Link>{" "}
              for volume discounts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-hero rounded-2xl p-12 border border-green-100"
          >
            <h2 className="text-2xl font-heading text-[#0B1F3B] mb-3">
              Not sure which plan fits?
            </h2>
            <p className="text-sm text-zinc-600 max-w-lg mx-auto mb-8">
              Tell us about your production volume and target markets. We'll
              recommend the right license tier and walk you through a demo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium text-white bg-gradient-cta-button transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
              >
                Talk to Sales
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs/compliance"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 transition-all duration-200 hover:border-accent-green hover:text-accent-green"
              >
                Compliance Docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
