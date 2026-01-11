import { Shield } from "lucide-react"

export function TrustBar() {
    return (
        <section className="py-10 border-y border-slate-100 bg-white">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Built for compliance with</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    {["BWM Rules 2022", "AIS-156", "EU Battery Regulation", "GDPR Ready"].map((item) => (
                        <span key={item} className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="h-5 w-5 fill-slate-200" /> {item}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}
