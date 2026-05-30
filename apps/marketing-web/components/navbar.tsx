"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const productLinks = [
  { label: "Battery Passport", href: "/battery" },
  { label: "Textile DPP", href: "/textile" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  return (
    <>
      <div className="w-full h-16 sm:h-20 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-50 px-6 lg:px-0">
        {/* Horizontal line behind nav */}
        <div className="w-full max-w-[1440px] h-0 absolute left-1/2 -translate-x-1/2 top-8 sm:top-10 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]" />

        {/* Nav pill */}
        <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] lg:max-w-[951px] lg:w-[951px] h-10 sm:h-11 lg:h-12 py-1.5 sm:py-2 px-3 sm:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] rounded-[50px] flex justify-between items-center relative z-30">
          <div className="flex justify-center items-center">
            <Link href="/" className="flex justify-start items-center">
              <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base lg:text-lg font-medium leading-5 font-sans">
                ExportReady
              </div>
            </Link>
            <div className="pl-3 sm:pl-4 lg:pl-5 hidden sm:flex flex-row gap-2 sm:gap-3 lg:gap-4">
              {/* Products dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setProductOpen(true)}
                onMouseLeave={() => setProductOpen(false)}
              >
                <button className="flex justify-start items-center gap-1 text-[rgba(49,45,43,0.80)] text-xs lg:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Products
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${productOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {productOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 pt-2 w-52 z-50"
                    >
                      <div className="bg-white rounded-xl border border-[rgba(55,50,47,0.12)] shadow-lg overflow-hidden z-50">
                        {productLinks.map((p) => (
                          <Link
                            key={p.href}
                            href={p.href}
                            className="block px-4 py-3 text-sm font-medium text-[#49423D] hover:bg-[#F7F5F3] transition-colors"
                          >
                            {p.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex justify-start items-center text-[rgba(49,45,43,0.80)] text-xs lg:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="h-6 sm:h-7 lg:h-8 flex justify-start items-start gap-2 sm:gap-3">
            <Link
              href="/request-access"
              className="px-2 sm:px-3 lg:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center hover:bg-[#FBFAF9] transition-colors"
            >
              <div className="flex flex-col justify-center text-[#37322F] text-xs lg:text-[13px] font-medium leading-5 font-sans">
                Request Access
              </div>
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1.5 rounded-full hover:bg-[rgba(55,50,47,0.04)] transition-colors"
            >
              {menuOpen ? <X className="w-4 h-4 text-[#37322F]" /> : <Menu className="w-4 h-4 text-[#37322F]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 bg-[#F7F5F3] border-b border-[rgba(55,50,47,0.12)] sm:hidden"
          >
            <div className="px-6 py-4 space-y-1">
              <p className="px-3 py-2 text-xs font-medium text-[#605A57] uppercase tracking-wider">Products</p>
              {productLinks.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#49423D] hover:bg-white"
                >
                  {p.label}
                </Link>
              ))}
              <div className="my-2 border-t border-[rgba(55,50,47,0.08)]" />
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#49423D] hover:bg-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
