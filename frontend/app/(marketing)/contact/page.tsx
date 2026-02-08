export default function ContactPage() {
    return (
        <div className="pt-32 pb-24 px-4 bg-zinc-950">
            <div className="mx-auto w-full max-w-6xl space-y-10">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white font-heading">
                        Contact ExportReady
                    </h1>
                    <p className="text-lg text-zinc-400">
                        Reach out for product questions, compliance support, or sales. We respond within 1 business day.
                    </p>
                </div>

                <div className="grid gap-6">
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                        <h2 className="text-lg font-semibold text-white mb-2">Support</h2>
                        <p className="text-sm text-zinc-400">
                            For technical help or account issues, email us at{" "}
                            <a className="text-emerald-400 hover:text-emerald-300" href="mailto:support@exportready.com">
                                support@exportready.com
                            </a>
                            .
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                        <h2 className="text-lg font-semibold text-white mb-2">Sales</h2>
                        <p className="text-sm text-zinc-400">
                            Want a demo or a custom plan? Email{" "}
                            <a className="text-emerald-400 hover:text-emerald-300" href="mailto:sales@exportready.com">
                                sales@exportready.com
                            </a>
                            .
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <a
                        href="mailto:sales@exportready.com"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        Book a Demo
                    </a>
                    <a
                        href="/docs"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg border border-zinc-800 text-zinc-300 text-sm font-semibold hover:border-zinc-700 hover:text-white transition-colors"
                    >
                        Documentation
                    </a>
                </div>
            </div>
        </div>
    )
}
