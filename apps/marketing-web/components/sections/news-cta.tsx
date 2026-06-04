"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const news = [
  {
    title: "Annual export readiness letter",
    description:
      "How global product regulations are changing what buyers expect from manufacturers.",
    large: true,
    gradient: "linear-gradient(135deg, #533afd, #f96bee)",
  },
  {
    title: "Book of the week",
    description: "Compliance operating models for modern manufacturing teams.",
    gradient: "linear-gradient(135deg, #f5e9d4, #273951)",
  },
  {
    title: "Battery passport guide",
    description: "What Indian exporters need before February 2027.",
    gradient: "linear-gradient(135deg, #f5e9d4, #273951)",
  },
];

export default function NewsCTA() {
  return (
    <>
      {/* News */}
      <section id="resources" className="py-[88px] bg-white">
        <div className="max-w-[1080px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-8"
          >
            <div>
              <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d]">
                What&apos;s happening
              </h2>
              <p className="text-[16px] leading-[1.55] text-[#64748d] mt-2">
                See the latest from Anviora.
              </p>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#533afd] hover:underline mt-3 sm:mt-0"
            >
              View all <ArrowRight size={14} />
            </a>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_.8fr_.8fr] gap-4">
            {news.map((n, i) => (
              <motion.article
                key={n.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`glow-card bg-white border border-[#e3e8ee] rounded-xl p-4.5 transition-all duration-200 hover:border-[rgba(83,58,253,0.18)] hover:shadow-[rgba(0,55,112,0.08)_0_1px_3px,rgba(83,58,253,0.12)_0_12px_32px] ${
                  n.large ? "min-h-[300px]" : "min-h-[220px]"
                }`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty(
                    "--glow-x",
                    `${e.clientX - rect.left}px`
                  );
                  e.currentTarget.style.setProperty(
                    "--glow-y",
                    `${e.clientY - rect.top}px`
                  );
                }}
              >
                <div
                  className={`rounded-lg mb-4 ${n.large ? "h-[170px]" : "h-[118px]"}`}
                  style={{ background: n.gradient }}
                />
                <h3 className="text-[17px] font-medium leading-[1.25] text-[#0d253d] mb-2">
                  {n.title}
                </h3>
                <p className="text-[13px] leading-[1.48] text-[#64748d]">
                  {n.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Row */}
      <section id="deadline" className="py-[88px] bg-[#f6f9fc]">
        <div className="max-w-[1080px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,360px)_repeat(3,1fr)] gap-8 lg:gap-11 items-start"
          >
            <div>
              <h2 className="text-[24px] sm:text-[27px] font-light leading-[1.14] text-[#0d253d] mb-4">
                Ready to get started?
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/demo"
                  className="inline-flex items-center justify-center h-[34px] px-4 rounded-full text-sm font-medium text-white"
                  style={{ background: "#533afd" }}
                >
                  Book demo
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#533afd] hover:underline"
                >
                  Contact sales <ArrowRight size={14} />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#0d253d] mb-2">
                Start with a pilot
              </h3>
              <p className="text-[13px] leading-[1.48] text-[#64748d]">
                Map one product line and generate your first buyer-ready passport.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#0d253d] mb-2">
                Close supplier gaps
              </h3>
              <p className="text-[13px] leading-[1.48] text-[#64748d]">
                Collect missing evidence from suppliers with structured requests.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#0d253d] mb-2">
                Prepare for 2027
              </h3>
              <p className="text-[13px] leading-[1.48] text-[#64748d]">
                Build operating muscle before the deadline arrives.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
