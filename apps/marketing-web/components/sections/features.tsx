"use client";

import { motion } from "framer-motion";
import { ArrowRight, Battery, Shirt, Repeat, Server, Factory } from "lucide-react";

const products = [
  {
    icon: Battery,
    name: "Battery Passport",
    description:
      "Full compliance with EU Battery Regulation 2023/1542. Carbon footprint declaration. Recycled content tracking. Due diligence documentation. BIS, EPR, UN38.3, IEC 62133 integration.",
    href: "/battery",
    accent: "border-emerald-500/20 bg-emerald-500/[0.03]",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Shirt,
    name: "Textile DPP",
    description:
      "Digital Product Passports for textile exports. Fiber composition tracking. OEKO-TEX and GOTS certification management. REACH compliance. Supply chain tier mapping.",
    href: "/textile",
    accent: "border-navy-200/60 bg-white",
    iconBg: "bg-navy-100 text-navy-700",
  },
];

const differentiators = [
  {
    icon: Repeat,
    title: "We Don't Do Subscriptions",
    body: "Most compliance tools charge you monthly whether you ship or not. We charge per batch activation. Buy 10 activations. Use them over 6 months. No recurring fees. No surprise bills when your factory is closed for Diwali.",
  },
  {
    icon: Server,
    title: "Your Data Stays in India",
    body: "Production data, certificate PDFs, and compliance records are stored on Indian infrastructure. EU buyers see only what regulations require — never your cost structure or supplier list.",
  },
  {
    icon: Factory,
    title: "We Speak Manufacturer",
    body: "Our onboarding asks for your BIS R-number and IEC code — not your 'monthly recurring revenue.' Our support team knows what a Bill of Entry is. Our product is built from factory visits, not boardroom presentations.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Product Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
            Platform
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight tracking-tight">
            One platform. Two products. Every market.
          </h2>
          <p className="mt-4 text-navy-500 max-w-lg">
            Whether you make Li-ion batteries in Gujarat or textiles in Tiruppur, the same platform handles your compliance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-24">
          {products.map((p, i) => (
            <motion.a
              key={p.name}
              href={p.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group rounded-xl border p-8 transition-colors hover:border-navy-300 ${p.accent}`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${p.iconBg}`}>
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-navy-900 mb-3">{p.name}</h3>
              <p className="text-sm text-navy-600 leading-relaxed mb-6">{p.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">
                Explore {p.name.split(" ")[0]}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </motion.a>
          ))}
        </div>

        {/* Compliance coverage */}
        <div className="mb-24">
          <p className="text-[11px] font-mono font-medium text-navy-400 uppercase tracking-[0.15em] mb-4 text-center">
            Compliance Coverage
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              "EU Battery Regulation",
              "REACH",
              "RoHS",
              "BIS IS 16046",
              "CPCB EPR",
              "BWM Rules 2022",
              "OEKO-TEX",
              "GOTS",
            ].map((reg) => (
              <span
                key={reg}
                className="text-xs text-navy-500 bg-navy-50 px-3 py-1 rounded-full border border-navy-100"
              >
                {reg}
              </span>
            ))}
          </div>
        </div>

        {/* Why ExportReady */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
            Why ExportReady
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight tracking-tight">
            Built different.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {differentiators.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-navy-200/60 bg-white p-8"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-navy-100 mb-5">
                <d.icon className="w-5 h-5 text-navy-700" />
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-3">{d.title}</h3>
              <p className="text-sm text-navy-600 leading-relaxed">{d.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
