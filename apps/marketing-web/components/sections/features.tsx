"use client";

import { motion } from "framer-motion";
import { ArrowRight, Battery, Shirt, Repeat, Server, Factory } from "lucide-react";

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

const products = [
  {
    icon: Battery,
    name: "Battery Passport",
    description:
      "Full compliance with EU Battery Regulation 2023/1542. Carbon footprint declaration. Recycled content tracking. Due diligence documentation. BIS, EPR, UN38.3, IEC 62133 integration.",
    href: "/battery",
  },
  {
    icon: Shirt,
    name: "Textile DPP",
    description:
      "Digital Product Passports for textile exports. Fiber composition tracking. OEKO-TEX and GOTS certification management. REACH compliance. Supply chain tier mapping.",
    href: "/textile",
  },
];

const differentiators = [
  {
    icon: Repeat,
    title: "We Don't Do Subscriptions",
    body: "Most compliance tools charge you monthly whether you ship or not. We charge per batch activation. Buy 10 activations. Use them over 6 months. No recurring fees. No surprise bills when your factory is closed for Diwali.",
  },
  {
    icon: Server,
    title: "Your Data Stays in India",
    body: "Production data, certificate PDFs, and compliance records are stored on Indian infrastructure. EU buyers see only what regulations require — never your cost structure or supplier list.",
  },
  {
    icon: Factory,
    title: "We Speak Manufacturer",
    body: "Our onboarding asks for your BIS R-number and IEC code — not your 'monthly recurring revenue.' Our support team knows what a Bill of Entry is. Our product is built from factory visits, not boardroom presentations.",
  },
];

export default function Features() {
  return (
    <section id="features" className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Platform Header */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[837px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="7" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="1" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="7" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
              </svg>
            }
            text="Platform"
          />
          <div className="w-full max-w-[812px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            One platform. Two products. Every market.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            Whether you make Li-ion batteries in Gujarat or textiles in Tiruppur, the same platform handles your compliance.
          </div>
        </div>
      </div>

      {/* Product Cards */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
          {products.map((p, i) => (
            <motion.a
              key={p.name}
              href={p.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 group cursor-pointer ${
                i === 0 ? "border-b md:border-b-0 md:border-r" : ""
              } border-[rgba(55,50,47,0.12)] hover:bg-white transition-colors`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#F7F5F3] border border-[rgba(55,50,47,0.08)] flex items-center justify-center">
                <p.icon className="w-6 h-6 text-[#49423D]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                  {p.name}
                </h3>
                <p className="text-[#605A57] text-sm sm:text-base font-normal leading-relaxed font-sans">
                  {p.description}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#49423D] group-hover:text-[#37322F] transition-colors">
                Explore {p.name.split(" ")[0]}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </motion.a>
          ))}
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Why ExportReady Header */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-t border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[837px] lg:w-[837px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="3" width="4" height="6" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="7" y="1" width="4" height="8" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="2" y="4" width="1" height="1" fill="#37322F" />
                <rect x="3.5" y="4" width="1" height="1" fill="#37322F" />
                <rect x="2" y="5.5" width="1" height="1" fill="#37322F" />
                <rect x="3.5" y="5.5" width="1" height="1" fill="#37322F" />
                <rect x="8" y="2" width="1" height="1" fill="#37322F" />
                <rect x="9.5" y="2" width="1" height="1" fill="#37322F" />
                <rect x="8" y="3.5" width="1" height="1" fill="#37322F" />
                <rect x="9.5" y="3.5" width="1" height="1" fill="#37322F" />
                <rect x="8" y="5" width="1" height="1" fill="#37322F" />
                <rect x="9.5" y="5" width="1" height="1" fill="#37322F" />
              </svg>
            }
            text="Why ExportReady"
          />
          <div className="w-full max-w-[812px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Built different.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            Three reasons Indian manufacturers choose us over generic compliance tools.
          </div>
        </div>
      </div>

      {/* Differentiators */}
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

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
          {differentiators.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 ${
                i < differentiators.length - 1 ? "border-b md:border-b-0 md:border-r" : ""
              } border-[rgba(55,50,47,0.12)]`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#F7F5F3] border border-[rgba(55,50,47,0.08)] flex items-center justify-center">
                <d.icon className="w-5 h-5 text-[#49423D]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                  {d.title}
                </h3>
                <p className="text-[#605A57] text-sm sm:text-base font-normal leading-relaxed font-sans">
                  {d.body}
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
