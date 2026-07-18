"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

const countries = [
  "Germany", "France", "Netherlands", "Italy", "Spain", "Poland",
  "Belgium", "Sweden", "Austria", "Other EU country",
];

export default function EUBuyerMandateForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    buyerCompanyName: "",
    contactName: "",
    contactEmail: "",
    country: "",
    indianSuppliers: "",
    message: "",
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.buyerCompanyName.trim()) e.buyerCompanyName = "Company name is required";
    if (!form.contactName.trim()) e.contactName = "Your name is required";
    if (!form.contactEmail.trim() || !form.contactEmail.includes("@")) {
      e.contactEmail = "A valid email is required";
    }
    if (!form.country) e.country = "Select your country";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/leads/eu-buyer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyer_company_name: form.buyerCompanyName,
            contact_name: form.contactName,
            contact_email: form.contactEmail,
            country: form.country,
            indian_suppliers: form.indianSuppliers,
            message: form.message,
          }),
        },
      );
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ submit: data.error || "Something went wrong. Please try again." });
      }
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="mandate-form" className="py-[72px]">
        <div className="max-w-[520px] mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 mb-5">
            <CheckCircle className="w-7 h-7 text-crew-green" />
          </div>
          <h2 className="font-serif text-[26px] font-semibold text-crew-ink">Thanks — we'll be in touch</h2>
          <p className="mt-2 text-[15px] text-[#131313]">
            We'll reach out to discuss mandating Anviora for your Indian suppliers.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="mandate-form" className="py-[72px]">
      <div className="max-w-[560px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-semibold leading-[1.1] tracking-[-0.02em] text-crew-ink text-center">
            Mandate your Indian suppliers
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#131313] text-center">
            Tell us who you buy from in India — we'll reach out to them directly and help them onboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-crew-ink mb-1.5">
                Your Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.buyerCompanyName}
                onChange={(e) => setForm({ ...form, buyerCompanyName: e.target.value })}
                placeholder="e.g. Berlin Mobility GmbH"
                className="w-full px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink placeholder:text-crew-muted focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral"
              />
              {errors.buyerCompanyName && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.buyerCompanyName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-crew-ink mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral"
                />
                {errors.contactName && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.contactName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-crew-ink mb-1.5">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral"
                >
                  <option value="">Select...</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.country}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-crew-ink mb-1.5">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink placeholder:text-crew-muted focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral"
              />
              {errors.contactEmail && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-crew-ink mb-1.5">
                Indian Suppliers to Mandate
              </label>
              <input
                type="text"
                value={form.indianSuppliers}
                onChange={(e) => setForm({ ...form, indianSuppliers: e.target.value })}
                placeholder="e.g. Tata AutoComp, Exide Industries"
                className="w-full px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink placeholder:text-crew-muted focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-crew-ink mb-1.5">
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="Anything else we should know?"
                className="w-full px-4 py-2.5 rounded-lg border border-crew-border bg-white text-sm text-crew-ink placeholder:text-crew-muted focus:outline-none focus:ring-2 focus:ring-crew-coral/20 focus:border-crew-coral resize-none"
              />
            </div>

            {errors.submit && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.submit}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center h-[44px] rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
