"use client"

import Link from "next/link"
import { ArrowLeft, Shield, Zap, Globe, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
    type: "login" | "register"
}

const features = [
    {
        icon: Shield,
        title: "India (PLI/EPR) & EU Regulation Ready",
        description: "Full compliance with 2026 Draft Rules & EU 2027"
    },
    {
        icon: Globe,
        title: "Secure Traceability from Cell to Pack",
        description: "End-to-end battery passport tracking"
    },
    {
        icon: Zap,
        title: "Industrial-Scale Label Generation",
        description: "Generate thousands of QR labels in seconds"
    }
]

export function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0B1F3B]">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3B] via-[#0B1F3B]/90 to-[#1F7A5F]/20" />

                {/* Animated Orbs */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.3, 0.2],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1F7A5F]/30 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.15, 0.25, 0.15],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1F7A5F]/20 rounded-full blur-3xl"
                    />
                </div>

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `linear-gradient(rgba(31, 122, 95, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(31, 122, 95, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white group w-fit"
                    >
                        <BarChart3 className="h-7 w-7 text-[#1F7A5F]" />
                        <span className="text-xl font-bold tracking-tight">EXPORTLENS</span>
                    </Link>

                    {/* Feature Cards */}
                    <div className="space-y-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-bold text-white leading-tight"
                        >
                            Compliance Infrastructure
                            <br />
                            <span className="text-[#1F7A5F]">
                                for Battery Manufacturers
                            </span>
                        </motion.h2>

                        <div className="space-y-4 mt-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                                >
                                    <div className="p-2 rounded-lg bg-[#1F7A5F]/20">
                                        <feature.icon className="h-5 w-5 text-[#1F7A5F]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{feature.title}</h3>
                                        <p className="text-sm text-slate-300">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Quote */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-slate-400 text-sm"
                    >
                        Powering compliance for battery manufacturers across India & Europe
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col bg-slate-50">
                <div className="lg:hidden p-6 border-b border-slate-200">
                    <Link
                        href="/"
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-6 w-6 text-[#1F7A5F]" />
                        <span className="text-lg font-bold tracking-tight text-[#0B1F3B]">EXPORTLENS</span>
                    </Link>
                </div>

                {/* Back Link */}
                <div className="p-6 lg:p-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1F3B] transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to home
                    </Link>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-md"
                    >
                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-[#0B1F3B] mb-2">{title}</h1>
                            <p className="text-slate-500">{subtitle}</p>
                        </div>

                        {/* Form */}
                        {children}

                        {/* Footer Links */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <p className="text-center text-sm text-slate-500">
                                {type === "login" ? (
                                    <>
                                        Don&apos;t have an account?{" "}
                                        <Link href="/register" className="text-[#1F7A5F] hover:text-[#0B1F3B] font-medium transition-colors">
                                            Create account
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <Link href="/login" className="text-[#1F7A5F] hover:text-[#0B1F3B] font-medium transition-colors">
                                            Sign in
                                        </Link>
                                    </>
                                )}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="p-6 text-center text-xs text-slate-400">
                    © 2026 ExportReady. All rights reserved.
                </div>
            </div>
        </div>
    )
}
