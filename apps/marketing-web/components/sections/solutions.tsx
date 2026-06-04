"use client";

import { motion } from "framer-motion";

const solutions = [
  {
    title: "Accept and organise compliance evidence across products",
    description:
      "Collect documents, map supplier data, and publish verified records from a single operating layer.",
    large: true,
    hasComposite: true,
  },
  {
    title: "Enable any audit model",
    description:
      "Prepare buyer packs, regulator exports, and internal QA reviews without rebuilding the data.",
    hasChart: true,
  },
  {
    title: "Monitor supplier gaps",
    description:
      "Find missing certificates and stale records before they become blocked shipments.",
    hasPattern: true,
  },
  {
    title: "Create a buyer portal",
    description:
      "Give European customers a polished, permissioned view into product evidence.",
    hasGradient: true,
  },
  {
    title: "Access borderless product data",
    description:
      "Keep provenance, carbon, quality, and compliance fields connected across teams.",
    hasMesh: true,
  },
  {
    title: "Embed passports in every shipment",
    description:
      "Publish product-level records with QR-ready IDs, version history, and buyer-ready status.",
    wide: true,
    hasTable: true,
  },
];

export default function Solutions() {
  return (
    <section id="product" className="py-[88px] bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6">
        {/* Head */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,470px)_minmax(0,360px)] items-end justify-between gap-10 lg:gap-12 mb-9"
        >
          <div>
            <div className="text-[#533afd] text-[12px] font-medium leading-[1.35] mb-3.5">
              Product suite
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.12] tracking-normal text-[#0d253d]">
              Flexible workflows for every export compliance model.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.55] text-[#64748d]">
            A connected set of tools designed to work individually or together,
            from first supplier upload to buyer verification.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map((s, i) => (
            <motion.article
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`glow-card bg-white border border-[#e3e8ee] rounded-xl overflow-hidden transition-all duration-200 hover:border-[rgba(83,58,253,0.18)] hover:shadow-[rgba(0,55,112,0.08)_0_1px_3px,rgba(83,58,253,0.12)_0_12px_32px] ${
                s.large ? "sm:col-span-2 min-h-[360px] p-7" : "min-h-[250px] p-6"
              } ${s.wide ? "sm:col-span-2" : ""}`}
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
              <h3 className="text-[17px] font-medium leading-[1.25] text-[#0d253d] mb-2">
                {s.title}
              </h3>
              <p className="text-[13px] leading-[1.48] text-[#64748d]">
                {s.description}
              </p>

              {s.hasComposite && (
                <div
                  className="relative mt-6 rounded-xl overflow-hidden border border-[rgba(227,232,238,0.72)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.58)), linear-gradient(140deg, #f5e9d4 0%, #ff9d3d 38%, #f96bee 68%, #533afd 100%)",
                    height: "220px",
                  }}
                >
                  <div className="absolute left-7 top-6 w-[72px] h-[142px] rounded-[18px] bg-[#101747] shadow-[rgba(0,55,112,0.18)_0_14px_30px]">
                    <div className="absolute inset-2 rounded-xl bg-white" />
                  </div>
                  <div className="absolute left-[120px] top-[34px] right-6 bottom-[30px] rounded-lg bg-[rgba(255,255,255,0.96)] border border-[#e3e8ee] p-4">
                    <div className="h-2 rounded-full bg-[#f6f9fc] mb-3" />
                    <div className="h-2 w-[76%] rounded-full bg-[rgba(83,58,253,0.18)] mb-3" />
                    <div className="h-2 w-[54%] rounded-full bg-[#f6f9fc]" />
                  </div>
                </div>
              )}

              {s.hasChart && (
                <div
                  className="mt-7 h-[118px] rounded-lg relative"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(83,58,253,.14), transparent 58%), repeating-linear-gradient(90deg, transparent 0 28px, rgba(227,232,238,.7) 29px 30px)",
                  }}
                >
                  <div
                    className="absolute left-2.5 right-2.5 bottom-6 h-[60px]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(83,58,253,.1), rgba(249,107,238,.5))",
                      clipPath:
                        "polygon(0 100%, 14% 70%, 28% 76%, 44% 34%, 62% 50%, 78% 18%, 100% 0, 100% 100%)",
                    }}
                  />
                </div>
              )}

              {s.hasPattern && (
                <div
                  className="mt-6 h-[126px] rounded-lg border border-[#e3e8ee]"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 42%, rgba(234,34,97,.45) 0 2px, transparent 3px), radial-gradient(circle at 68% 48%, rgba(83,58,253,.38) 0 2px, transparent 3px)",
                    backgroundSize: "13px 13px",
                  }}
                />
              )}

              {s.hasGradient && (
                <div
                  className="mt-7 h-[126px] rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #f5e9d4 0%, #ff9449 24%, #f96bee 58%, #533afd 100%)",
                  }}
                />
              )}

              {s.hasMesh && (
                <div
                  className="mt-6 h-[136px] rounded-lg"
                  style={{
                    background:
                      "radial-gradient(circle at 22% 60%, rgba(83,58,253,.4), transparent 34%), radial-gradient(circle at 78% 42%, rgba(234,34,97,.35), transparent 30%), #f6f9fc",
                  }}
                />
              )}

              {s.hasTable && (
                <div className="mt-5 border border-[#e3e8ee] rounded-lg overflow-hidden">
                  {[
                    ["LFP-B4471", "EU 2023/1542", "Ready"],
                    ["PACK-M204", "Carbon class", "Review"],
                    ["TEXT-T889", "EUDR", "Ready"],
                  ].map(([name, label, status], idx) => (
                    <div
                      key={name}
                      className="grid grid-cols-[1.2fr_1fr_.8fr] gap-3.5 px-3 py-2.5 text-[12px]"
                      style={{
                        fontFeatureSettings: '"tnum"',
                        borderBottom:
                          idx < 2 ? "1px solid #e3e8ee" : "none",
                        color: "#64748d",
                      }}
                    >
                      <b className="text-[#0d253d] font-medium">{name}</b>
                      <span>{label}</span>
                      <span>{status}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
