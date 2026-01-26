'use client';

import { ReactNode } from 'react';
import { DocsSidebar } from './DocsSidebar';
import { DocsHeader } from './DocsHeader';

interface DocsLayoutProps {
    children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <div className="flex">
                {/* Sidebar - Hidden on mobile */}
                <div className="hidden lg:block">
                    <DocsSidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <DocsHeader />

                    <main className="max-w-4xl mx-auto px-6 py-12">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-white/10 py-8 px-6">
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                            <p>© 2026 ExportReady-Battery. All rights reserved.</p>
                            <div className="flex items-center gap-4">
                                <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                                <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                                <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
