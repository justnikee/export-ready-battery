import { Upload, FileText, Printer } from "lucide-react"

export function HowItWorks() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Compliance in 3 Simple Steps</h2>
                    <p className="text-slate-600 max-w-xl mx-auto">From spreadsheet to sticker in less than 2 minutes.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connector Line */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

                    {/* Step 1 */}
                    <div className="text-center relative">
                        <div className="h-24 w-24 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg mb-6 z-10">
                            <Upload className="h-10 w-10 text-slate-300" />
                            <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">1</div>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Upload Batch</h3>
                        <p className="text-slate-600 text-sm">Drag & drop your production CSV file directly into the dashboard.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="text-center relative">
                        <div className="h-24 w-24 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg mb-6 z-10">
                            <FileText className="h-10 w-10 text-blue-500" />
                            <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">2</div>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Validate Data</h3>
                        <p className="text-slate-600 text-sm">Our engine checks for missing PLI metrics, Carbon limits, and required fields.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="text-center relative">
                        <div className="h-24 w-24 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg mb-6 z-10">
                            <Printer className="h-10 w-10 text-emerald-500" />
                            <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">3</div>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Print Labels</h3>
                        <p className="text-slate-600 text-sm">Download sticker-ready PDF sheets (3x7) or separate QR codes instantly.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
