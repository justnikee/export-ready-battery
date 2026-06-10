export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl font-heading text-[#0B1F3B] mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">1. Acceptance of Terms</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          By accessing and using the Anviora platform (&quot;the Service&quot;), you accept and agree
          to be bound by the terms and provisions of this agreement. If you do not agree, do not
          use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">2. Description of Service</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Anviora provides digital battery passport generation, compliance validation against
          EU Regulation 2023/1542 and India BIS/CPCB standards, lifecycle tracking, and audit
          trail management for battery manufacturers and importers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">3. Data Accuracy & Liability</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Manufacturers are solely responsible for the accuracy of technical specifications, material
          composition data, supply chain information, and sustainability metrics provided for battery
          passport generation. Anviora validates data against regulatory rule sets but does not
          guarantee regulatory approval by any government body.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">4. Compliance Responsibility</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          While Anviora aligns with EU Battery Regulation 2023/1542, India BIS IS 16046, and
          CPCB Battery Waste Management Rules 2022, the final responsibility for regulatory
          compliance, customs clearance, and market access lies with the manufacturer or importer.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">5. License & Usage</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Batch activation licenses are purchased per-quota and have lifetime validity. Licenses are
          non-transferable. Resale or redistribution of the Service or generated compliance
          documentation to unauthorized third parties is prohibited.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">6. Data Security & Privacy</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          All manufacturing and compliance data is encrypted at rest (AES-256) and in transit
          (TLS 1.3). Audit trails are cryptographically secured using BLAKE2b hashing. See our
          Privacy Policy for full details on data handling.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">7. Termination</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Anviora reserves the right to terminate access for violations of these terms. Upon
          termination, users may export their compliance data within 30 days. Audit trail records
          are retained per regulatory requirements.
        </p>
      </section>
    </div>
  )
}
