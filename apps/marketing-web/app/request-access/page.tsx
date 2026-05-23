"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, AlertCircle, Factory, Mail } from "lucide-react";

const freeEmailDomains = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com",
  "rediffmail.com", "ymail.com", "icloud.com", "protonmail.com",
  "aol.com", "mail.com", "yandex.com", "zoho.com",
]);

function validateGSTIN(gstin: string): boolean {
  if (gstin.length !== 15) return false;
  const stateCode = gstin.slice(0, 2);
  const validStateCodes = new Set([
    "01","02","03","04","05","06","07","08","09","10",
    "11","12","13","14","15","16","17","18","19","20",
    "21","22","23","24","25","26","27","28","29","30",
    "31","32","33","34","35","36","37","38",
  ]);
  if (!validStateCodes.has(stateCode)) return false;
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!panPattern.test(gstin.slice(2, 13))) return false;
  const entityCode = gstin[13];
  if (!/^[0-9A-Z]$/.test(entityCode)) return false;
  const checkDigit = gstin[14];
  if (!/^[0-9A-Z]$/.test(checkDigit)) return false;
  return true;
}

function validateIEC(iec: string): boolean {
  return /^[A-Z0-9]{10}$/.test(iec);
}

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    gstin: "",
    iecCode: "",
    productType: "",
    estimatedBatches: "",
    marketRegion: "",
    phone: "",
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.email.trim()) {
      e.email = "Business email is required";
    } else {
      const domain = form.email.split("@")[1]?.toLowerCase();
      if (!domain || freeEmailDomains.has(domain)) {
        e.email = "Please use your company email address";
      }
    }
    if (!form.gstin.trim() && !form.iecCode.trim()) {
      e.gstin = "GSTIN or IEC code is required to verify your business";
    }
    if (form.gstin.trim() && !validateGSTIN(form.gstin.trim())) {
      e.gstin = "Invalid GSTIN format";
    }
    if (form.iecCode.trim() && !validateIEC(form.iecCode.trim())) {
      e.iecCode = "Invalid IEC format (10 characters)";
    }
    if (!form.productType) e.productType = "Select your product type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // TODO: wire to backend POST /api/v1/auth/request-access
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-navy-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 mb-3">Application Received</h1>
          <p className="text-navy-600 mb-2">
            We'll review your application and get back to you within 24 hours.
          </p>
          <p className="text-sm text-navy-500">
            If approved, you'll receive login credentials at {form.email}.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Back to homepage
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy-50">
      <div className="max-w-xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-700 mb-8">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to homepage
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy-900 mb-3">Request Access</h1>
            <p className="text-navy-600">
              ExportReady is built exclusively for Indian manufacturers and exporters. 
              We review every application to ensure the platform serves legitimate businesses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Tata AutoComp Systems"
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {errors.companyName && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.companyName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
              <p className="mt-1 text-xs text-navy-400">
                Free email providers (Gmail, Yahoo, etc.) are not accepted.
              </p>
            </div>

            {/* GSTIN / IEC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-1.5">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AAPFU0939F1ZV"
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.gstin && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.gstin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-800 mb-1.5">
                  IEC Code
                </label>
                <input
                  type="text"
                  value={form.iecCode}
                  onChange={(e) => setForm({ ...form, iecCode: e.target.value.toUpperCase() })}
                  placeholder="A123456789"
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.iecCode && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.iecCode}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-navy-400 -mt-2">
              Provide either GSTIN or IEC code to verify your business.
            </p>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select product type</option>
                <option value="battery">Battery / Energy Storage</option>
                <option value="textile">Textile / Apparel</option>
                <option value="both">Both</option>
              </select>
              {errors.productType && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.productType}
                </p>
              )}
            </div>

            {/* Estimated Batches */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Estimated Monthly Batches
              </label>
              <select
                value={form.estimatedBatches}
                onChange={(e) => setForm({ ...form, estimatedBatches: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select range</option>
                <option value="<5">Less than 5</option>
                <option value="5-20">5 to 20</option>
                <option value="20-50">20 to 50</option>
                <option value="50+">More than 50</option>
              </select>
            </div>

            {/* Market Region */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Primary Export Market
              </label>
              <select
                value={form.marketRegion}
                onChange={(e) => setForm({ ...form, marketRegion: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select market</option>
                <option value="eu">European Union</option>
                <option value="india">India (Domestic)</option>
                <option value="both">Both EU and India</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Phone Number <span className="text-navy-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-lg border border-navy-200 bg-white text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Submitting..." : "Submit Application"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-navy-400 text-center">
              Not a manufacturer?{" "}
              <a href="mailto:founders@exportready.io" className="text-emerald-600 hover:underline">
                Apply as a Partner
              </a>
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
