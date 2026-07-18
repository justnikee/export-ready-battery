"use client";

export default function FeatureGrid() {
  return (
    <section className="bg-white border-b border-border antialiased">
      <div className="max-w-[1232px] mx-auto border-x border-border">
        {/* Section header */}
        <div className="sticky top-14 z-20 bg-[#F5F9FFF2] backdrop-blur-[8px] border-b border-border px-6 py-4 flex justify-between items-center">
          <div className="font-mono text-[11px] uppercase font-semibold leading-none text-text-dim tracking-[0.18em]">
            CAPABILITIES
          </div>
          <div className="font-mono text-[11px] leading-none text-text-dim">
            [4/8]
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-col w-full pt-16 pb-20 gap-9 px-6">
          <h2 className="font-heading text-[32px] md:text-[48px] tracking-[-0.035em] leading-[108%] max-w-[640px] font-medium text-text text-balance">
            Not just a passport generator.
          </h2>

          {/* Bento grid container */}
          <div className="flex flex-col w-full gap-4">
            {/* Row 1 */}
            <div className="flex flex-col md:flex-row w-full gap-4">
              {/* Cell 1 — AI parsing (large, blue-drenched) */}
              <div className="md:grow-[7] md:basis-0 flex flex-col min-h-80 p-8 md:p-10 rounded-[8px] overflow-clip gap-4 bg-blue">
                {/* Halftone grid overlay */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 1px)",
                    backgroundSize: "4px 4px",
                    mixBlendMode: "overlay",
                  }}
                />
                <div className="flex items-center justify-center rounded-[8px] shrink-0 bg-[#FFFFFF26] size-11">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" fill="none" stroke="rgb(255 255 255)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-white">
                  AI reads your certificates for you
                </h3>
                <p className="font-body text-[15px] leading-[165%] max-w-[440px] text-[#FFFFFFBF] text-pretty">
                  Drop in a BIS, EPR, UN38.3 or IEC 62133 PDF and Anviora extracts 100+ fields in seconds. You just review.
                </p>
                <div className="flex flex-wrap mt-auto pt-5 gap-1.5">
                  {[
                    "Chemistry · LFP",
                    "UN38.3 · Pass",
                    "Capacity · 280 Ah",
                    "BIS · Valid 2027",
                  ].map((chip) => (
                    <div key={chip} className="font-mono inline-block py-1.5 px-3 rounded-[2px] bg-[#FFFFFF1A]">
                      <div className="inline-block font-mono text-[11px] leading-none text-white">
                        {chip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cell 2 — Bitcoin anchoring (dark panel) */}
              <div className="md:grow-[5] md:basis-0 flex flex-col min-h-80 p-8 md:p-10 rounded-[8px] gap-4 bg-text border border-solid border-[#1F2933]">
                <div className="flex items-center justify-center rounded-[8px] shrink-0 bg-[#FFFFFF1A] size-11">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M12 22v-8m0 0a4 4 0 0 0 0-8M12 6a4 4 0 0 0 0 8m0-8h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-6M12 6H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" fill="none" stroke="rgb(255 214 103)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-white">
                  Anchored to Bitcoin, provable forever
                </h3>
                <p className="font-body text-[15px] leading-[165%] text-[#FFFFFFA6] text-pretty">
                  Every certificate hash is timestamped via OpenTimestamps — free, independent, permanent proof. No wallet required.
                </p>
                <div className="mt-auto font-mono flex flex-col p-3 rounded-[4px] gap-1 bg-[#FFFFFF0D] border border-solid border-[#FFFFFF1A]">
                  <div className="font-mono text-[11px] leading-none text-[#6B7480]">
                    sha256 · a91f…c4e2
                  </div>
                  <div className="font-mono text-[11px] leading-none text-[#FFD667]">
                    ✓ anchored — block 842,190
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col md:flex-row w-full gap-4">
              {/* Cell 3 — W3C Credentials (blue tint) */}
              <div
                className="md:grow-[5] md:basis-0 flex flex-col min-h-80 p-8 md:p-10 rounded-[8px] gap-4 bg-[#F4F8FF] bg-origin-border border border-solid border-border"
                style={{ backgroundImage: "linear-gradient(#0562EF14)" }}
              >
                <div className="flex items-center justify-center rounded-[8px] shrink-0 [box-shadow:#0000000D_0px_2px_8px] bg-white border border-solid border-border size-11">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-text">
                  Signed, portable Credentials
                </h3>
                <p className="font-body text-[15px] leading-[165%] text-text-muted text-pretty">
                  Every passport can be issued as a W3C Verifiable Credential — cryptographically signed and yours to share with any buyer or system.
                </p>
                <div className="mt-auto font-mono flex flex-col p-3 rounded-[4px] gap-1 bg-white border border-solid border-border">
                  <div className="font-mono text-[11px] leading-none text-text-dim">
                    did:key:z6Mk…9fQ2
                  </div>
                  <div className="font-mono text-[11px] font-semibold leading-none text-blue">
                    ✓ Ed25519 signature valid
                  </div>
                </div>
              </div>

              {/* Cell 4 — BPAN + QR */}
              <div
                className="md:grow-[7] md:basis-0 flex flex-col sm:flex-row sm:items-center min-h-80 p-8 md:p-10 rounded-[8px] gap-8 bg-white bg-origin-border border border-solid border-border"
                style={{ backgroundImage: "linear-gradient(#0562EF14)" }}
              >
                <div className="grow basis-0 flex flex-col gap-4">
                  <div className="flex items-center justify-center rounded-[8px] shrink-0 [box-shadow:#0000000D_0px_2px_8px] bg-white border border-solid border-border size-11">
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="#000000" strokeWidth="2" />
                      <rect x="7" y="7" width="3" height="3" fill="none" stroke="#000000" strokeWidth="2" />
                      <rect x="14" y="7" width="3" height="3" fill="none" stroke="#000000" strokeWidth="2" />
                      <rect x="7" y="14" width="3" height="3" fill="none" stroke="#000000" strokeWidth="2" />
                      <rect x="14" y="14" width="3" height="3" fill="none" stroke="#000000" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-text">
                    One serial, one QR code
                  </h3>
                  <p className="font-body text-[15px] leading-[165%] text-text-muted text-pretty">
                    Every battery gets a unique BPAN V2 serial and QR code linking to a live, tiered-access passport page.
                  </p>
                </div>
                <div className="w-35 flex flex-col items-center p-4 rounded-[8px] gap-2.5 shrink-0 [box-shadow:#0000000A_0px_4px_16px] bg-white border border-solid border-border self-center">
                  <div className="flex items-center justify-center shrink-0 bg-white size-24">
                    <svg width="84" height="84" viewBox="0 0 27 27" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <rect x="0" y="0" width="8" height="8" fill="none" stroke="#000000" strokeWidth="1.2" />
                      <rect x="19" y="0" width="8" height="8" fill="none" stroke="#000000" strokeWidth="1.2" />
                      <rect x="0" y="19" width="8" height="8" fill="none" stroke="#000000" strokeWidth="1.2" />
                      <rect x="12" y="12" width="3" height="3" fill="none" stroke="#000000" strokeWidth="1.2" />
                      <rect x="10" y="15" width="2" height="2" fill="none" stroke="#000000" strokeWidth="1.2" />
                      <rect x="15" y="10" width="2" height="2" fill="none" stroke="#000000" strokeWidth="1.2" />
                    </svg>
                  </div>
                  <div className="font-mono text-[11px] inline-block font-semibold leading-none text-text">
                    IN-LFP-24-B4471
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
