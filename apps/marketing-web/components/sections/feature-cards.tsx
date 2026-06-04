"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "Clean and format data with AI in seconds",
    body: "Use AI to transform any certificate into structured data. Extract BIS numbers, EPR IDs, test dates, and more — automatically.",
    bg: "bg-gradient-to-br from-[#FCE4EC] to-[#F8BBD0]",
    image: (
      <div className="rounded-xl bg-white/70 backdrop-blur p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FF6B9D]/20 flex items-center justify-center">
            <span className="text-[8px] font-bold text-[#C44569]">PDF</span>
          </div>
          <span className="text-xs text-[#666666]">BIS_Certificate.pdf</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
          <div className="h-full w-[92%] rounded-full bg-[#FF6B9D]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-2 rounded bg-[#E2E8F0]" />
          <div className="h-2 rounded bg-[#E2E8F0]" />
        </div>
      </div>
    ),
  },
  {
    title: "Run action steps conditionally — no engineering needed",
    body: "Conditionally run workflows based on any logic. Use different providers for different markets, branch on compliance status, or build if-then fallbacks.",
    bg: "bg-gradient-to-br from-[#E1BEE7] to-[#CE93D8]",
    image: (
      <div className="rounded-xl bg-white/70 backdrop-blur p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-[#7B1FA2]/10 text-[#7B1FA2] text-[10px] font-medium">IF</span>
          <span className="text-xs text-[#666666]">Certificate expires &lt; 30 days</span>
        </div>
        <div className="pl-4 flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-[#7B1FA2]/10 text-[#7B1FA2] text-[10px] font-medium">THEN</span>
          <span className="text-xs text-[#666666]">Send alert + create task</span>
        </div>
      </div>
    ),
  },
  {
    title: "Constantly update any tool — CRM, ERP, email, or more",
    body: "Push enriched data to your CRM, data warehouse, email tool, website CMS, ad manager, etc. — on a recurring basis. Use our HTTP API capability to build your own integrations without code.",
    bg: "bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7]",
    image: (
      <div className="rounded-xl bg-white/70 backdrop-blur p-4 space-y-2">
        {["Tally", "SAP", "Zoho", "Salesforce"].map((tool) => (
          <div key={tool} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#388E3C]/10 flex items-center justify-center">
              <span className="text-[7px] font-bold text-[#388E3C]">{tool[0]}</span>
            </div>
            <span className="text-xs text-[#666666]">{tool}</span>
            <span className="ml-auto text-[10px] text-[#10B981]">Connected</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function FeatureCards() {
  return (
    <section className="bg-[#FAF9F6] py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`rounded-3xl ${card.bg} p-6 lg:p-8 shadow-soft hover:shadow-soft-hover transition-shadow`}
            >
              <div className="mb-6">{card.image}</div>
              <h3 className="text-lg font-semibold text-[#111111] mb-2">{card.title}</h3>
              <p className="text-sm text-[#444444] leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
