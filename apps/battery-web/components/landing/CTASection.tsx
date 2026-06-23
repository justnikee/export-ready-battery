"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BatteryCharging, CheckCircle2 } from "lucide-react";
import { productRoutesFromSlug } from "@/lib/routes";

const features = [
  "Battery passport registration with EU and India compliance",
  "Real-time compliance and traceability data capture from day one",
  "Shared audit trail, QR identity, and API integration foundations",
  "Role-based invites and workspace onboarding",
  "CSV batch upload and operations tooling",
  "Implementation support during onboarding",
];

const productActions = [
  {
    slug: "battery" as const,
    label: "Battery workspace",
    description:
      "Enter the battery flow with EU passport and BIS-ready onboarding.",
    icon: BatteryCharging,
  },
];

export function CTASection() {
  return (
    <section className="bg-gradient-hero relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 h-75 w-75 rounded-full bg-green-100 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-100 w-100 rounded-full bg-green-50 opacity-30 blur-3xl" />

      <div className="max-w-4xl mx-auto text-center px-6 py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Urgency badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs mb-8 bg-white/80 border-green-200 text-green-800 backdrop-blur-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            EU 2027 & India 2026 deadlines approaching — prepare now
          </span>

          {/* Headline */}
          <h2 className="text-section-headline text-gray-900 mb-6">
            Launch Your Battery Passport
            <br />
            <span className="text-accent-green">Workspace Today</span>
          </h2>

          {/* Subheadline */}
          <p className="text-base sm:text-lg max-w-[56ch] mx-auto mb-10 text-gray-600">
            Start your battery passport workspace with EU regulation and BIS-ready onboarding. Manage compliance, traceability, and QR identities in one place.
          </p>

          {/* Feature Checklist */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="checklist-item"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {productActions.map((product) => {
              const Icon = product.icon;
              const routes = productRoutesFromSlug(product.slug);
              return (
                <Link
                  key={product.slug}
                  href={routes.register}
                  className="group rounded-3xl border border-white/70 bg-white/90 p-5 text-left shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-green-300"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-base font-semibold text-gray-900">
                      {product.label}
                    </span>
                  </div>
                  <p className="mb-4 text-sm leading-6 text-gray-600">
                    {product.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
                    Start registration
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link
              href="/contact?demo=true"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700"
            >
              Book Platform Demo
            </Link>
          </div>

          {/* Pricing & Trust Signals */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <span>
              Plans start at{" "}
              <span className="font-semibold text-gray-900">₹4,999/mo</span>
            </span>
            <div className="hidden sm:block h-4 w-px bg-gray-300" />
            <span>14-day free trial</span>
            <div className="hidden sm:block h-4 w-px bg-gray-300" />
            <span>No credit card</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Made with Bob
