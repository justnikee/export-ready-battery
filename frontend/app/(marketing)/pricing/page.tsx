"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { PricingCard } from "@/components/pricing/PricingCard"
import { Check } from "lucide-react"
import { CTASection } from "@/components/landing/cta-section"

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
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1F7A5F]/10 border border-[#1F7A5F]/20 rounded-full">
 <span className="text-xs font-medium text-[#1F7A5F] uppercase tracking-wide">Simple, transparent pricing</span>
 </div>

 <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
 Production Licenses for{" "}
 <span className="text-[#1F7A5F]">
 Every Scale
 </span>
 </h1>
 <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
 Purchase batch activation quotas as detailed below. Licenses never expire and can be topped up at any time.
 </p>
 </motion.div>

 {/* Pricing Cards */}
 <div className="grid md:grid-cols-3 gap-6 mb-16">

 {/* Starter */}
 <PricingCard
 planName="Starter"
 description="For Pilot Testing and small batches."
 price={4999}
 priceSuffix="/ 10 batches"
 ctaText="Buy Starter License"
 ctaLink="/register?plan=starter"
 features={[
 { text: "10 Batch Activations" },
 { text: "Standard PDF Label Generation" },
 { text: "India Compliance (EPR/BIS)" },
 { text: "Email Support" },
 { text: "Basic Analytics" }
 ]}
 />

 {/* Growth */}
 <PricingCard
 planName="Growth"
 description="For Standard Production runs."
 price={19999}
 priceSuffix="/ 50 batches"
 recommended={true}
 ctaText="Buy Growth License"
 ctaLink="/register?plan=growth"
 ctaVariant="default"
 features={[
 { text: "50 Batch Activations", highlight: true },
 { text: "Priority Label Generation" },
 { text: "Importer Mode (China/Korea)" },
 { text: "WhatsApp Priority Support" },
 { text: "Everything in Starter" }
 ]}
 />

 {/* Enterprise */}
 <PricingCard
 planName="Enterprise"
 description="For Industrial Scale Manufacturing."
 price={49999}
 priceSuffix="/ 200 batches"
 ctaText="Contact Sales"
 ctaLink="/contact"
 ctaVariant="outline"
 features={[
 { text: "200+ Batch Activations", highlight: true },
 { text: "Custom Label Formats" },
 { text: "Dedicated Account Manager" },
 { text: "API Access & Custom Integrations" },
 { text: "SLA Guarantees" }
 ]}
 />

 </div>

 {/* All Licenses Include */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="bg-zinc-50 border border-zinc-200 rounded-xl p-8"
 >
 <h3 className="text-xl text-[#0B1F3B] mb-6 text-center font-heading">All Licenses Include</h3>
 <div className="grid md:grid-cols-4 gap-6">
 {[
 "Unlimited Users",
 "Forever Validity",
 "99.9% Uptime SLA",
 "Secure Cloud Storage"
 ].map((item, i) => (
 <div key={i} className="flex items-center gap-2 text-sm text-zinc-700">
 <Check className="h-4 w-4 text-[#1F7A5F]" />
 {item}
 </div>
 ))}
 </div>
 </motion.div>

 <div className="mt-12 text-center">
 <p className="text-zinc-600">
 Need a custom enterprise plan?{" "}
 <Link href="/contact" className="text-[#1F7A5F] hover:underline transition-colors">
 Contact us
 </Link>
 {" "}for volume discounts.
 </p>
 </div>
 </div>
 </section>

 <CTASection />
 </>
 )
}
