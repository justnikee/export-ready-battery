"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  "Automated EU Digital Battery Passport generation",
  "Real-time BIS IS 16046 & CPCB validation",
  "BLAKE2b cryptographic audit trail (10-year retention)",
  "Single passport for EU + India compliance",
  "CSV batch upload & REST API integration",
  "Compliance expert support during onboarding",
];

export function CTASection() {
  return (
    <section className="bg-gradient-hero relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-green-100 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-green-50 rounded-full blur-3xl opacity-30" />

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
            Ready to Ship Compliant Batteries
            <br />
            <span className="text-accent-green">Across Borders?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-base sm:text-lg max-w-[56ch] mx-auto mb-10 text-gray-600">
            Join 50+ manufacturers across India and Europe already using
            AnvayaLabs to simplify battery compliance, accelerate customs
            clearance, and enter regulated markets faster.
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
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-cta-button px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact?demo=true"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700"
            >
              Book Demo
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
