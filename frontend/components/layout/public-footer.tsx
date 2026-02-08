"use client"

import Link from "next/link"
import Image from "next/image"
import { Linkedin, Twitter, Github } from "lucide-react"

const footerLinks = {
    product: [
        { label: "Features", href: "/docs/features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Documentation", href: "/docs" },
        { label: "API Reference", href: "/docs/api-reference" },
    ],
    company: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
    ],
    legal: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/privacy" },
    ]
}

const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
]

export function PublicFooter() {
    return (
        <footer className="py-16 bg-zinc-950 border-t border-zinc-800/50">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
                            <Image src="/logo/logo.svg" alt="ExportReady" width={140} height={28} className="h-7 w-auto" />
                        </Link>
                        <p className="text-zinc-500 text-sm mb-4 max-w-xs font-sans">
                            The compliance platform for battery manufacturers exporting to EU and meeting India&apos;s 2026 mandates.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="h-8 w-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 font-heading">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-sans">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 font-heading">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-sans">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 font-heading">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.href} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-sans">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-zinc-600 font-sans">
                        © 2026 ExportReady. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-600 font-mono">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
