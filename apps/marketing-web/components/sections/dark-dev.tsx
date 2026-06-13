"use client";

import { motion } from "framer-motion";
import { ArrowRight, Braces, RefreshCw, Webhook } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const capabilities = [
  {
    icon: <Braces size={16} />,
    title: "REST API",
    description: "Create and update passports from your ERP or internal tools.",
  },
  {
    icon: <Webhook size={16} />,
    title: "Webhooks",
    description: "Get notified when evidence lands, expires, or gets viewed.",
  },
  {
    icon: <RefreshCw size={16} />,
    title: "Structured exports",
    description: "Regulator-ready JSON and CSV for every record, any time.",
  },
];

const requestLines = [
  <span key="1" className="tok-cmt"># Publish a battery passport</span>,
  <span key="2">
    <span className="tok-kw">curl</span> <span className="tok-str">https://api.anviora.com/v1/passports</span> \
  </span>,
  <span key="3">
    {"  "}<span className="tok-flag">-u</span> sk_live_xK8Tq2…: \
  </span>,
  <span key="4">
    {"  "}<span className="tok-flag">-d</span> product=<span className="tok-str">&quot;LFP-B4471&quot;</span> \
  </span>,
  <span key="5">
    {"  "}<span className="tok-flag">-d</span> regulation=<span className="tok-str">&quot;eu_2023_1542&quot;</span> \
  </span>,
  <span key="6">
    {"  "}<span className="tok-flag">-d</span> fields[carbon_class]=<span className="tok-str">&quot;B&quot;</span> \
  </span>,
  <span key="7">
    {"  "}<span className="tok-flag">-d</span> publish=<span className="tok-num">true</span>
  </span>,
];

const responseLines = [
  <span key="1">{"{"}</span>,
  <span key="2">
    {"  "}<span className="tok-key">&quot;id&quot;</span>: <span className="tok-str">&quot;pass_8Kj2mNw4&quot;</span>,
  </span>,
  <span key="3">
    {"  "}<span className="tok-key">&quot;product&quot;</span>: <span className="tok-str">&quot;LFP-B4471&quot;</span>,
  </span>,
  <span key="4">
    {"  "}<span className="tok-key">&quot;status&quot;</span>: <span className="tok-str">&quot;published&quot;</span>,
  </span>,
  <span key="5">
    {"  "}<span className="tok-key">&quot;version&quot;</span>: <span className="tok-num">14</span>,
  </span>,
  <span key="6">
    {"  "}<span className="tok-key">&quot;qr_url&quot;</span>: <span className="tok-str">&quot;https://qr.anviora.com/p/8Kj2mNw4&quot;</span>
  </span>,
  <span key="7">{"}"}</span>,
];

export default function DarkDev() {
  return (
    <section id="developers" className="py-24 lg:py-28 bg-paper overflow-hidden">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_1fr] gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="eyebrow mb-3">Designed for developers</div>
            <h2 className="display-lg text-[clamp(30px,4vw,42px)] mb-5">
              <TextReveal as="span" className="block">
                Compliance that speaks API
              </TextReveal>
            </h2>
            <p className="text-[17px] leading-[1.6] text-ink-mute mb-8">
              Use the dashboard alone, or wire Anviora into your stack. Every
              passport, document, and audit event is addressable — no screen-scraping
              your own compliance data.
            </p>

            <div className="grid gap-5 mb-8">
              {capabilities.map((c) => (
                <div key={c.title} className="flex items-start gap-3.5">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-soft text-accent shrink-0">
                    {c.icon}
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-ink">{c.title}</div>
                    <div className="text-[13.5px] leading-[1.5] text-ink-mute">
                      {c.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/docs"
              className="group inline-flex items-center gap-1 text-[15px] font-semibold text-accent"
            >
              Read the documentation <ArrowRight size={15} className="cta-arrow" />
            </a>
          </motion.div>

          {/* Code window */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div
              className="relative rounded-2xl overflow-hidden bg-charcoal"
              style={{
                boxShadow:
                  "0 50px 100px -20px rgba(42,37,33,0.35), 0 30px 60px -30px rgba(42,37,33,0.4)",
              }}
            >
              {/* Tab bar */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-0 border-b border-white/10">
                <span className="w-[10px] h-[10px] rounded-full bg-[#ff5f57] mb-3" />
                <span className="w-[10px] h-[10px] rounded-full bg-[#febc2e] mb-3" />
                <span className="w-[10px] h-[10px] rounded-full bg-[#28c840] mb-3" />
                <div className="ml-4 flex gap-1">
                  <span className="px-3.5 py-2 rounded-t-lg bg-white/10 text-white text-[11.5px] font-mono font-medium">
                    publish_passport.sh
                  </span>
                  <span className="px-3.5 py-2 text-white/40 text-[11.5px] font-mono">
                    webhook.ts
                  </span>
                </div>
              </div>

              {/* Request */}
              <div className="px-5 py-4 font-mono text-[12.5px] leading-[1.75] text-[#e8ded2]">
                {requestLines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[26px_1fr] gap-3">
                    <span className="text-white/25 select-none text-right" style={{ fontFeatureSettings: '"tnum"' }}>
                      {i + 1}
                    </span>
                    <span className="whitespace-pre-wrap break-all">{line}</span>
                  </div>
                ))}
              </div>

              {/* Response */}
              <div className="border-t border-white/10 bg-black/20 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center h-[18px] px-1.5 rounded bg-[#1a7f4f]/30 text-[#6de5a6] text-[10px] font-mono font-semibold">
                    201
                  </span>
                  <span className="text-white/40 text-[10.5px] font-mono">response · 184ms</span>
                </div>
                <div className="font-mono text-[12.5px] leading-[1.75] text-[#e8ded2]">
                  {responseLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
