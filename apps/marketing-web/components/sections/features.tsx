"use client";

import { motion } from "framer-motion";
import { QrCode, Sparkles, ShieldCheck, GitBranch, Bell, Leaf, BarChart3, Globe } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Digital Product Passports",
    body: "Generate EU-compliant Battery Passports per Regulation 2023/1542. QR-coded, machine-readable, and instantly verifiable by any buyer with a phone.",
    tag: "EU Regulation Ready",
    large: true,
  },
  {
    icon: Sparkles,
    title: "AI-Powered Data Entry",
    body: "Upload any PDF — BIS, EPR, UN38.3, IEC 62133. Our AI extracts 40+ fields automatically.",
    large: false,
  },
  {
    icon: ShieldCheck,
    title: "Blockchain Verification",
    body: "Anchor certificates to the Bitcoin blockchain via OpenTimestamps. Buyers verify document integrity in seconds. Free. No crypto wallet needed.",
    tag: "Trust Tier: Anchored",
    large: true,
  },
  {
    icon: GitBranch,
    title: "Lifecycle Tracking",
    body: "Log manufacture, shipment, repair, resale, and recycling. Immutable audit trail with SHA-256 hash chain.",
    large: false,
  },
  {
    icon: Bell,
    title: "Proactive Alerts",
    body: "30-day warnings before BIS certificates expire. Compliance score drops below 70%. Never miss a deadline.",
    large: false,
  },
  {
    icon: Leaf,
    title: "Carbon Calculator",
    body: "Calculate kg CO₂e per kWh. Get A–G performance class. Ready for EU carbon footprint declarations.",
    large: false,
  },
  {
    icon: BarChart3,
    title: "Export Analytics",
    body: "Compliance trends. Certificate expiry heatmaps. Batch status breakdown. Know where you stand before your buyer asks.",
    large: false,
  },
  {
    icon: Globe,
    title: "Public Passport Viewer",
    body: "Anyone scans your QR code. They see a consumer-safe product passport. No login. No friction. Instant trust.",
    large: false,
  },
];

export default function Features() {
  return (
    <section className="relative bg-[#F8FAFC] py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            Platform Capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em]"
          >
            Everything You Need. Nothing You Don&apos;t.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              className={`group relative rounded-2xl border border-[#E2E8F0] bg-white p-8 hover:border-[#4F46E5]/30 hover:shadow-lg hover:shadow-[#4F46E5]/5 transition-all duration-300 ${
                feature.large ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              {feature.large && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#4F46E5]/5 to-transparent pointer-events-none" />
              )}
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{feature.title}</h3>
                <p className="text-[#64748B] leading-relaxed">{feature.body}</p>
                {feature.tag && (
                  <span className="inline-block mt-4 px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-medium">
                    {feature.tag}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
