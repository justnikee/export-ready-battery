"use client";

import { motion } from "framer-motion";

export default function TextileFTA() {
  return (
    <section className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-[28px] sm:text-[36px] font-light leading-[1.12] text-[#0d253d]">
              The India-EU FTA Is Live. Compliance Is the New Tariff.
            </h2>
            <p className="mt-4 text-[16px] leading-[1.55] text-[#64748d]">
              The India-EU Free Trade Agreement (concluded January 2026)
              eliminates tariffs on most textile exports. But the new non-tariff
              barrier is compliance. European buyers now require:
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
                  className="text-[14px] text-[#64748d] flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#533afd] mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[16px] leading-[1.55] text-[#0d253d] font-medium">
              Anviora Textile gives you the documentation to compete — and win.
            </p>
          </div>

          <div className="flex justify-center">
            <div
              className="w-full max-w-[320px] p-6 rounded-xl text-center"
              style={{
                background:
                  "linear-gradient(135deg, #f5e9d4 0%, #ff8b2f 22%, #f96bee 56%, #533afd 100%)",
              }}
            >
              <div className="bg-white/95 rounded-lg p-5 backdrop-blur">
                <div className="text-[12px] text-[#64748d] mb-1">
                  India&apos;s annual textile exports to EU
                </div>
                <div
                  className="text-[36px] font-light text-[#0d253d]"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  $7.6B
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#f6f9fc] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "68%",
                      background: "linear-gradient(90deg, #533afd, #f96bee)",
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
