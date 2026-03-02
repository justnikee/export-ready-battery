"use client"

import Link from "next/link"
import { Linkedin, Twitter, Github, BarChart3 } from "lucide-react"

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

const linkStyle = { color: "var(--ld-text-muted)" }

export function PublicFooter() {
    return (
        <footer
            className="py-16 border-t"
            style={{ background: "var(--ld-bg-dark)", borderColor: "var(--ld-border)" }}
        >
            <div className="mx-auto w-full max-w-[1320px] px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
                            <BarChart3 className="h-7 w-7" style={{ color: "var(--ld-accent)" }} />
                            <span className="text-xl font-bold tracking-tight text-white">EXPORTLENS</span>
                        </Link>
                        <p className="text-sm mb-6 max-w-xs leading-relaxed" style={linkStyle}>
                            The compliance platform for battery manufacturers exporting to EU and meeting India&apos;s 2026 mandates.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:text-white"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid var(--ld-border)",
                                        color: "var(--ld-text-muted)",
                                    }}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-sm transition-colors hover:text-white"
                                        style={linkStyle}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-sm transition-colors hover:text-white"
                                        style={linkStyle}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.href}
                                        className="text-sm transition-colors hover:text-white"
                                        style={linkStyle}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div
                    className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4"
                    style={{ borderColor: "var(--ld-border)" }}
                >
                    <p className="text-sm font-mono" style={{ color: "rgba(157,184,175,0.45)" }}>
                        © 2026 ExportReady. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono" style={{ color: "rgba(157,184,175,0.45)" }}>
                        <span className="flex items-center gap-1.5">
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: "var(--ld-accent)" }}
                            />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
