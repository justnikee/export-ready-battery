import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTAFooter() {
    return (
        <section className="py-24 bg-slate-900 text-white text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to simplify battery compliance?</h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto">Join leading assemblers and importers preparing for the 2026 mandates today.</p>
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 text-lg">
                    <Link href="/pricing">View Pricing Plans</Link>
                </Button>
            </div>
        </section>
    )
}
