"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const links = {
  Product: [
    { label: "Battery Passport", href: "/battery" },
    { label: "Textile DPP", href: "/textile" },
    { label: "Pricing", href: "#pricing" },
    { label: "API", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Regulation Tracker", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "mailto:founders@exportready.io" },
    { label: "Press Kit", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full flex flex-col justify-start items-start">
      {/* CTA Strip */}
      <div className="self-stretch border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-4 w-full rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                style={{
                  top: `${i * 16 - 120}px`,
                  left: "-100%",
                  width: "300%",
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="self-stretch px-6 md:px-24 py-12 md:py-16 flex justify-center items-center gap-6 relative z-10"
        >
          <div className="w-full max-w-[1440px] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#49423D]">
                Stop studying regulations. Start shipping.
              </h3>
              <p className="mt-3 text-[#605A57] max-w-md text-sm leading-relaxed">
                Your competitors are already digitizing compliance. In 12 months, EU Battery Passports will be mandatory.
                The question isn&apos;t whether you&apos;ll need this — it&apos;s whether you&apos;ll be ready.
              </p>
            </div>
            <a
              href="/request-access"
              className="h-10 px-8 lg:px-12 py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center gap-2 hover:bg-[#2A2520] transition-colors shrink-0"
            >
              <div className="w-44 h-[41px] absolute left-0 top-0 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
              <span className="flex flex-col justify-center text-white text-[13px] font-medium leading-5 font-sans relative z-10">
                Request Access
              </span>
              <ArrowRight className="w-4 h-4 text-white relative z-10" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Main Footer Content */}
      <div className="self-stretch h-auto flex flex-col md:flex-row justify-between items-stretch pr-0 pb-8 pt-0 border-b border-[rgba(55,50,47,0.12)]">
        <div className="h-auto p-4 md:p-8 flex flex-col justify-start items-start gap-8">
          {/* Brand Section */}
          <div className="self-stretch flex justify-start items-center gap-3">
            <div className="text-center text-[#49423D] text-xl font-semibold leading-4 font-sans">
              ExportReady
            </div>
          </div>
          <div className="text-[rgba(73,66,61,0.90)] text-sm font-medium leading-[18px] font-sans">
            Compliance documentation for Indian manufacturers.
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-start items-start gap-4">
            {/* LinkedIn Icon */}
            <a href="#" className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"
                  fill="#49423D"
                />
              </svg>
            </a>
            {/* Twitter/X Icon */}
            <a href="#" className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                  fill="#49423D"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="self-stretch p-4 md:p-8 flex flex-col sm:flex-row flex-wrap justify-start sm:justify-between items-start gap-6 md:gap-8">
          {Object.entries(links).map(([category, items]) => (
            <div key={category} className="flex flex-col justify-start items-start gap-3 flex-1 min-w-[120px]">
              <div className="self-stretch text-[rgba(73,66,61,0.50)] text-sm font-medium leading-5 font-sans">
                {category}
              </div>
              <div className="flex flex-col justify-end items-start gap-2">
                {items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-[#49423D] text-sm font-normal leading-5 font-sans cursor-pointer hover:text-[#37322F] transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section with Pattern */}
      <div className="self-stretch h-12 relative overflow-hidden border-b border-[rgba(55,50,47,0.12)]">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 400 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[300px] h-16 border border-[rgba(3,7,18,0.08)]"
                style={{
                  left: `${i * 300 - 600}px`,
                  top: "-120px",
                  transform: "rotate(-45deg)",
                  transformOrigin: "top left",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="self-stretch px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1440px] mx-auto w-full">
        <p className="text-xs text-[#847971]">
          ExportReady is a product of AnvayaLabs. Built in India for Indian manufacturers.
        </p>
        <div className="flex items-center gap-5">
          <span className="text-xs text-[#847971]">
            &copy; {new Date().getFullYear()} ExportReady
          </span>
        </div>
      </div>
    </footer>
  );
}
