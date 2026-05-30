"use client";

import { motion } from "framer-motion";
import { Container, FileX, AlertTriangle } from "lucide-react";

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

const scenarios = [
  {
    icon: Container,
    title: "The Rotterdam Checkpoint",
    body: "Your container reaches Rotterdam. Customs flags a missing CE marking declaration. Your buyer's €800K order sits in a bonded warehouse for 18 days. You pay ₹2.3L in demurrage. The buyer sources from Vietnam next quarter.",
  },
  {
    icon: FileX,
    title: "The Tender You Didn't Know About",
    body: "A German OEM publishes a tender requiring EU Battery Passports by 2027. Your sales team never sees it. Your competitor — who started digitizing compliance 8 months ago — bids unopposed and wins a 3-year contract.",
  },
  {
    icon: AlertTriangle,
    title: "The Certificate That Expired",
    body: "Your BIS certificate lapsed 6 weeks ago. Nobody noticed because it's filed in a PDF folder on someone's laptop. Your next batch can't be activated. Your production line stops for 4 days while you scramble for renewal.",
  },
];

export default function Problem() {
  return (
    <section className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[796px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
          <Badge
            icon={<AlertTriangle className="w-3.5 h-3.5 text-[#37322F]" />}
            text="The Problem"
          />
          <div className="w-full max-w-[641px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Three ways compliance kills your deal.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            These aren&apos;t hypotheticals. These are Monday mornings for Indian exporters who thought their product quality was enough.
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 ${
                i < scenarios.length - 1 ? "border-b md:border-b-0 md:border-r" : ""
              } border-[rgba(55,50,47,0.12)]`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#F7F5F3] border border-[rgba(55,50,47,0.08)] flex items-center justify-center">
                <s.icon className="w-5 h-5 text-[#49423D]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                  {s.title}
                </h3>
                <p className="text-[#605A57] text-sm sm:text-base font-normal leading-relaxed font-sans">
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 80 }).map((_, i) => (
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
