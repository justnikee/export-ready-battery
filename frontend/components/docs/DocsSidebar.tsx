'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Rocket,
    Code2,
    Sparkles,
    Database,
    Shield,
    Server,
    ChevronRight,
    Home,
    FileText,
    Zap
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon?: React.ReactNode;
    badge?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navigation: NavSection[] = [
    {
        title: 'Overview',
        items: [
            { title: 'Introduction', href: '/docs', icon: <Home className="w-4 h-4" /> },
            { title: 'Getting Started', href: '/docs/getting-started', icon: <Rocket className="w-4 h-4" /> },
        ],
    },
    {
        title: 'API Reference',
        items: [
            { title: 'Authentication', href: '/docs/api-reference#authentication', icon: <Shield className="w-4 h-4" /> },
            { title: 'Batches', href: '/docs/api-reference#batches', icon: <FileText className="w-4 h-4" /> },
            { title: 'Passports', href: '/docs/api-reference#passports', icon: <Zap className="w-4 h-4" /> },
            { title: 'Billing', href: '/docs/api-reference#billing', icon: <Code2 className="w-4 h-4" /> },
        ],
    },
    {
        title: 'Features',
        items: [
            { title: 'Batch Management', href: '/docs/features#batch-management', icon: <Sparkles className="w-4 h-4" /> },
            { title: 'QR Generation', href: '/docs/features#qr-generation', icon: <Sparkles className="w-4 h-4" /> },
            { title: 'CSV Upload', href: '/docs/features#csv-upload', icon: <Sparkles className="w-4 h-4" /> },
            { title: 'DVA Calculator', href: '/docs/features#dva-calculator', icon: <Sparkles className="w-4 h-4" />, badge: 'New' },
        ],
    },
    {
        title: 'Compliance',
        items: [
            { title: 'India (PLI, EPR, BIS)', href: '/docs/compliance#india', icon: <Shield className="w-4 h-4" /> },
            { title: 'EU Battery Regulation', href: '/docs/compliance#eu', icon: <Shield className="w-4 h-4" /> },
        ],
    },
    {
        title: 'Technical',
        items: [
            { title: 'Database Schema', href: '/docs/database', icon: <Database className="w-4 h-4" /> },
            { title: 'Deployment', href: '/docs/deployment', icon: <Server className="w-4 h-4" /> },
        ],
    },
];

export function DocsSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
            <div className="py-6 px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-8 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            ExportReady
                        </span>
                        <span className="text-xs text-gray-500 block">Documentation</span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="space-y-6">
                    {navigation.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-2">
                                {section.title}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/docs' && pathname.startsWith(item.href.split('#')[0]));

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                          ${isActive
                                                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    }
                        `}
                                            >
                                                {item.icon}
                                                <span className="flex-1">{item.title}</span>
                                                {item.badge && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/20 text-emerald-400">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {isActive && <ChevronRight className="w-3 h-3" />}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="px-3 py-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        <p className="text-xs text-gray-400">
                            <span className="text-indigo-400 font-semibold">v2.0</span> · Last updated January 2026
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
