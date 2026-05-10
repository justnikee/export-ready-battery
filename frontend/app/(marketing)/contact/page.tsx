"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  BadgeDollarSign,
  Mail,
  Building2,
  User,
  Phone,
  MessageSquare,
  Send,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      inquiryType: (form.elements.namedItem("inquiryType") as HTMLSelectElement)
        .value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      // Fallback: just mark as submitted
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pt-32 pb-24 px-4 bg-white">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block text-xs uppercase tracking-widest font-mono text-accent-green">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
            Contact ExportReady
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Product questions, compliance consultations, or partnership
            inquiries — we respond within one business day.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          {/* Quick contact cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="p-6 rounded-xl border border-gray-200 bg-zinc-50">
              <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center mb-4">
                <Headphones className="h-5 w-5 text-accent-green" />
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F3B] mb-1">
                Support
              </h2>
              <p className="text-sm text-zinc-600 mb-2">
                Technical help, account issues, or platform questions.
              </p>
              <a
                href="mailto:support@exportready.com"
                className="text-sm text-accent-green font-medium hover:underline"
              >
                support@exportready.com
              </a>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 bg-zinc-50">
              <div className="w-10 h-10 rounded-lg bg-[#0B1F3B]/10 flex items-center justify-center mb-4">
                <BadgeDollarSign className="h-5 w-5 text-[#0B1F3B]" />
              </div>
              <h2 className="text-lg font-semibold text-[#0B1F3B] mb-1">
                Sales
              </h2>
              <p className="text-sm text-zinc-600 mb-2">
                Demos, custom plans, or volume pricing for enterprise.
              </p>
              <a
                href="mailto:sales@exportready.com"
                className="text-sm text-accent-green font-medium hover:underline"
              >
                sales@exportready.com
              </a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <div className="p-10 rounded-xl border border-green-200 bg-green-50 text-center space-y-4">
                <Send className="h-10 w-10 text-accent-green mx-auto" />
                <h2 className="text-xl font-semibold text-[#0B1F3B]">
                  Message Sent
                </h2>
                <p className="text-sm text-zinc-600">
                  We&apos;ll get back to you within one business day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-8 rounded-xl border border-gray-200 bg-white"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="name"
                        name="name"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none"
                        placeholder="Amit Sharma"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none"
                        placeholder="amit@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="company"
                        name="company"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none"
                        placeholder="Sharma Batteries Ltd."
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="inquiryType"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Inquiry Type
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none bg-white"
                  >
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing & Plans</option>
                    <option value="compliance">Compliance Consultation</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent-green focus:ring-1 focus:ring-accent-green outline-none resize-none"
                      placeholder="Tell us about your manufacturing volume, target markets, and compliance needs..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-cta-button px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-95 disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Message"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
