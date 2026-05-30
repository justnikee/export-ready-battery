export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl font-heading text-[#0B1F3B] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-500">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          1. Information We Collect
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          We collect organisation details (company name, address, contact
          information) and textile product data required for digital
          traceability passport generation — including fibre composition,
          material specifications, supply chain tier records, chemical
          compliance declarations (REACH/ZDHC MRSL), carbon footprint data,
          water and energy usage metrics, and certification credentials (GOTS,
          GRS, OEKO-TEX, BSCI, BIS IS 17243).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          2. Publicly Visible Data
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Information included in a published Textile Traceability Passport —
          manufacturer details, fibre composition, production stage history,
          sustainability metrics, and compliance declarations — is intended for
          public access via the QR code on each product. This transparency is
          aligned with EU ESPR Art. 8 digital product passport requirements and
          is a regulatory expectation, not optional data sharing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          3. Data Not Made Public
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Account credentials, unpublished lot data, internal manufacturing
          records, costing information, supplier commercial terms, and
          communications with our support team are never made public. Access is
          restricted to authorised account users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          4. Data Security
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          All data is encrypted at rest (AES-256) and in transit (TLS 1.3).
          Audit trails are cryptographically hashed using BLAKE2b. We maintain
          SOC 2 Type II certification and conduct regular penetration testing.
          Data is stored in ISO 27001 certified data centres.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          5. Data Retention
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Compliance audit trails are retained for a minimum of 10 years per
          regulatory requirements (EU ESPR, India Legal Metrology). Account and
          lot data is retained for the duration of your licence. Upon
          termination, you may export your data within 30 days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          6. India Data Protection
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          For users in India, data processing complies with the Digital Personal
          Data Protection Act 2023 (DPDP Act). Supply chain partner data shared
          with AnvayaLabs is processed solely for traceability and compliance
          purposes and is not sold or shared with third parties for commercial
          purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">7. Contact</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Questions about this Privacy Policy? Contact us at{" "}
          <a
            href="mailto:support@anvayalabs.com"
            className="text-accent-green hover:underline"
          >
            support@anvayalabs.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
