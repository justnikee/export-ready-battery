"use client";

import { motion } from "framer-motion";

export default function TextileFTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1232px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink text-balance">
              The India–EU FTA is live. Compliance is the new tariff.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-[#131313] text-pretty">
              The India–EU Free Trade Agreement (concluded January 2026) eliminates
              tariffs on most textile exports. But the new non-tariff barrier is
              compliance — and European buyers increasingly ask for:
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Fiber composition disclosure",
                "Chemical compliance (REACH)",
                "Sustainability certifications",
                "Digital product traceability",
              ].map((item) => (
                <li
                  key={item}
                  className="text-[15px] text-crew-ink/70 flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-crew-coral mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[16px] leading-[1.6] text-crew-ink font-medium">
              Anviora Textile gives you the documentation to compete — and win.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-[360px] rounded-[28px] bg-gradient-to-br from-[#0e5a40] to-[#1d9670] p-8 text-center">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-white/70 mb-3">
                India&apos;s annual textile exports to the EU
              </div>
              <div
                className="text-[56px] font-bold tracking-[-0.03em] text-white leading-none"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                $7.6B
              </div>
              <div className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-left">
                <div className="flex items-center justify-between text-[12px] text-white/70 mb-2">
                  <span>Tariff-free under FTA</span>
                  <span className="font-bold text-white">most lines</span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full w-[68%] rounded-full bg-white" />
                </div>
              </div>
              <div className="mt-4 text-[12px] text-white/60">
                The winners will be the ones with the paperwork ready.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
