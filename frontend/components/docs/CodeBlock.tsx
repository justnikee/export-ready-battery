'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
    code: string;
    language?: string;
    title?: string;
    showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'bash', title, showLineNumbers = false }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = code.split('\n');

    return (
        <div className="group relative rounded-xl overflow-hidden border border-white/10 bg-[#0d0d12]">
            {/* Header */}
            {title && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-xs text-gray-400 font-mono ml-2">{title}</span>
                    </div>
                    <span className="text-xs text-gray-500 uppercase">{language}</span>
                </div>
            )}

            {/* Code Content */}
            <div className="relative">
                <pre className="p-4 overflow-x-auto text-sm font-mono">
                    <code className="text-gray-300">
                        {showLineNumbers ? (
                            lines.map((line, i) => (
                                <div key={i} className="flex">
                                    <span className="select-none text-gray-600 w-8 shrink-0 text-right pr-4">
                                        {i + 1}
                                    </span>
                                    <span className="flex-1">{line}</span>
                                </div>
                            ))
                        ) : (
                            code
                        )}
                    </code>
                </pre>

                {/* Copy Button */}
                <button
                    onClick={copyToClipboard}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 border border-white/10 
                     opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                    ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                    )}
                </button>
            </div>
        </div>
    );
}

// Method Badge for API Docs
export function MethodBadge({ method }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' }) {
    const colors = {
        GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
        PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-bold font-mono border ${colors[method]}`}>
            {method}
        </span>
    );
}

// Endpoint Documentation Component
interface EndpointProps {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    auth?: boolean;
    requestBody?: string;
    responseBody?: string;
}

export function ApiEndpoint({ method, path, description, auth = false, requestBody, responseBody }: EndpointProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Endpoint Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
                <MethodBadge method={method} />
                <code className="text-sm text-white font-mono">{path}</code>
                {auth && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
                        🔐 Auth Required
                    </span>
                )}
            </div>

            {/* Description */}
            <div className="p-4">
                <p className="text-gray-400 text-sm">{description}</p>

                {/* Request Body */}
                {requestBody && (
                    <div className="mt-4">
                        <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Request Body</h4>
                        <CodeBlock code={requestBody} language="json" />
                    </div>
                )}

                {/* Response Body */}
                {responseBody && (
                    <div className="mt-4">
                        <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Response</h4>
                        <CodeBlock code={responseBody} language="json" />
                    </div>
                )}
            </div>
        </div>
    );
}
