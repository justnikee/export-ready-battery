'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Animated 404 */}
                <div className="relative">
                    <h1 className="text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 leading-none animate-pulse">
                        404
                    </h1>
                    <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 -z-10" />
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>
                </div>

                {/* Decorative element */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-2xl animate-pulse" />
                        <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        size="lg"
                        className="gap-2 group"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        Go Back
                    </Button>
                    <Button
                        asChild
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                        <Link href="/">
                            <Home className="w-5 h-5" />
                            Back to Home
                        </Link>
                    </Button>
                </div>

                {/* Quick Links */}
                <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Or try these popular pages:
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            href="/dashboard"
                            className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/blog"
                            className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                        >
                            Blog
                        </Link>
                        <Link
                            href="/docs"
                            className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                        >
                            Documentation
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400 dark:text-gray-600 pt-8">
                    © {new Date().getFullYear()} ExportReady. All rights reserved.
                </p>
            </div>
        </div>
    );
}
