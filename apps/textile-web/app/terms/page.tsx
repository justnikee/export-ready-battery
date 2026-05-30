export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl font-heading text-[#0B1F3B] mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-500">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          1. Acceptance of Terms
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          By accessing and using the AnvayaLabs platform (&quot;the
          Service&quot;), you accept and agree to be bound by the terms and
          provisions of this agreement. If you do not agree, do not use the
          Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          2. Description of Service
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          AnvayaLabs provides digital textile traceability passports, compliance
          validation against EU ESPR (Ecodesign for Sustainable Products
          Regulation), REACH/ZDHC MRSL chemical standards, India Legal Metrology
          fibre labelling rules, and BIS IS 17243 quality certification
          requirements. The Service enables supply chain transparency for
          textile manufacturers, exporters, and brands.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          3. Data Accuracy &amp; Liability
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Manufacturers are solely responsible for the accuracy of fibre
          composition, material specifications, supply chain information,
          chemical compliance declarations, and sustainability metrics submitted
          for textile passport generation. AnvayaLabs validates data against
          regulatory rule sets but does not guarantee approval by any government
          authority, certification body, or customs authority.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          4. Compliance Responsibility
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          While AnvayaLabs aligns its compliance checks with EU ESPR, REACH
          Regulation (EC) No 1907/2006, ZDHC MRSL v3.1, India Legal Metrology
          (Packaged Commodities) Rules 2011, and BIS IS 17243, final
          responsibility for regulatory compliance, export documentation,
          customs clearance, and market access rests with the manufacturer,
          exporter, or importer. GRS (Global Recycled Standard) and GOTS (Global
          Organic Textile Standard) certification is the responsibility of the
          manufacturing organisation and is not issued by AnvayaLabs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          5. License &amp; Usage
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Passport activation credits are purchased per-quota and have lifetime
          validity. Licenses are non-transferable between organisations. Resale
          or redistribution of the Service or generated traceability
          documentation to unauthorised third parties is prohibited.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">
          6. Data Security &amp; Privacy
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          All supply chain and compliance data is encrypted at rest (AES-256)
          and in transit (TLS 1.3). Audit trails are cryptographically secured
          using BLAKE2b hashing. See our Privacy Policy for full details on data
          handling.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0B1F3B]">7. Termination</h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          AnvayaLabs reserves the right to terminate access for violations of
          these terms. Upon termination, users may export their traceability
          data and passport records within 30 days. Audit trail records are
          retained per applicable regulatory requirements.
        </p>
      </section>
    </div>
  );
}
