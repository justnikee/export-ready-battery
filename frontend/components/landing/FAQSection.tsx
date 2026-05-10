"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is ExportReady different from manual compliance tracking?",
    answer:
      "ExportReady automates the entire compliance workflow — real-time validation, automated documentation generation, and an immutable BLAKE2b cryptographic audit chain. What takes compliance teams weeks of spreadsheet work and manual certification-chasing happens in minutes.",
  },
  {
    question: "Can I integrate ExportReady with my existing ERP system?",
    answer:
      "Yes. ExportReady provides a REST API with comprehensive documentation for integration with SAP, Oracle, Microsoft Dynamics, and custom ERP systems. We support CSV batch upload, webhooks for real-time status updates, and dedicated integration support during onboarding.",
  },
  {
    question: "What regulatory frameworks does ExportReady validate against?",
    answer:
      "ExportReady validates against EU Battery Regulation 2023/1542 (carbon footprint, recycled content, supply chain due diligence), India BIS IS 16046, and CPCB Battery Waste Management Rules 2022. Validation rulesets update from official regulatory sources.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Most manufacturers are operational within 2–3 weeks — including API/CSV integration, team training, and initial batch upload. We provide dedicated onboarding support, migration assistance from legacy tracking systems, and comprehensive documentation.",
  },
  {
    question: "What happens if my battery fails compliance validation?",
    answer:
      "ExportReady identifies compliance gaps immediately with specific remediation guidance. You'll receive detailed reports showing which specifications don't meet regulatory requirements, suggested corrections, and alternative certification paths. Our compliance team can provide expert consultation for complex cases.",
  },
  {
    question: "How does ExportReady ensure data security?",
    answer:
      "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We maintain SOC 2 Type II compliance, conduct regular penetration testing, and store data in ISO 27001 certified data centers. You retain full ownership of your data with options for on-premise deployment for enterprise customers.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Yes. We offer a 14-day free trial with full platform access (up to 100 battery passports). No credit card required. You can test all features including API integration, compliance validation, and audit trail generation. Our team provides hands-on support during the trial period.",
  },
  {
    question: "What is the EU Battery Passport deadline?",
    answer:
      "The EU Battery Regulation 2023/1542 mandates digital battery passports for all batteries above 2 kWh by February 2027. Manufacturers must start preparing now as the regulation includes transitional periods for different battery categories. ExportReady helps you meet these deadlines with automated passport generation.",
  },
  {
    question: "Does ExportReady support India BIS certification?",
    answer:
      "Yes. ExportReady validates against all India BIS standards including IS 16046 (lithium-ion batteries), tracks BIS R-Number validity, monitors EPR obligations under CPCB guidelines, and generates India-specific compliance documentation. We maintain updated databases of approved testing laboratories and certification bodies.",
  },
  {
    question: "How much does ExportReady cost?",
    answer:
      "Pricing starts at ₹4,999/month for up to 500 battery passports. We offer volume discounts for high-volume manufacturers and custom enterprise plans with dedicated support, on-premise deployment, and SLA guarantees. Contact our sales team for a detailed quote based on your production volume.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-section-light py-24">
      <div className="max-w-[900px] mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs uppercase tracking-widest font-mono text-accent-green mb-4">
            Frequently Asked Questions
          </span>
          <h2 className="text-section-headline text-gray-900 mb-4">
            Have Questions? We Have Answers
          </h2>
          <p className="text-base text-muted-light max-w-[60ch] mx-auto">
            Everything you need to know about battery compliance automation and
            ExportReady.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-gray-200 rounded-xl bg-white hover:border-green-300 transition-colors"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-gray-900 hover:bg-transparent hover:text-green-600 py-5 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-light leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-light mb-4">
            Still have questions? Our compliance experts are here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            Contact Support
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// Made with Bob
