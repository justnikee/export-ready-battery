export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
                <p>By accessing and using the ExportReady-Battery platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Description of Service</h2>
                <p>ExportReady-Battery provides battery passport generation and compliance management services for battery manufacturers.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Data Accuracy</h2>
                <p>Manufacturers are solely responsible for the accuracy of the technical specifications, material composition, and sustainability data provided for the generation of battery passports.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Compliance Disclaimer</h2>
                <p>While we strive to align with EU Battery Regulation and India's Battery Waste Management Rules, the final responsibility for regulatory compliance lies with the manufacturer.</p>
            </section>
        </div>
    )
}
