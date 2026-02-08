"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Linkedin, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

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
            {/* CTA Section - Dark, decisive */}
            <section className="py-24 bg-zinc-950">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Compliance you don&apos;t have to explain.
                        </h2>
                        <p className="text-lg text-zinc-400 mb-8">
                            Your batteries are already regulated. The only question is whether your data is audit-ready.
                        </p>

                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-8 text-base bg-emerald-500 text-white hover:bg-emerald-600 font-semibold border-0 rounded-lg"
                        >
                            <Link href="/contact">
                                Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-white border-t border-zinc-200">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <Link href="/" className="text-xl font-bold text-zinc-900">
                                ExportLens
                            </Link>
                            <p className="text-sm text-zinc-500 mt-3">
                                Audit-grade battery passports for India and the EU.
                            </p>
                        </div>

                        {/* Links */}
                        {footerLinks.map((group, i) => (
                            <div key={i}>
                                <h4 className="text-sm font-semibold text-zinc-900 mb-3">
                                    {group.label}
                                </h4>
                                <ul className="space-y-2">
                                    {group.items.map((item, j) => (
                                        <li key={j}>
                                            <Link
                                                href={item.href}
                                                className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
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
                    <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-200">
                        <p className="text-sm text-zinc-500">
                            © {new Date().getFullYear()} ExportLens. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <Link href="mailto:hello@exportlens.com" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <Mail className="h-5 w-5" />
                            </Link>
                            <Link href="https://linkedin.com" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                            <Link href="https://twitter.com" className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
