export default function AboutPage() {
    return (
        <div className="pt-32 pb-24 px-4 bg-zinc-950">
            <div className="mx-auto w-full max-w-6xl space-y-10">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-heading">
                        About ExportReady
                    </h1>
                    <p className="text-lg text-zinc-400">
                        ExportReady helps battery manufacturers meet India and EU compliance with audit-grade data,
                        automated passports, and reliable traceability from cell to pack.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                        <h2 className="text-xl font-semibold text-white mb-2">Our Mission</h2>
                        <p className="text-sm text-zinc-400">
                            Make battery compliance simple, transparent, and enforcement-ready for every manufacturer.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                        <h2 className="text-xl font-semibold text-white mb-2">What We Build</h2>
                        <p className="text-sm text-zinc-400">
                            A production-grade compliance platform with lifecycle tracking, immutable records, and
                            export-ready documentation.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <a
                        href="/contact"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        Contact Us
                    </a>
                    <a
                        href="/docs"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg border border-zinc-800 text-zinc-300 text-sm font-semibold hover:border-zinc-700 hover:text-white transition-colors"
                    >
                        Read the Docs
                    </a>
                </div>
            </div>
        </div>
    )
}
