export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl font-heading text-[#0B1F3B] mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">1. Information We Collect</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          We collect organization details (company name, address, contact information) and
          battery product specifications required for digital battery passport generation per
          EU Regulation 2023/1542 and India BWM Rules. This includes technical parameters,
          material composition, supply chain data, carbon footprint declarations, and recycled
          content disclosures.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">2. Publicly Visible Data</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Information included in a published Battery Passport — manufacturer details, technical
          specifications, sustainability metrics, and compliance declarations — is intended for
          public access via the QR code on each battery unit. This is a regulatory requirement,
          not optional data sharing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">3. Data Not Made Public</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Account credentials, unpublished batch data, internal manufacturing records, pricing
          information, and communications with our support team are never made public. Access
          is restricted to authorized account users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">4. Data Security</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Audit trails are
          cryptographically hashed using BLAKE2b. We maintain SOC 2 Type II certification and
          conduct regular penetration testing. Data is stored in ISO 27001 certified data centers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">5. Data Retention</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Compliance audit trails are retained for a minimum of 10 years per regulatory
          requirements. Account and batch data is retained for the duration of your license.
          Upon termination, you may export your data within 30 days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">6. Contact</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Questions about this Privacy Policy? Contact us at{" "}
          <a href="mailto:support@anvayalabs.com" className="text-accent-green hover:underline">
            support@anvayalabs.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}
