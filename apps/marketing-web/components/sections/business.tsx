"use client";

import { motion } from "framer-motion";

const stories = [
  {
    title: "Compliance teams",
    description: "Track gaps, renewals, and product readiness in one view.",
    gradient: "linear-gradient(135deg, #07142f, #533afd 46%, #f96bee)",
  },
  {
    title: "Export desks",
    description: "Share buyer packs and shipment evidence without manual chasing.",
    gradient: "linear-gradient(135deg, #2f4056, #f5e9d4)",
  },
  {
    title: "Supplier ops",
    description: "Bring upstream data into structured, reusable records.",
    gradient: "linear-gradient(135deg, #07142f, #37d59a)",
  },
  {
    title: "Leadership",
    description: "See risk and readiness before contracts are at stake.",
    gradient: "linear-gradient(135deg, #07142f, #8d63ff)",
  },
];

const accordionItems = [
  {
    text: "Unify documentation across products and supplier relationships",
    color: "#533afd",
  },
  {
    text: "Protect European shipments with audit-ready evidence packs",
    color: "#ea2261",
  },
  {
    text: "Launch buyer verification portals without new spreadsheets",
    color: "#f59b38",
  },
];

export default function Business() {
  return (
    <section id="commerce" className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        {/* Head */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[70px] mb-10"
        >
          <div>
            <div className="text-[#533afd] text-[12px] font-medium leading-[1.35] mb-3.5">
              Powering businesses of all sizes
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d]">
              Run your export programme on reliable compliance rails.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.55] text-[#64748d]">
            Anviora adapts to factories preparing a first EU buyer audit and
            enterprises managing multi-supplier, multi-product compliance
            operations.
          </p>
        </motion.div>

        {/* Case study */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-6 items-stretch mb-10"
        >
          {/* Visual */}
          <div
            className="min-h-[220px] lg:min-h-[300px] rounded-xl relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,37,61,.1), rgba(13,37,61,.04)), linear-gradient(45deg, #35495f 0 28%, #d7dee7 28% 36%, #4a6279 36% 64%, #d7dee7 64% 72%, #2f4056 72% 100%)",
            }}
          >
            <div
              className="absolute left-[-20%] right-[-20%] h-2 bg-[rgba(245,233,212,.9)]"
              style={{ top: "45%", transform: "rotate(-18deg)" }}
            />
            <div
              className="absolute left-[-20%] right-[-20%] h-2 bg-[rgba(245,233,212,.9)]"
              style={{ top: "55%", transform: "rotate(-18deg)" }}
            />
          </div>

          {/* Copy */}
          <div className="bg-white border border-[#e3e8ee] rounded-xl p-7 shadow-[rgba(0,55,112,0.08)_0_1px_3px]">
            <h3 className="text-[22px] sm:text-[25px] font-light leading-[1.16] text-[#0d253d] mb-4">
              Battery manufacturers unify passport evidence with Anviora.
            </h3>
            <p className="text-[16px] leading-[1.55] text-[#64748d] mb-5">
              Product, supplier, and certificate data stay linked from factory
              floor to European buyer review.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="block text-[20px] sm:text-[22px] font-light text-[#533afd]">
                  160+
                </strong>
                <span className="text-[12px] text-[#64748d]">supplier records</span>
              </div>
              <div>
                <strong className="block text-[20px] sm:text-[22px] font-light text-[#533afd]">
                  11K+
                </strong>
                <span className="text-[12px] text-[#64748d]">documents mapped</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Accordion */}
        <div className="border-t border-[#e3e8ee] mb-11">
          {accordionItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[24px_1fr_28px] gap-4 items-center py-4 border-b border-[#e3e8ee] text-[#273951] text-sm cursor-pointer hover:bg-[#f6f9fc] transition-colors px-2 -mx-2 rounded"
            >
              <span
                className="w-4 h-4 rounded"
                style={{ background: item.color }}
              />
              <span>{item.text}</span>
              <b className="justify-self-end text-[#533afd] font-medium">+</b>
            </motion.div>
          ))}
        </div>

        {/* Story grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stories.map((s, i) => (
            <motion.article
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glow-card bg-white border border-[#e3e8ee] rounded-xl p-4.5 min-h-[250px] transition-all duration-200 hover:border-[rgba(83,58,253,0.18)] hover:shadow-[rgba(0,55,112,0.08)_0_1px_3px,rgba(83,58,253,0.12)_0_12px_32px]"
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
                className="h-[138px] rounded-lg mb-4"
                style={{ background: s.gradient }}
              />
              <h3 className="text-[17px] font-medium leading-[1.25] text-[#0d253d] mb-2">
                {s.title}
              </h3>
              <p className="text-[13px] leading-[1.48] text-[#64748d]">
                {s.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
