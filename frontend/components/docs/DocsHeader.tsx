'use client';

import Link from 'next/link';
import { Search, Github, ExternalLink, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function DocsHeader() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
            <div className="flex items-center justify-between h-16 px-6">
                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? (
                        <X className="w-5 h-5 text-gray-400" />
                    ) : (
                        <Menu className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {/* Search */}
                <div className="flex-1 max-w-xl mx-4">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 
                       bg-white/5 text-gray-400 text-sm hover:border-blue-500/50 transition-all"
                    >
                        <Search className="w-4 h-4" />
                        <span className="flex-1 text-left">Search documentation...</span>
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs 
                          rounded bg-white/10 border border-white/10 text-gray-500">
                            <span>⌘</span>K
                        </kbd>
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <Github className="w-5 h-5" />
                    </Link>

                    <Link
                        href="/dashboard"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-linear-to-r from-blue-500 to-teal-500 text-white text-sm font-medium
                       hover:opacity-90 transition-opacity"
                    >
                        Dashboard
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Search Modal */}
            {searchOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
                    onClick={() => setSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl mx-4 rounded-2xl border border-white/10 bg-[#111117] shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 border-b border-white/10">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documentation..."
                                className="flex-1 py-4 bg-transparent text-white placeholder-gray-500 outline-none"
                                autoFocus
                            />
                            <kbd className="px-2 py-1 text-xs rounded bg-white/10 text-gray-500">ESC</kbd>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-500 text-center py-8">
                                Start typing to search the documentation...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
