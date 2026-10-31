"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, AlertCircle, Mail } from "lucide-react";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";

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
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/auth/request-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: form.companyName,
            email: form.email,
            gstin: form.gstin,
            iec_code: form.iecCode,
            product_type: form.productType,
            estimated_batches: form.estimatedBatches,
            market_region: form.marketRegion,
            phone: form.phone,
          }),
        }
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
      <main className="relative min-h-screen bg-bg text-text overflow-x-clip flex flex-col justify-between">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center border-2 border-black p-8 bg-white shadow-xl clip-chamfer"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-700" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-black mb-3">Application Received</h1>
            <p className="text-black/80 mb-2">
              We&apos;ll review your application and get back to you within 24 hours.
            </p>
            <p className="text-sm font-mono text-black/60">
              If approved, credentials will be sent to {form.email}.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-8 text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-emerald-700"
            >
              Back to homepage
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />

      {/* CRT Emerald Hero Banner */}
      <section className="relative min-h-[320px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-24 sm:pt-28 pb-10 select-none">
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)",
          }}
        />
        <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 py-4">
          <div className="max-w-[800px]">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black clip-chamfer mb-4">
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                VERIFIED ACCESS
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                Exclusively for Indian Manufacturers
              </span>
            </div>

            <h1 className="font-heading font-semibold text-[clamp(32px,4vw,56px)] leading-[0.96] tracking-[-0.04em] text-black">
              Request Platform Access
            </h1>
          </div>
        </div>
      </section>

      {/* Form Container */}
      <div className="max-w-xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border-2 border-black p-8 shadow-xl clip-chamfer"
        >
          <div className="mb-8 border-b border-black/10 pb-6">
            <p className="text-black/80 font-medium text-[15px] leading-relaxed">
              Built for Indian pack exporters. A walkthrough of serials, QR, and a public sample page — not a certification.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Tata AutoComp Systems"
                className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
              />
              {errors.companyName && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.companyName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                Business Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
              <p className="mt-1 text-[11px] font-mono text-black/50">
                Free email domains (Gmail, Yahoo, etc.) are not accepted.
              </p>
            </div>

            {/* GSTIN / IEC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AAPFU0939F1ZV"
                  maxLength={15}
                  className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                />
                {errors.gstin && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.gstin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                  IEC Code
                </label>
                <input
                  type="text"
                  value={form.iecCode}
                  onChange={(e) => setForm({ ...form, iecCode: e.target.value.toUpperCase() })}
                  placeholder="A123456789"
                  maxLength={10}
                  className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
                />
                {errors.iecCode && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.iecCode}
                  </p>
                )}
              </div>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black focus:outline-none focus:border-black"
              >
                <option value="">Select product type</option>
                <option value="battery">Battery / Energy Storage</option>
                <option value="other">Other</option>
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
              <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                Estimated Monthly Batches
              </label>
              <select
                value={form.estimatedBatches}
                onChange={(e) => setForm({ ...form, estimatedBatches: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black focus:outline-none focus:border-black"
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
              <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                Primary Export Market
              </label>
              <select
                value={form.marketRegion}
                onChange={(e) => setForm({ ...form, marketRegion: e.target.value })}
                className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black focus:outline-none focus:border-black"
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
              <label className="block text-xs font-mono font-bold tracking-wider uppercase text-black mb-1.5">
                Phone Number <span className="text-black/40 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-none border border-black/20 bg-white text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black"
              />
            </div>

            {errors.submit && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.submit}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 inline-flex items-center justify-center gap-2 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-lg disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Application"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
