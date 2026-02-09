"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Linkedin, Twitter } from "lucide-react"

const footerLinks = [
    {
        label: "Product",
        items: [
            { label: "Features", href: "/docs/features" },
            { label: "Pricing", href: "/pricing" },
            { label: "Docs", href: "/docs" },
        ],
    },
    {
        label: "Company",
        items: [
            { label: "About", href: "/about" },
            { label: "Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
        ],
    },
    {
        label: "Legal",
        items: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
        ],
    },
]

export function CTAFooter() {
    return (
        <>
            {/* CTA Section - Primary brand color */}
            <section className="py-24 bg-[#0B1F3B]">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                            Compliance you don&apos;t have to explain.
                        </h2>
                        <p className="text-lg text-slate-300 mb-8">
                            Your batteries are already regulated. The only question is whether your data is audit-ready.
                        </p>

                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center bg-[#1F7A5F] px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-white hover:text-[#0B1F3B]"
                        >
                            Book a Demo
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer - BLACK as requested */}
            <footer className="py-16 bg-black">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <Link href="/" className="text-xl font-heading font-bold text-white">
                                ExportLens
                            </Link>
                            <p className="text-sm text-slate-400 mt-3">
                                Audit-grade battery passports for India and the EU.
                            </p>
                        </div>

                        {/* Links */}
                        {footerLinks.map((group, i) => (
                            <div key={i}>
                                <h4 className="text-sm font-semibold text-white mb-3">
                                    {group.label}
                                </h4>
                                <ul className="space-y-2">
                                    {group.items.map((item, j) => (
                                        <li key={j}>
                                            <Link
                                                href={item.href}
                                                className="text-sm text-slate-400 hover:text-[#1F7A5F] transition-colors"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom */}
                    <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800">
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} ExportLens. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <Link href="mailto:hello@exportlens.com" className="text-slate-500 hover:text-[#1F7A5F] transition-colors">
                                <Mail className="h-5 w-5" />
                            </Link>
                            <Link href="https://linkedin.com" className="text-slate-500 hover:text-[#1F7A5F] transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                            <Link href="https://twitter.com" className="text-slate-500 hover:text-[#1F7A5F] transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
