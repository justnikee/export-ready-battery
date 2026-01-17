"use client"

import Link from "next/link"
import { Battery, ArrowLeft, Shield, Zap, Globe } from "lucide-react"
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
        <div className="min-h-screen flex bg-black">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/40 via-indigo-900/30 to-black" />

                {/* Animated Orbs */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"
                    />
                </div>

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-3 text-white group w-fit"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-linear-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-purple-500/30"
                        >
                            <Battery className="h-6 w-6" />
                        </motion.div>
                        <span className="text-2xl font-bold">ExportReady</span>
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
                            <span className="bg-linear-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
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
                                    <div className="p-2 rounded-lg bg-linear-to-br from-purple-500/20 to-indigo-500/20">
                                        <feature.icon className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{feature.title}</h3>
                                        <p className="text-sm text-zinc-400">{feature.description}</p>
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
                        className="text-zinc-500 text-sm"
                    >
                        Powering compliance for battery manufacturers across India & Europe
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <div className="lg:hidden p-6 border-b border-zinc-800">
                    <Link
                        href="/"
                        className="flex items-center gap-3 text-white"
                    >
                        <div className="bg-linear-to-br from-purple-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-purple-500/30">
                            <Battery className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold">ExportReady</span>
                    </Link>
                </div>

                {/* Back Link */}
                <div className="p-6 lg:p-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
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
                            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                            <p className="text-zinc-400">{subtitle}</p>
                        </div>

                        {/* Form */}
                        {children}

                        {/* Footer Links */}
                        <div className="mt-8 pt-6 border-t border-zinc-800">
                            <p className="text-center text-sm text-zinc-500">
                                {type === "login" ? (
                                    <>
                                        Don't have an account?{" "}
                                        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                            Create account
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                            Sign in
                                        </Link>
                                    </>
                                )}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="p-6 text-center text-xs text-zinc-600">
                    © 2026 ExportReady. All rights reserved.
                </div>
            </div>
        </div>
    )
}
