"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Battery, Shield, FileText, Globe, Zap, Bell } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";

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

const complianceItems = [
  { label: "Carbon Footprint (Art. 7)", icon: Zap },
  { label: "Recycled Content (Art. 8)", icon: Shield },
  { label: "Due Diligence (Art. 11)", icon: FileText },
  { label: "Performance (Annex IV)", icon: Battery },
  { label: "Passport (Art. 77)", icon: Globe },
  { label: "CE Marking & DoC", icon: Check },
  { label: "REACH / RoHS", icon: Shield },
  { label: "BIS IS 16046", icon: Check },
  { label: "CPCB EPR", icon: Check },
  { label: "UN38.3 / IEC 62133", icon: Check },
];

const workflowSteps = [
  {
    title: "Upload Batch Data",
    body: "Import serial numbers, chemistry specs, and certificate PDFs. Our AI reads BIS, UN38.3, IEC 62133, and MSDS documents to auto-fill compliance fields.",
  },
  {
    title: "Run Compliance Check",
    body: "Real-time validation against EU Battery Regulation 2023/1542 and India BIS/CPCB rules. Get a score from 0-100 with specific gaps flagged.",
  },
  {
    title: "Generate Passports",
    body: "Every battery unit gets a unique QR code. The passport includes: chemistry, carbon class, recycling info, due diligence status, and supply chain provenance.",
  },
  {
    title: "Print & Ship",
    body: "Generate industrial PDF labels with QR codes. Blockchain-anchor the certificate for immutable proof. Your buyer scans and verifies in 10 seconds.",
  },
];

const certItems = [
  { name: "BIS Certificate", validity: "24 months", alert: "90 days before expiry" },
  { name: "UN38.3 Test Report", validity: "24 months", alert: "90 days before expiry" },
  { name: "IEC 62133 Report", validity: "36 months", alert: "90 days before expiry" },
  { name: "MSDS / SDS", validity: "36 months", alert: "90 days before expiry" },
];

export default function BatteryPage() {
  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1440px] lg:w-[1440px] relative flex flex-col justify-start items-start min-h-screen">
          <div className="self-stretch pt-[9px] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            <Navbar />
            <main className="self-stretch w-full bg-[#F7F5F3]">
      {/* Hero */}
      <section className="pt-28 sm:pt-32 lg:pt-48 pb-16 sm:pb-20 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-0 relative flex flex-col justify-start items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[1273px] flex flex-col justify-center items-center gap-4 sm:gap-6"
          >
            <Badge
              icon={<Battery className="w-3.5 h-3.5 text-[#37322F]" />}
              text="Battery Passport"
            />
            <h1 className="w-full max-w-[1016px] text-center flex justify-center flex-col text-[#37322F] text-[28px] sm:text-[40px] md:text-[52px] lg:text-[64px] font-normal leading-[1.1] sm:leading-[1.15] lg:leading-[1.1] font-serif text-balance">
              EU Battery Regulation compliance, built for Indian Li-ion manufacturers.
            </h1>
            <p className="w-full max-w-[687px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] text-sm sm:text-base lg:text-lg leading-[1.4] sm:leading-[1.45] lg:leading-7 font-sans font-medium">
              From BIS certification to blockchain-anchored EU Battery Passports. One platform. Zero consultants.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href="/request-access"
                className="h-10 sm:h-11 lg:h-12 px-8 sm:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center gap-2 hover:bg-[#2A2520] transition-colors group"
              >
                <div className="w-20 sm:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
                <span className="flex flex-col justify-center text-white text-sm sm:text-base font-medium leading-5 font-sans relative z-10">
                  Request Access
                </span>
                <ArrowRight className="w-4 h-4 text-white relative z-10 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <Link
                href="/"
                className="h-10 sm:h-11 lg:h-12 px-6 sm:px-8 py-2 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center gap-2 hover:bg-[#FBFAF9] transition-colors"
              >
                <span className="flex flex-col justify-center text-[#37322F] text-sm sm:text-base font-medium leading-5 font-sans">
                  Back to Homepage
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Regulation */}
      <section className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
        <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
          <div className="w-full max-w-[796px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
            <Badge
              icon={<FileText className="w-3.5 h-3.5 text-[#37322F]" />}
              text="The Regulation"
            />
            <div className="w-full max-w-[641px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
              EU Battery Regulation 2023/1542
            </div>
            <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
              Starting February 2027, every battery sold in the EU must have a digital passport.
              <br className="hidden sm:block" />
              Indian manufacturers need both BIS/EPR and EU compliance — ExportReady handles both.
            </div>
          </div>
        </div>

        <div className="self-stretch flex justify-center items-start">
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
            {/* Left - Explanation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 border-b lg:border-b-0 lg:border-r border-[rgba(55,50,47,0.12)]"
            >
              <div className="space-y-4 text-[#605A57] text-sm sm:text-base leading-relaxed font-sans">
                <p>
                  Starting February 2027, every battery sold in the European Union must have a digital passport.
                  This isn&apos;t a suggestion — it&apos;s law. And the requirements are extensive.
                </p>
                <p>
                  Indian manufacturers face a unique challenge: you need to comply with both Indian regulations (BIS, EPR, BWM)
                  AND EU regulations (Battery Regulation, REACH, RoHS) — often with the same batch of batteries.
                </p>
                <p>
                  ExportReady handles both. One upload. Two compliant outputs.
                </p>
              </div>
            </motion.div>

            {/* Right - Compliance Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6"
            >
              <h3 className="text-sm font-semibold text-[#37322F] mb-2">
                What&apos;s Required (and what we cover)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {complianceItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#F7F5F3] border border-[rgba(55,50,47,0.08)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#49423D]" />
                    </div>
                    <span className="text-sm text-[#49423D]">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dual Mode */}
      <section className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
        <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
          <div className="w-full max-w-[837px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
            <Badge
              icon={<Globe className="w-3.5 h-3.5 text-[#37322F]" />}
              text="Dual Compliance"
            />
            <div className="w-full max-w-[812px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
              India + EU Dual Mode
            </div>
            <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
              The same batch generates both India BIS/EPR documentation and EU Battery Passport.
              <br className="hidden sm:block" />
              One upload. Two outputs. Zero duplication.
            </div>
          </div>
        </div>

        <div className="self-stretch flex justify-center items-start">
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
            {/* India Card */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 border-b md:border-b-0 md:border-r border-[rgba(55,50,47,0.12)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#F7F5F3] border border-[rgba(55,50,47,0.08)] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#49423D]">IN</span>
                </div>
                <h3 className="font-semibold text-[#37322F] text-lg">India Compliance</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#605A57]">
                {[
                  "BIS IS 16046 certification tracking",
                  "CPCB EPR registration",
                  "BWM Rules 2022 documentation",
                  "PLI Phase II reporting",
                  "HSN code & customs Bill of Entry",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#49423D] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* EU Card */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#37322F] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">EU</span>
                </div>
                <h3 className="font-semibold text-[#37322F] text-lg">EU Compliance</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#605A57]">
                {[
                  "Battery Passport (Art. 77)",
                  "Carbon footprint declaration",
                  "Recycled content reporting",
                  "Due diligence policy",
                  "CE marking & Declaration of Conformity",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#49423D] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
        <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
          <div className="w-full max-w-[837px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
            <Badge
              icon={<Zap className="w-3.5 h-3.5 text-[#37322F]" />}
              text="Workflow"
            />
            <div className="w-full max-w-[812px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
              How Battery Passport Works
            </div>
          </div>
        </div>

        <div className="self-stretch flex justify-center items-start">
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-start items-start gap-4 sm:gap-6 ${
                  i < 3 ? "border-b lg:border-b-0" : ""
                } ${i < workflowSteps.length - 1 ? "sm:border-r" : ""} border-[rgba(55,50,47,0.12)]`}
              >
                <div className="text-4xl font-bold text-[#E0DEDB] mb-1">0{i + 1}</div>
                <h3 className="text-lg font-semibold text-[#37322F]">{step.title}</h3>
                <p className="text-sm text-[#605A57] leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Management */}
      <section className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
        <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
          <div className="w-full max-w-[837px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
            <Badge
              icon={<Bell className="w-3.5 h-3.5 text-[#37322F]" />}
              text="Certificate Management"
            />
            <div className="w-full max-w-[812px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
              Never let a certificate expire silently again.
            </div>
          </div>
        </div>

        <div className="self-stretch flex justify-center items-start">
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
            {certItems.map((cert, i) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`p-6 sm:p-8 flex flex-col justify-start items-start gap-3 ${
                  i < certItems.length - 1 ? "border-b sm:border-b-0 sm:border-r" : ""
                } border-[rgba(55,50,47,0.12)]`}
              >
                <h3 className="text-sm font-semibold text-[#37322F]">{cert.name}</h3>
                <p className="text-xs text-[#605A57]">Valid for {cert.validity}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#847971] bg-[#F7F5F3] px-2.5 py-1 rounded-full border border-[rgba(55,50,47,0.08)]">
                  <Bell className="w-3 h-3" />
                  {cert.alert}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
        <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 py-12 sm:py-16 lg:py-20 flex justify-center items-center gap-6">
          <div className="w-full max-w-[796px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-start items-center gap-3 sm:gap-4">
            <div className="self-stretch text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
              Simple, one-time pricing
            </div>
            <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
              Pay per batch activation. No subscriptions. No recurring fees. Your activations never expire.
            </div>
          </div>
        </div>

        <div className="self-stretch flex justify-center items-start pb-12 sm:pb-16 lg:pb-20">
          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
            {[
              { name: "Starter", price: "₹4,999", activations: "10 batches" },
              { name: "Growth", price: "₹19,999", activations: "50 batches", popular: true },
              { name: "Enterprise", price: "Custom", activations: "200+ batches" },
            ].map((plan, i) => (
              <div
                key={plan.name}
                className={`p-6 sm:p-8 flex flex-col justify-start items-start gap-4 ${
                  i < 2 ? "border-b sm:border-b-0 sm:border-r" : ""
                } ${plan.popular ? "bg-[#37322F]" : "bg-white"} border-[rgba(55,50,47,0.12)]`}
              >
                {plan.popular && (
                  <span className="inline-block text-[10px] font-semibold bg-white text-[#37322F] px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    Most Popular
                  </span>
                )}
                <p className={`text-sm font-semibold ${plan.popular ? "text-white" : "text-[#37322F]"}`}>{plan.name}</p>
                <p className={`text-2xl font-bold font-serif mt-1 ${plan.popular ? "text-[#F0EFEE]" : "text-[#37322F]"}`}>{plan.price}</p>
                <p className={`text-xs font-medium mt-1 ${plan.popular ? "text-[#D2C6BF]" : "text-[#847971]"}`}>{plan.activations}</p>
              </div>
            ))}
          </div>

          <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden hidden sm:block">
            <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
              ))}
            </div>
          </div>
        </div>

        <div className="pb-12 sm:pb-16 lg:pb-20">
          <a
            href="/request-access"
            className="h-10 sm:h-11 lg:h-12 px-8 sm:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center gap-2 hover:bg-[#2A2520] transition-colors group"
          >
            <div className="w-20 sm:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
            <span className="flex flex-col justify-center text-white text-sm sm:text-base font-medium leading-5 font-sans relative z-10">
              Request Access
            </span>
            <ArrowRight className="w-4 h-4 text-white relative z-10 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer link */}
      <section className="py-12 border-t border-[rgba(55,50,47,0.12)] w-full">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-[#605A57] hover:text-[#37322F] transition-colors">
            &larr; Back to Homepage
          </Link>
          <Link href="/textile" className="text-sm text-[#49423D] hover:text-[#37322F] font-medium transition-colors">
            Explore Textile DPP &rarr;
          </Link>
        </div>
      </section>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
