"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const links = {
  Product: [
    { label: "Battery Passport", href: "/battery" },
    { label: "Textile DPP", href: "/textile" },
    { label: "Pricing", href: "#pricing" },
    { label: "API", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Regulation Tracker", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "mailto:founders@exportready.io" },
    { label: "Press Kit", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white">
      {/* CTA Strip */}
      <div className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
          >
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Stop studying regulations. Start shipping.
              </h3>
              <p className="mt-3 text-navy-400 max-w-md text-sm leading-relaxed">
                Your competitors are already digitizing compliance. In 12 months, EU Battery Passports will be mandatory. 
                The question isn't whether you'll need this — it's whether you'll be ready.
              </p>
            </div>
            <a
              href="/request-access"
              className="inline-flex items-center gap-2 bg-emerald-500 text-white px-7 py-3.5 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              Request Access
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-[10px]">
                E
              </div>
              <span className="font-semibold text-sm">ExportReady</span>
            </div>
            <p className="text-xs text-navy-500 leading-relaxed">
              Compliance documentation for Indian manufacturers exporting to the European Union.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-[11px] font-mono text-navy-500 uppercase tracking-[0.15em] mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-navy-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-navy-600">
            ExportReady is a product of AnvayaLabs. Built in India for Indian manufacturers.
          </p>
          <div className="flex items-center gap-5">
            {["LinkedIn"].map((name) => (
              <a key={name} href="#" className="text-xs text-navy-600 hover:text-navy-400 transition-colors">
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
