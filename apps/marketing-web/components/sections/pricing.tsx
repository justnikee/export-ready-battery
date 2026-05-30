"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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

const plans = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "one-time",
    desc: "For small exporters testing the EU market",
    activations: "10 batch activations",
    features: [
      "EU Battery Passport (2023/1542)",
      "India BIS / CPCB compliance",
      "QR-code generation",
      "Standard PDF labels",
      "CSV data import",
      "Email support",
    ],
    cta: "Request Access",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹19,999",
    period: "one-time",
    desc: "For growing exporters with regular EU shipments",
    activations: "50 batch activations",
    features: [
      "Everything in Starter",
      "Textile DPP support",
      "AI certificate parsing",
      "Blockchain traceability",
      "Real-time compliance alerts",
      "Importer mode (China/Korea)",
      "REST API access",
      "WhatsApp priority support",
    ],
    cta: "Request Access",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large manufacturers with complex supply chains",
    activations: "200+ batch activations",
    features: [
      "Everything in Growth",
      "Unlimited team members",
      "Custom ERP integrations",
      "On-premise deployment option",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label passports",
      "Custom label formats",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="w-full flex flex-col justify-center items-center gap-2">
      {/* Header */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[796px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1V11M8.5 3H4.75C4.28587 3 3.84075 3.18437 3.51256 3.51256C3.18437 3.84075 3 4.28587 3 4.75C3 5.21413 3.18437 5.65925 3.51256 5.98744C3.84075 6.31563 4.28587 6.5 4.75 6.5H7.25C7.71413 6.5 8.15925 6.68437 8.48744 7.01256C8.81563 7.34075 9 7.78587 9 8.25C9 8.71413 8.81563 9.15925 8.48744 9.48744C8.15925 9.81563 7.71413 10 7.25 10H3.5" stroke="#37322F" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            text="Plans & Pricing"
          />
          <div className="self-stretch text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Pay per batch. Not per month.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            Buy activations once. Use them whenever you ship.
            <br className="hidden sm:block" />
            No subscriptions. No surprise bills.
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="self-stretch border-b border-t border-[rgba(55,50,47,0.12)] flex justify-center items-center">
        <div className="flex justify-center items-start w-full">
          {/* Left Decorative Pattern */}
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  key={i}
                  className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                />
              ))}
            </div>
          </div>

          {/* Cards Container */}
          <div className="flex-1 flex flex-col md:flex-row justify-center items-stretch gap-0">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex-1 max-w-full md:max-w-none self-stretch px-6 sm:px-8 py-8 sm:py-10 overflow-hidden flex flex-col justify-start items-start gap-10 sm:gap-12 ${
                  plan.highlighted
                    ? "bg-[#37322F] border border-[rgba(55,50,47,0.12)]"
                    : "bg-white border border-[#E0DEDB]"
                } ${i < plans.length - 1 ? "border-b md:border-b-0 md:border-r" : ""}`}
              >
                {/* Plan Header */}
                <div className="self-stretch flex flex-col justify-start items-start gap-8 sm:gap-9">
                  <div className="self-stretch flex flex-col justify-start items-start gap-2">
                    <div className={`text-lg font-medium leading-7 font-sans ${plan.highlighted ? "text-[#FBFAF9]" : "text-[rgba(55,50,47,0.90)]"}`}>
                      {plan.name}
                    </div>
                    <div className={`w-full max-w-[242px] text-sm font-normal leading-5 font-sans ${plan.highlighted ? "text-[#B2AEA9]" : "text-[rgba(41,37,35,0.70)]"}`}>
                      {plan.desc}
                    </div>
                  </div>

                  <div className="self-stretch flex flex-col justify-start items-start gap-2">
                    <div className="flex flex-col justify-start items-start gap-1">
                      <div className={`text-4xl sm:text-5xl font-medium leading-[60px] font-serif ${plan.highlighted ? "text-[#F0EFEE]" : "text-[#37322F]"}`}>
                        {plan.price}
                      </div>
                      <div className={`text-sm font-medium font-sans ${plan.highlighted ? "text-[#D2C6BF]" : "text-[#847971]"}`}>
                        {plan.period}{plan.period ? ", " : ""}{plan.activations}
                      </div>
                    </div>
                  </div>

                  <a
                    href={plan.name === "Enterprise" ? "mailto:founders@exportready.io" : "/request-access"}
                    className={`self-stretch px-4 py-[10px] relative overflow-hidden rounded-[99px] flex justify-center items-center transition-colors ${
                      plan.highlighted
                        ? "bg-[#FBFAF9] shadow-[0px_2px_4px_rgba(55,50,47,0.12)] hover:bg-white"
                        : "bg-[#37322F] shadow-[0px_2px_4px_rgba(55,50,47,0.12)] hover:bg-[#2A2520]"
                    }`}
                  >
                    {!plan.highlighted && (
                      <div className="w-full h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0.20)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
                    )}
                    <span className={`text-[13px] font-medium leading-5 font-sans ${plan.highlighted ? "text-[#37322F]" : "text-[#FBFAF9]"}`}>
                      {plan.cta}
                    </span>
                  </a>
                </div>

                {/* Features */}
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="self-stretch flex justify-start items-center gap-[13px]">
                      <div className="w-4 h-4 relative flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke={plan.highlighted ? "#D2C6BF" : "#9CA3AF"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className={`flex-1 text-[12.5px] font-normal leading-5 font-sans ${plan.highlighted ? "text-[#F0EFEE]" : "text-[rgba(55,50,47,0.80)]"}`}>
                        {feature}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Decorative Pattern */}
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  key={i}
                  className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
