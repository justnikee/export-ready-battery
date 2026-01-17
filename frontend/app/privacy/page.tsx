export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Information We Collect</h2>
                <p>We collect organization details (company name, address, contact info) and product specifications necessary for generating battery passports.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Publicly Visible Information</h2>
                <p>Information included in a specific Battery Passport (manufacturer details, technical specs, sustainability metrics) is intended for public consumption via QR code scanning.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Data Security</h2>
                <p>We implement industry-standard security measures to protect your account credentials and unpublished batch data.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at support@exportready.com.</p>
            </section>
        </div>
    )
}
