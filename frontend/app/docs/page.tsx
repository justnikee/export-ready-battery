'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Rocket,
    Code2,
    Sparkles,
    Database,
    Shield,
    Server,
    ArrowRight,
    Zap,
    CheckCircle2,
    Battery,
    Globe,
    FileText
} from 'lucide-react';

// Quick Start Card
function QuickStartCard({
    icon,
    title,
    description,
    href,
    color
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: string;
}) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className={`group p-6 rounded-2xl border border-white/10 bg-white/5 
                    hover:border-${color}-500/50 hover:bg-${color}-500/5 transition-all cursor-pointer`}
            >
                <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-4
                        group-hover:bg-${color}-500/30 transition-colors`}>
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-blue-400 group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                </span>
            </motion.div>
        </Link>
    );
}

// Feature Item
function FeatureItem({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-gray-300">{children}</span>
        </li>
    );
}

export default function DocsPage() {
    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                        bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm mb-4">
                        <Zap className="w-3.5 h-3.5" />
                        <span>v2.0 Documentation</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        ExportReady-Battery
                        <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-teal-400">
                            Documentation
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                        Complete technical documentation for the Digital Battery Passport platform.
                        Build compliant battery passports for EU and India markets with our comprehensive API and tools.
                    </p>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    {[
                        { label: 'API Endpoints', value: '25+' },
                        { label: 'Database Tables', value: '6' },
                        { label: 'UI Components', value: '50+' },
                        { label: 'Countries Supported', value: 'EU + India' },
                    ].map((stat) => (
                        <div key={stat.label} className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Quick Start Section */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-blue-400" />
                    Quick Start
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickStartCard
                        icon={<Rocket className="w-6 h-6 text-emerald-400" />}
                        title="Getting Started"
                        description="Set up your development environment and create your first battery passport in minutes."
                        href="/docs/getting-started"
                        color="emerald"
                    />
                    <QuickStartCard
                        icon={<Code2 className="w-6 h-6 text-blue-400" />}
                        title="API Reference"
                        description="Explore our RESTful API with authentication, batch management, and passport endpoints."
                        href="/docs/api-reference"
                        color="blue"
                    />
                    <QuickStartCard
                        icon={<Sparkles className="w-6 h-6 text-teal-400" />}
                        title="Features"
                        description="Discover powerful features like QR generation, CSV upload, and DVA calculator."
                        href="/docs/features"
                        color="teal"
                    />
                </div>
            </section>

            {/* Key Features Section */}
            <section className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 to-transparent">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                        <Battery className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Digital Battery Passports</h3>
                    <ul className="space-y-3">
                        <FeatureItem>UUID-based unique identification</FeatureItem>
                        <FeatureItem>QR code generation for each battery</FeatureItem>
                        <FeatureItem>Bulk passport creation via CSV</FeatureItem>
                        <FeatureItem>Real-time scan tracking & analytics</FeatureItem>
                    </ul>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                        <Globe className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Global Compliance</h3>
                    <ul className="space-y-3">
                        <FeatureItem>EU Battery Regulation (2023/1542)</FeatureItem>
                        <FeatureItem>India PLI Scheme & Battery Aadhaar</FeatureItem>
                        <FeatureItem>EPR, BIS, and IEC tracking</FeatureItem>
                        <FeatureItem>DVA Calculator for PLI eligibility</FeatureItem>
                    </ul>
                </div>
            </section>

            {/* Documentation Sections */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-6">Explore Documentation</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        {
                            icon: <Shield className="w-5 h-5 text-blue-400" />,
                            title: 'Compliance',
                            desc: 'India & EU regulatory requirements',
                            href: '/docs/compliance'
                        },
                        {
                            icon: <Database className="w-5 h-5 text-amber-400" />,
                            title: 'Database',
                            desc: 'Schema, tables, and migrations',
                            href: '/docs/database'
                        },
                        {
                            icon: <Server className="w-5 h-5 text-cyan-400" />,
                            title: 'Deployment',
                            desc: 'Environment setup and commands',
                            href: '/docs/deployment'
                        },
                        {
                            icon: <FileText className="w-5 h-5 text-teal-400" />,
                            title: 'API Reference',
                            desc: 'Complete endpoint documentation',
                            href: '/docs/api-reference'
                        },
                    ].map((item) => (
                        <Link key={item.title} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 
                          bg-white/5 hover:border-blue-500/50 transition-all cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-white">{item.title}</h4>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-500" />
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Tech Stack */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h2 className="text-xl font-bold text-white mb-4">Tech Stack</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { name: 'Next.js 16', desc: 'Frontend Framework' },
                        { name: 'React 19', desc: 'UI Library' },
                        { name: 'Go 1.24', desc: 'Backend Runtime' },
                        { name: 'PostgreSQL', desc: 'Database' },
                        { name: 'Tailwind CSS', desc: 'Styling' },
                        { name: 'Framer Motion', desc: 'Animations' },
                        { name: 'JWT', desc: 'Authentication' },
                        { name: 'Supabase', desc: 'Cloud Platform' },
                    ].map((tech) => (
                        <div key={tech.name} className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="font-medium text-white text-sm">{tech.name}</div>
                            <div className="text-xs text-gray-500">{tech.desc}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
