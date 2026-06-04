"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[620px] pt-[150px] pb-10 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[120px] -right-[160px] w-[610px] h-[690px] opacity-[0.98]"
          style={{
            background: `
              radial-gradient(circle at 34% 18%, #ffb13b 0 13%, transparent 33%),
              radial-gradient(circle at 63% 26%, #ff6b2e 0 16%, transparent 36%),
              radial-gradient(circle at 44% 54%, #f96bee 0 21%, transparent 46%),
              radial-gradient(circle at 76% 68%, #533afd 0 22%, transparent 44%),
              linear-gradient(145deg, #f5e9d4 0%, #ff8b2f 22%, #f96bee 56%, #533afd 100%)
            `,
            clipPath: "polygon(24% 0, 100% 0, 78% 100%, 0 100%)",
            transform: "rotate(18deg) skewY(-8deg)",
          }}
        />
        {/* White fade overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.1) 0%, rgba(255,255,255,.78) 78%, #f6f9fc 100%)",
          }}
        />
      </div>

      <div className="relative z-[2] max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[455px_1fr] gap-10 lg:gap-16 items-start">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-4"
          >
            <div className="text-[#533afd] text-[13px] font-medium mb-3.5">
              Digital product passport infrastructure
            </div>
            <h1 className="max-w-[455px] text-[#0d253d] text-[34px] sm:text-[43px] font-light leading-[1.05] tracking-normal">
              Compliance infrastructure to grow your{" "}
              <span className="text-[#533afd]">export revenue</span>.
            </h1>
            <p className="max-w-[430px] mt-4 text-[16px] leading-[1.55] text-[#64748d]">
              Create verifiable digital passports, supplier records, and audit evidence
              for Indian battery and textile manufacturers selling into Europe.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-5">
              <a
                href="/demo"
                className="inline-flex items-center justify-center gap-1.5 h-[34px] px-4 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                style={{ background: "#533afd" }}
              >
                Request access
              </a>
              <a
                href="#product"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#533afd] hover:underline"
              >
                Explore platform <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Stage — phone + panel mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative hidden lg:block min-h-[438px]"
          >
            {/* Phone */}
            <div
              className="absolute left-[42px] top-[102px] w-[145px] h-[292px] p-[9px] rounded-[28px]"
              style={{
                background: "#0f1b4f",
                transform: "rotate(-6deg)",
                boxShadow: "rgba(0,55,112,.24) 0 24px 50px",
              }}
            >
              <div className="h-full rounded-[20px] bg-white px-3 py-4">
                <div className="w-10 h-[5px] mx-auto mb-6 rounded-full bg-[#e3e8ee]" />
                <div className="text-[#0d253d] text-[21px] leading-[1.08] font-light">
                  Passport<br />LFP-B4471
                </div>
                <div className="mt-4 text-[11px] leading-[1.35] text-[#64748d]">
                  Verified for EU buyer review
                </div>
                <div className="grid gap-2 mt-7">
                  <div className="h-[9px] rounded-full bg-[#f6f9fc]" />
                  <div className="h-[9px] w-[72%] rounded-full bg-[rgba(83,58,253,.16)]" />
                  <div className="h-[9px] w-[55%] rounded-full bg-[#f6f9fc]" />
                </div>
              </div>
            </div>

            {/* Panel */}
            <div
              className="absolute left-[190px] top-[180px] w-[320px] p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,.94)",
                border: "1px solid rgba(227,232,238,.86)",
                boxShadow: "rgba(0,55,112,.16) 0 24px 58px",
              }}
            >
              <div className="flex items-center justify-between mb-4 text-[#273951] text-[13px] font-medium">
                <span>Anviora Control</span>
                <strong className="text-[#533afd] text-[29px] font-light" style={{ fontFeatureSettings: '"tnum"' }}>
                  84%
                </strong>
              </div>
              <div className="flex justify-between gap-3.5 py-2.5 border-t border-[#e3e8ee] text-[12px] text-[#64748d]">
                <span>Traceability</span>
                <b className="text-[#0d253d] font-medium whitespace-nowrap">Complete</b>
              </div>
              <div className="flex justify-between gap-3.5 py-2.5 border-t border-[#e3e8ee] text-[12px] text-[#64748d]">
                <span>Certificates</span>
                <b className="text-[#0d253d] font-medium whitespace-nowrap">312 linked</b>
              </div>
              <div className="flex justify-between gap-3.5 py-2.5 border-t border-[#e3e8ee] text-[12px] text-[#64748d]">
                <span>Supplier gaps</span>
                <b className="text-[#0d253d] font-medium whitespace-nowrap">17 open</b>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
