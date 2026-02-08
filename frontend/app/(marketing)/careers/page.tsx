export default function CareersPage() {
    return (
        <div className="pt-32 pb-24 px-4 bg-zinc-950">
            <div className="mx-auto w-full max-w-6xl space-y-10">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-heading">
                        Careers at ExportReady
                    </h1>
                    <p className="text-lg text-zinc-400">
                        We are building compliance infrastructure for the global battery supply chain.
                        If you want to work on high-stakes systems with real-world impact, we should talk.
                    </p>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-white mb-2">Open Roles</h2>
                    <p className="text-sm text-zinc-400">
                        We are currently growing our product, engineering, and compliance teams. Send a short intro and
                        your resume to{" "}
                        <a className="text-emerald-400 hover:text-emerald-300" href="mailto:careers@exportready.com">
                            careers@exportready.com
                        </a>
                        .
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <a
                        href="/about"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg border border-zinc-800 text-zinc-300 text-sm font-semibold hover:border-zinc-700 hover:text-white transition-colors"
                    >
                        Learn About Us
                    </a>
                    <a
                        href="/contact"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        Contact Recruiting
                    </a>
                </div>
            </div>
        </div>
    )
}
