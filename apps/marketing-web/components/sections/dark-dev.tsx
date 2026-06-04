"use client";

import { motion } from "framer-motion";

const darkStats = [
  { value: "500M+", label: "field changes versioned over product lifecycles" },
  { value: "10K+", label: "supplier documents processed per programme" },
  { value: "150K+", label: "audit events ready for review" },
];

const paths = [
  {
    title: "Do not code?",
    description:
      "Use structured workspaces, upload flows, and buyer links directly from the dashboard.",
  },
  {
    title: "Use an integration partner.",
    description:
      "Connect Anviora with ERP, document vault, and supplier systems through guided setup.",
  },
  {
    title: "Build your own integration.",
    description:
      "Use APIs and exports to maintain passport records from internal tools.",
  },
];

export default function DarkDev() {
  return (
    <section id="developers" className="py-[88px]" style={{ background: "#07142f" }}>
      <div className="max-w-[1080px] mx-auto px-6">
        {/* Head */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,470px)_minmax(0,390px)] gap-10 lg:gap-12 items-start mb-14"
        >
          <div>
            <div className="text-[#b9b9f9] text-[12px] font-medium leading-[1.35] mb-3.5">
              Developer and operations infrastructure
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-white">
              Reliable, extensible infrastructure for every compliance stack.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.55] text-[rgba(255,255,255,0.62)]">
            Adapt Anviora to your business needs with flexible integration paths,
            structured APIs, and operational workflows that scale.
          </p>
        </motion.div>

        {/* Integration map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative min-h-[260px] rounded-xl overflow-hidden mb-14"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02)), #0b1738",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          {/* Grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
              maskImage: "linear-gradient(180deg, rgba(0,0,0,.9), transparent)",
            }}
          />
          {/* Nodes */}
          {[
            { label: "Anviora", className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", core: true },
            { label: "ERP", className: "left-[16%] top-[30%]" },
            { label: "Suppliers", className: "right-[18%] top-[28%]" },
            { label: "Certificates", className: "left-[24%] bottom-[24%]" },
            { label: "Buyers", className: "right-[24%] bottom-[22%]" },
          ].map((n) => (
            <div
              key={n.label}
              className={`absolute min-w-[86px] px-3 py-2 rounded-lg text-center text-xs ${n.className}`}
              style={{
                background: n.core
                  ? "#533afd"
                  : "rgba(83,58,253,.28)",
                border: n.core
                  ? "none"
                  : "1px solid rgba(185,185,249,.28)",
                color: n.core ? "#fff" : "rgba(255,255,255,.82)",
              }}
            >
              {n.label}
            </div>
          ))}
        </motion.div>

        {/* Wave panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative min-h-[260px] rounded-xl overflow-hidden mb-9"
          style={{
            background:
              "radial-gradient(ellipse at 58% 64%, rgba(249,107,238,.6), transparent 25%), radial-gradient(ellipse at 50% 68%, rgba(83,58,253,.75), transparent 38%), #0b1738",
          }}
        >
          <div
            className="absolute left-[-20px] right-[-20px] top-[70px] h-[150px]"
            style={{
              background:
                "repeating-linear-gradient(170deg, rgba(249,107,238,.45) 0 2px, transparent 2px 8px)",
              transform: "perspective(400px) rotateX(58deg)",
              filter: "blur(.3px)",
            }}
          />
        </motion.div>

        {/* Dark stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-7 mb-14">
          {darkStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <strong
                className="block text-white text-[26px] sm:text-[28px] font-light mb-1"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {s.value}
              </strong>
              <span className="text-[12px] text-[rgba(255,255,255,0.56)]">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Path cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {paths.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glow-card p-5.5 rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.09)",
              }}
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
              <h3 className="text-[17px] font-medium text-white mb-2">
                {p.title}
              </h3>
              <p className="text-[13px] leading-[1.48] text-[rgba(255,255,255,0.58)]">
                {p.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
