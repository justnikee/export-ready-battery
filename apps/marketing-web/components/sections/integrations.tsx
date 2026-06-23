"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const tabs = [
  {
    id: "nocode",
    label: "Don't code?",
    content: {
      title: "Set up billing, take payments, or share a passport link — right from the Anviora Dashboard, no code required.",
      points: [
        "Generate QR-coded passports in one click",
        "Upload certificates via drag-and-drop",
        "Track compliance status visually",
      ],
    },
  },
  {
    id: "platform",
    label: "Use a pre-integrated platform",
    content: {
      title: "Browse our directory of platforms that integrate Anviora with ERP and accounting tools.",
      points: [
        "Native Tally Prime connector",
        "Zoho Books sync",
        "SAP RFC integration",
      ],
    },
  },
  {
    id: "api",
    label: "Build your own integration",
    content: {
      title: "Use our SDKs, APIs, and developer tools to build and maintain your own integration with Anviora.",
      points: [
        "REST API with OpenAPI spec",
        "Webhooks for real-time events",
        "Node.js, Python, and Go SDKs",
      ],
    },
  },
];

export default function Integrations() {
  const [activeTab, setActiveTab] = useState("nocode");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="bg-[#F8FAFC] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-3xl lg:text-[40px] font-semibold text-[#0F172A] leading-[1.1] tracking-[-0.02em] mb-4">
            Reliable infrastructure for every stack
          </h2>
          <p className="text-lg text-[#64748B]">
            Adapt Anviora to your business needs with flexible integration options.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-white rounded-xl border border-[#E2E8F0] w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#0F172A] text-white"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-8 lg:p-10"
          >
            <p className="text-lg text-[#0F172A] mb-6 max-w-[600px]">
              {active.content.title}
            </p>
            <ul className="space-y-3">
              {active.content.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Check size={18} className="text-[#10B981] mt-0.5 shrink-0" />
                  <span className="text-[#444444]">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
