"use client";

import { motion } from "framer-motion";

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)]">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  );
}

const steps = [
  {
    num: "01",
    title: "Upload Your Batch",
    body: "Upload your production data — serial numbers, chemistry, test certificates. Our system reads BIS, UN38.3, IEC 62133, and MSDS PDFs to auto-fill 40+ compliance fields.",
  },
  {
    num: "02",
    title: "Validate Against Live Regulations",
    body: "We check your data against EU Battery Regulation 2023/1542, REACH, and India BIS/CPCB rules in real time. Gaps are flagged before they become problems.",
  },
  {
    num: "03",
    title: "Generate the Passport",
    body: "Every battery gets a unique QR code. Scan it and see: chemistry, carbon footprint, recycling info, supply chain provenance — everything EU buyers are legally required to verify.",
  },
  {
    num: "04",
    title: "Ship with Confidence",
    body: "Your passport is blockchain-anchored for immutable proof. Your buyer verifies compliance in 10 seconds. Customs clears your container. You invoice.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[837px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1V11M8.5 3H4.75C4.28587 3 3.84075 3.18437 3.51256 3.51256C3.18437 3.84075 3 4.28587 3 4.75C3 5.21413 3.18437 5.65925 3.51256 5.98744C3.84075 6.31563 4.28587 6.5 4.75 6.5H7.25C7.71413 6.5 8.15925 6.68437 8.48744 7.01256C8.81563 7.34075 9 7.78587 9 8.25C9 8.71413 8.81563 9.15925 8.48744 9.48744C8.15925 9.81563 7.71413 10 7.25 10H3.5" stroke="#37322F" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            text="How It Works"
          />
          <div className="w-full max-w-[812px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            From factory floor to EU shelf.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            Four steps. No consultants. No 200-page regulation PDFs.
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 ${
                i < 2 ? "border-b" : ""
              } ${i % 2 === 0 ? "sm:border-r" : ""} border-[rgba(55,50,47,0.12)]`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[rgba(55,50,47,0.12)] flex items-center justify-center shadow-[0px_1px_2px_rgba(55,50,47,0.06)]">
                  <span className="text-sm font-medium text-[#37322F] font-sans">{step.num}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                  {step.title}
                </h3>
                <p className="text-[#605A57] text-sm sm:text-base font-normal leading-relaxed font-sans">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
