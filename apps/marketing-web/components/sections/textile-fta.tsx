"use client";

import { motion } from "framer-motion";

export default function TextileFTA() {
  return (
    <section className="py-[88px] bg-crew-paper">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink">
              The India–EU FTA is live. Compliance is the new tariff.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-[#131313]">
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
                  className="text-[15px] text-crew-muted flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-crew-coral mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[16px] leading-[1.6] text-crew-ink font-medium">
              Anviora Textile gives you the documentation to compete — and win.
            </p>
          </div>

          <div className="flex justify-center">
            <div
              className="w-full max-w-[320px] p-6 rounded-2xl text-center"
              style={{
                background:
                  "linear-gradient(135deg, #0e5a40 0%, #16785a 45%, #4f9e80 100%)",
              }}
            >
              <div className="bg-white/95 rounded-lg p-5 backdrop-blur">
                <div className="text-[12px] text-crew-muted mb-1">
                  India&apos;s annual textile exports to EU
                </div>
                <div
                  className="text-[40px] font-bold tracking-[-0.03em] text-crew-ink"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  $7.6B
                </div>
                <div className="mt-3 h-2 rounded-full bg-crew-paper-soft overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "68%",
                      background: "linear-gradient(90deg, #157a5b, #1d9670)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
