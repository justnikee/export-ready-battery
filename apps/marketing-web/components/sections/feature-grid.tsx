"use client";

function DetailedQRCode({ size = 88 }: { size?: number }) {
  const fill = "#045c43";
  return (
    <svg width={size} height={size} viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Background */}
      <rect width="29" height="29" fill="white" />
      
      {/* Top-Left Finder Marker */}
      <rect x="1" y="1" width="7" height="7" fill={fill} />
      <rect x="2" y="2" width="5" height="5" fill="white" />
      <rect x="3" y="3" width="3" height="3" fill={fill} />
      
      {/* Top-Right Finder Marker */}
      <rect x="21" y="1" width="7" height="7" fill={fill} />
      <rect x="22" y="2" width="5" height="5" fill="white" />
      <rect x="23" y="3" width="3" height="3" fill={fill} />
      
      {/* Bottom-Left Finder Marker */}
      <rect x="1" y="21" width="7" height="7" fill={fill} />
      <rect x="2" y="22" width="5" height="5" fill="white" />
      <rect x="3" y="23" width="3" height="3" fill={fill} />

      {/* Alignment Pattern */}
      <rect x="20" y="20" width="5" height="5" fill={fill} />
      <rect x="21" y="21" width="3" height="3" fill="white" />
      <rect x="22" y="22" width="1" height="1" fill={fill} />

      {/* Timing Patterns */}
      <rect x="8" y="3" width="1" height="1" fill={fill} />
      <rect x="10" y="3" width="1" height="1" fill={fill} />
      <rect x="12" y="3" width="1" height="1" fill={fill} />
      <rect x="14" y="3" width="1" height="1" fill={fill} />
      <rect x="16" y="3" width="1" height="1" fill={fill} />
      <rect x="18" y="3" width="1" height="1" fill={fill} />

      <rect x="3" y="8" width="1" height="1" fill={fill} />
      <rect x="3" y="10" width="1" height="1" fill={fill} />
      <rect x="3" y="12" width="1" height="1" fill={fill} />
      <rect x="3" y="14" width="1" height="1" fill={fill} />
      <rect x="3" y="16" width="1" height="1" fill={fill} />
      <rect x="3" y="18" width="1" height="1" fill={fill} />

      {/* Data Cells Matrix */}
      {[
        [9, 1], [11, 1], [13, 1], [15, 1], [17, 1], [19, 1],
        [9, 5], [10, 5], [12, 5], [14, 5], [17, 5], [18, 5],
        [1, 9], [2, 9], [4, 9], [6, 9], [7, 9], [9, 9], [11, 9], [13, 9], [15, 9], [17, 9], [19, 9], [21, 9], [23, 9], [25, 9], [27, 9],
        [1, 11], [3, 11], [5, 11], [8, 11], [10, 11], [12, 11], [14, 11], [16, 11], [18, 11], [20, 11], [22, 11], [24, 11], [26, 11], [27, 11],
        [2, 13], [4, 13], [6, 13], [9, 13], [11, 13], [13, 13], [15, 13], [17, 13], [19, 13], [21, 13], [23, 13], [25, 13], [27, 13],
        [1, 15], [3, 15], [5, 15], [7, 15], [10, 15], [12, 15], [14, 15], [16, 15], [18, 15], [20, 15], [22, 15], [24, 15], [26, 15],
        [2, 17], [4, 17], [6, 17], [8, 17], [9, 17], [11, 17], [13, 17], [15, 17], [17, 17], [19, 17], [21, 17], [23, 17], [25, 17], [27, 17],
        [1, 19], [3, 19], [5, 19], [7, 19], [10, 19], [12, 19], [14, 19], [16, 19], [18, 19], [20, 19], [22, 19], [24, 19], [26, 19],
        [9, 21], [11, 21], [13, 21], [15, 21], [17, 21], [18, 21], [26, 21], [27, 21],
        [9, 23], [10, 23], [12, 23], [14, 23], [16, 23], [18, 23], [27, 23],
        [9, 25], [11, 25], [13, 25], [15, 25], [17, 25], [19, 25], [26, 25],
        [9, 27], [10, 27], [12, 27], [14, 27], [16, 27], [18, 27], [27, 27],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill={fill} />
      ))}
      
      {/* Center Brand Badge Emblem */}
      <rect x="11" y="11" width="7" height="7" fill="white" />
      <rect x="12" y="12" width="5" height="5" fill={fill} />
      <path d="M14.5 13L13 16H14L14.5 14.8L15 16H16L14.5 13Z" fill="white" />
    </svg>
  );
}

export default function FeatureGrid() {
  return (
    <section className="bg-white antialiased">
      <div className="max-w-[1232px] mx-auto">
        {/* Section header */}
        <div className="sticky top-20 z-20 bg-bg/95 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <span className="section-index">CAPABILITIES</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-emerald-600 font-semibold">4</span>/8]
          </span>
        </div>

        {/* Content area */}
        <div className="flex flex-col w-full px-6 pt-16 pb-20 lg:pt-20 lg:pb-28 gap-9">
          <h2 className="font-heading text-text text-[clamp(32px,4.5vw,52px)] font-semibold tracking-[-0.035em] leading-[1.08] max-w-[640px] text-balance">
            Not just a passport generator.
          </h2>

          {/* Bento grid container — 4 Unified Cells */}
          <div className="flex flex-col w-full gap-4">
            {/* Row 1 */}
            <div className="flex flex-col md:flex-row w-full gap-4">
              {/* Cell 1 — AI parsing */}
              <div className="md:grow-[7] md:basis-0 flex flex-col min-h-80 p-8 md:p-10 rounded-none overflow-clip gap-4 bg-blue">
                <div className="flex items-center justify-center rounded-none shrink-0 bg-[#FFFFFF26] size-11">
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
                    <div key={chip} className="font-mono inline-block py-1.5 px-3 rounded-none bg-[#FFFFFF1A]">
                      <div className="inline-block font-mono text-[11px] leading-none text-white">
                        {chip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cell 2 — Bitcoin anchoring */}
              <div className="md:grow-[5] md:basis-0 flex flex-col min-h-80 p-8 md:p-10 rounded-none gap-4 bg-blue">
                <div className="flex items-center justify-center rounded-none shrink-0 bg-[#FFFFFF26] size-11">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M12 22v-8m0 0a4 4 0 0 0 0-8M12 6a4 4 0 0 0 0 8m0-8h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-6M12 6H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6" fill="none" stroke="#FFD667" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-white">
                  Anchored to Bitcoin, provable forever
                </h3>
                <p className="font-body text-[15px] leading-[165%] text-[#FFFFFFBF] text-pretty">
                  Every certificate hash is timestamped via OpenTimestamps — free, independent, permanent proof. No wallet required.
                </p>
                <div className="mt-auto font-mono flex flex-col p-3 rounded-none gap-1 bg-[#FFFFFF1A]">
                  <div className="font-mono text-[11px] leading-none text-white/70">
                    sha256 · a91f…c4e2
                  </div>
                  <div className="font-mono text-[11px] font-bold leading-none text-[#FFD667]">
                    ✓ anchored — block 842,190
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col md:flex-row w-full gap-4">
              {/* Cell 3 — W3C Credentials */}
              <div className="md:grow-[5] md:basis-0 flex flex-col min-h-80 p-8 md:p-10 rounded-none gap-4 bg-blue">
                <div className="flex items-center justify-center rounded-none shrink-0 bg-[#FFFFFF26] size-11">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-white">
                  Signed, portable Credentials
                </h3>
                <p className="font-body text-[15px] leading-[165%] text-[#FFFFFFBF] text-pretty">
                  Every passport can be issued as a W3C Verifiable Credential — cryptographically signed and yours to share with any buyer or system.
                </p>
                <div className="mt-auto font-mono flex flex-col p-3 rounded-none gap-1 bg-[#FFFFFF1A]">
                  <div className="font-mono text-[11px] leading-none text-white/70">
                    did:key:z6Mk…9fQ2
                  </div>
                  <div className="font-mono text-[11px] font-bold leading-none text-white">
                    ✓ Ed25519 signature valid
                  </div>
                </div>
              </div>

              {/* Cell 4 — BPAN + QR Code */}
              <div className="md:grow-[7] md:basis-0 flex flex-col sm:flex-row sm:items-center min-h-80 p-8 md:p-10 rounded-none gap-8 bg-blue">
                <div className="grow basis-0 flex flex-col gap-4">
                  <div className="flex items-center justify-center rounded-none shrink-0 bg-[#FFFFFF26] size-11">
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="#ffffff" strokeWidth="2" />
                      <rect x="7" y="7" width="3" height="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                      <rect x="14" y="7" width="3" height="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                      <rect x="7" y="14" width="3" height="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                      <rect x="14" y="14" width="3" height="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-[22px] tracking-[-0.02em] font-medium leading-7 text-white">
                    One serial, one QR code
                  </h3>
                  <p className="font-body text-[15px] leading-[165%] text-[#FFFFFFBF] text-pretty">
                    Every battery gets a unique BPAN V2 serial and QR code linking to a live, tiered-access passport page.
                  </p>
                </div>
                <div className="w-36 flex flex-col items-center p-3.5 rounded-none gap-2 shrink-0 bg-white border border-emerald-300/40 self-center text-slate-900">
                  <div className="flex items-center justify-center shrink-0 bg-white">
                    <DetailedQRCode size={96} />
                  </div>
                  <div className="font-mono text-[10.5px] inline-block font-bold leading-none text-emerald-950">
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
