"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Check, Minus, HelpCircle, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { productRoutesFromSlug } from "@/lib/routes";

const textileRoutes = productRoutesFromSlug("textile");

const comparisonRows = [
  {
    feature: "Batch Activations",
    starter: "10",
    growth: "50",
    enterprise: "200+",
  },
  {
    feature: "EU Battery Passport (2023/1542)",
    starter: "✓",
    growth: "✓",
    enterprise: "✓",
  },
  {
    feature: "India BIS / CPCB Compliance",
    starter: "✓",
    growth: "✓",
    enterprise: "✓",
  },
  {
    feature: "PDF Label Generation",
    starter: "Standard",
    growth: "Priority",
    enterprise: "Custom",
  },
  {
    feature: "QR Passport Generation",
    starter: "✓",
    growth: "✓",
    enterprise: "✓",
  },
  {
    feature: "Importer Mode (China/Korea)",
    starter: "—",
    growth: "✓",
    enterprise: "✓",
  },
  { feature: "REST API Access", starter: "—", growth: "✓", enterprise: "✓" },
  {
    feature: "BLAKE2b Audit Trail",
    starter: "✓",
    growth: "✓",
    enterprise: "✓",
  },
  {
    feature: "WhatsApp Priority Support",
    starter: "—",
    growth: "✓",
    enterprise: "✓",
  },
  {
    feature: "Dedicated Account Manager",
    starter: "—",
    growth: "—",
    enterprise: "✓",
  },
  {
    feature: "Custom Label Formats",
    starter: "—",
    growth: "—",
    enterprise: "✓",
  },
  { feature: "SLA Guarantees", starter: "—", growth: "—", enterprise: "✓" },
  {
    feature: "On-Premise Deployment",
    starter: "—",
    growth: "—",
    enterprise: "✓",
  },
];

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
];

function renderComparisonValue(value: string, highlight = false) {
  if (value === "✓") {
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
          highlight
            ? "bg-accent-green/15 text-accent-green"
            : "bg-zinc-100 text-accent-green"
        }`}
      >
        <Check className="h-4 w-4" />
      </span>
    );
  }

  if (value === "—") {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        <Minus className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200">
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <>
      <section className="bg-[radial-gradient(circle_at_top,rgba(62,207,142,0.12),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 pb-24 pt-32">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/70 px-4 py-2 text-xs text-emerald-900 shadow-[0_8px_24px_rgba(16,185,129,0.08)] backdrop-blur-md">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-green">
                Simple, transparent pricing
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
              Production Licenses for{" "}
              <span className="text-accent-green">Every Scale</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              One-time license purchases per batch activation quota. No
              subscriptions. No expiry. Top up whenever you need more.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="mb-20 grid gap-6 md:grid-cols-3 md:items-stretch">
            <PricingCard
              planName="Starter"
              description="For pilot testing and small production runs."
              price={4999}
              priceSuffix="/ 10 batches"
              ctaText="Buy Starter License"
              ctaLink={`${textileRoutes.register}?plan=starter`}
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
              ctaLink={`${textileRoutes.register}?plan=growth`}
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
            className="mb-20 rounded-[28px] border border-emerald-100 bg-linear-to-r from-emerald-50/70 via-white to-white p-8"
          >
            <h3 className="text-xl text-[#0B1F3B] mb-6 text-center font-heading">
              All Licenses Include
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                "Unlimited Users",
                "Lifetime License Validity",
                "99.9% Uptime SLA",
                "Secure Cloud Storage",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-4 text-sm text-zinc-700"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-green/12 text-accent-green">
                    <Check className="h-4 w-4" />
                  </span>
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
            <div className="mb-10 space-y-3 text-center">
              <span className="inline-flex rounded-full bg-[#0B1F3B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                Plan comparison
              </span>
              <h2 className="text-2xl font-heading text-[#0B1F3B]">
                Compare Plans Side by Side
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-zinc-600">
                The Growth tier is the fastest path for manufacturers handling
                multiple markets, while Enterprise adds custom infrastructure
                and account coverage.
              </p>
            </div>
            <div className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white">
              <div className="overflow-x-auto">
                <div className="min-w-190">
                  <div className="grid grid-cols-[minmax(240px,1.3fr)_repeat(3,minmax(140px,1fr))] border-b border-zinc-200 bg-linear-to-r from-zinc-50 via-white to-emerald-50/70">
                    <div className="px-6 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                        Feature set
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        Every license includes EU passport generation, India
                        validation, and an immutable audit trail.
                      </p>
                    </div>
                    <div className="px-4 py-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Starter
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#0B1F3B]">
                        10 batches
                      </p>
                    </div>
                    <div className="border-x border-emerald-200 bg-emerald-50/80 px-4 py-5 text-center">
                      <span className="inline-flex rounded-full bg-[#0B1F3B] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                        Most popular
                      </span>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent-green">
                        Growth
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#0B1F3B]">
                        50 batches
                      </p>
                    </div>
                    <div className="px-4 py-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Enterprise
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#0B1F3B]">
                        200+ batches
                      </p>
                    </div>
                  </div>

                  {comparisonRows.map((row, i) => (
                    <div
                      key={row.feature}
                      className={`grid grid-cols-[minmax(240px,1.3fr)_repeat(3,minmax(140px,1fr))] items-center ${
                        i < comparisonRows.length - 1
                          ? "border-b border-zinc-100"
                          : ""
                      }`}
                    >
                      <div className="px-6 py-4 text-sm font-medium text-zinc-700">
                        {row.feature}
                      </div>
                      <div className="flex justify-center px-4 py-4">
                        {renderComparisonValue(row.starter)}
                      </div>
                      <div className="flex justify-center border-x border-emerald-200 bg-emerald-50/55 px-4 py-4">
                        {renderComparisonValue(row.growth, true)}
                      </div>
                      <div className="flex justify-center px-4 py-4">
                        {renderComparisonValue(row.enterprise)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              <h2 className="text-2xl font-heading text-[#0B1F3B]">
                Pricing FAQ
              </h2>
            </div>
            <Accordion className="space-y-3">
              {pricingFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`pricing-faq-${i}`}
                  className="border border-gray-200 rounded-xl bg-white hover:border-green-300 transition-colors"
                >
                  <AccordionTrigger className="text-left text-base font-semibold text-gray-900 hover:bg-transparent hover:text-accent-green py-4 hover:no-underline">
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
              Tell us about your production volume and target markets.
              We&apos;ll recommend the right license tier and walk you through a
              demo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-cta-button px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-95"
              >
                Talk to Sales
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs/compliance"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-accent-green hover:text-accent-green"
              >
                Compliance Docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
