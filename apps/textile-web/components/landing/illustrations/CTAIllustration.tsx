const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function CTAIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 700 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* ===== BACKGROUND GRID ===== */}
      <g opacity={0.06}>
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`dg-${i}`} x1={i * 50} y1="160" x2={i * 50 + 80} y2="90" stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`dg2-${i}`} x1={i * 50 + 80} y1="160" x2={i * 50} y2="90" stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
        {[100, 115, 130, 145].map((y, i) => (
          <line key={`hg-${i}`} x1="0" y1={y} x2="700" y2={y} stroke={COLORS.outline} strokeWidth="0.2" />
        ))}
      </g>

      {/* ===== ISOMETRIC PATH/ROAD ===== */}
      <g>
        {/* Road surface */}
        <polygon points="30,135 60,120 650,80 680,95 680,110 650,95 60,135 30,150" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.6" />
        {/* Road top face */}
        <polygon points="30,135 60,120 650,80 680,95 650,95 60,135" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.4" opacity={0.5} />
        {/* Road center dashed line */}
        <line x1="60" y1="127" x2="650" y2="87" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="6 8" opacity={0.2} />
        {/* Road edge markings */}
        <line x1="60" y1="120" x2="650" y2="80" stroke={COLORS.brightGreen} strokeWidth="0.4" opacity={0.15} />
        <line x1="60" y1="135" x2="650" y2="95" stroke={COLORS.brightGreen} strokeWidth="0.4" opacity={0.15} />
      </g>

      {/* ===== SMALL FACTORY ON FAR LEFT ===== */}
      <g>
        {/* Factory left face */}
        <polygon points="20,130 20,95 50,82 50,117" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Factory right face */}
        <polygon points="50,82 50,117 75,125 75,90" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Factory top */}
        <polygon points="20,95 50,82 75,90 45,103" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.4" />
        {/* Chimney */}
        <rect x="30" y="80" width="6" height="18" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.3" />
        <rect x="28" y="77" width="10" height="4" rx="0.5" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.3" />
        {/* Smoke */}
        <path d="M33 77 Q35 68 32 60 Q30 54 34 48" stroke={COLORS.outline} strokeWidth="0.5" opacity={0.12} fill="none" />
        {/* Windows */}
        <rect x="26" y="100" width="8" height="6" rx="0.5" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.5} />
        <rect x="38" y="96" width="8" height="6" rx="0.5" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.5} />
        <rect x="55" y="95" width="8" height="6" rx="0.5" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.4} />
      </g>

      {/* ===== MODERN BUILDING ON RIGHT ===== */}
      <g>
        {/* Building left face */}
        <polygon points="620,88 620,45 650,35 650,78" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Building right face */}
        <polygon points="650,35 650,78 675,85 675,42" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Building top */}
        <polygon points="620,45 650,35 675,42 645,52" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.4" />
        {/* Glass facade */}
        <rect x="625" y="52" width="20" height="30" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.3} />
        <line x1="635" y1="52" x2="635" y2="82" stroke={COLORS.outline} strokeWidth="0.2" opacity={0.3} />
        <line x1="625" y1="62" x2="645" y2="62" stroke={COLORS.outline} strokeWidth="0.2" opacity={0.3} />
        <line x1="625" y1="72" x2="645" y2="72" stroke={COLORS.outline} strokeWidth="0.2" opacity={0.3} />
        {/* Right face windows */}
        <rect x="655" y="50" width="12" height="8" rx="0.5" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.3} />
        <rect x="655" y="62" width="12" height="8" rx="0.5" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.3} />
        <rect x="655" y="74" width="12" height="8" rx="0.5" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.3" opacity={0.3} />
        {/* Antenna */}
        <line x1="650" y1="35" x2="650" y2="22" stroke={COLORS.outline} strokeWidth="0.5" />
        <circle cx="650" cy="20" r="2" fill={COLORS.neonGreen} opacity={0.4} />
      </g>

      {/* ===== MILESTONE MARKERS ALONG PATH ===== */}
      <g>
        {[
          { x: 150, y: 115, done: true },
          { x: 280, y: 107, done: true },
          { x: 410, y: 99, done: true },
          { x: 530, y: 92, done: false },
        ].map((m, i) => (
          <g key={`ms-${i}`}>
            {/* Milestone post */}
            <line x1={m.x} y1={m.y} x2={m.x} y2={m.y - 18} stroke={COLORS.outline} strokeWidth="0.8" />
            {/* Milestone circle */}
            <circle cx={m.x} cy={m.y - 22} r="6" fill={m.done ? COLORS.brandGreen : COLORS.darkGreen2} stroke={m.done ? COLORS.neonGreen : COLORS.outline} strokeWidth="0.6" opacity={0.7} />
            {/* Checkmark if done */}
            {m.done && (
              <polyline points={`${m.x - 3},${m.y - 22} ${m.x - 0.5},${m.y - 19} ${m.x + 4},${m.y - 26}`} stroke={COLORS.neonGreen} strokeWidth="0.8" fill="none" opacity={0.8} />
            )}
            {/* Glow for completed */}
            {m.done && (
              <circle cx={m.x} cy={m.y - 22} r="9" fill={COLORS.neonGreen} opacity={0.06} />
            )}
          </g>
        ))}
      </g>

      {/* ===== FIGURES WALKING TOWARD HORIZON ===== */}
      <g>
        {/* Figure 1 - near start */}
        <circle cx="120" cy="113" r="3" fill={COLORS.figureLight} opacity={0.7} />
        <rect x="117.5" y="116.5" width="5" height="9" rx="1.5" fill={COLORS.figureLight} opacity={0.6} />
        <line x1="119" y1="125.5" x2="117" y2="132" stroke={COLORS.figureLight} strokeWidth="1" />
        <line x1="123" y1="125.5" x2="125" y2="132" stroke={COLORS.figureLight} strokeWidth="1" />
        {/* Figure 2 - mid path */}
        <circle cx="320" cy="104" r="2.5" fill={COLORS.figureLight} opacity={0.65} />
        <rect x="318" y="107" width="4" height="8" rx="1" fill={COLORS.figureLight} opacity={0.55} />
        <line x1="319" y1="115" x2="317" y2="121" stroke={COLORS.figureLight} strokeWidth="0.8" />
        <line x1="323" y1="115" x2="325" y2="121" stroke={COLORS.figureLight} strokeWidth="0.8" />
        {/* Figure 3 - further along */}
        <circle cx="470" cy="96" r="2.5" fill={COLORS.figureLight} opacity={0.6} />
        <rect x="468" y="99" width="4" height="7" rx="1" fill={COLORS.figureLight} opacity={0.5} />
        <line x1="469" y1="106" x2="467" y2="112" stroke={COLORS.figureLight} strokeWidth="0.8" />
        <line x1="473" y1="106" x2="475" y2="112" stroke={COLORS.figureLight} strokeWidth="0.8" />
      </g>

      {/* ===== PLANTS ALONG SIDES (growing taller toward right) ===== */}
      <g opacity={0.45}>
        {/* Left plants - small */}
        <path d="M90 138 Q87 132 92 128" stroke={COLORS.brightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="92" cy="126" r="2" fill={COLORS.lightGreen} opacity={0.5} />
        <path d="M100 136 Q98 130 103 126" stroke={COLORS.lightGreen} strokeWidth="0.5" fill="none" />
        <circle cx="103" cy="124" r="1.5" fill={COLORS.neonGreen} opacity={0.4} />

        {/* Mid plants - medium */}
        <path d="M230 125 Q226 115 233 108" stroke={COLORS.brightGreen} strokeWidth="0.7" fill="none" />
        <circle cx="233" cy="106" r="2.5" fill={COLORS.lightGreen} opacity={0.5} />
        <path d="M240 123 Q238 114 243 108" stroke={COLORS.lightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="243" cy="106" r="2" fill={COLORS.neonGreen} opacity={0.4} />

        <path d="M360 118 Q356 106 363 98" stroke={COLORS.brightGreen} strokeWidth="0.7" fill="none" />
        <circle cx="363" cy="96" r="3" fill={COLORS.lightGreen} opacity={0.5} />
        <path d="M370 116 Q368 106 373 100" stroke={COLORS.lightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="373" cy="98" r="2" fill={COLORS.neonGreen} opacity={0.4} />

        {/* Right plants - taller */}
        <line x1="500" y1="106" x2="500" y2="82" stroke={COLORS.outline} strokeWidth="0.6" />
        <path d="M500 82 Q494 75 490 70" stroke={COLORS.brightGreen} strokeWidth="0.7" fill="none" />
        <path d="M500 82 Q506 75 510 70" stroke={COLORS.lightGreen} strokeWidth="0.7" fill="none" />
        <path d="M500 82 Q499 72 500 66" stroke={COLORS.neonGreen} strokeWidth="0.5" fill="none" />

        <line x1="580" y1="96" x2="580" y2="65" stroke={COLORS.outline} strokeWidth="0.6" />
        <path d="M580 65 Q572 56 568 50" stroke={COLORS.brightGreen} strokeWidth="0.7" fill="none" />
        <path d="M580 65 Q588 56 592 50" stroke={COLORS.lightGreen} strokeWidth="0.7" fill="none" />
        <path d="M580 65 Q578 55 580 48" stroke={COLORS.neonGreen} strokeWidth="0.5" fill="none" />
        <ellipse cx="580" cy="52" rx="14" ry="6" fill={COLORS.brightGreen} opacity={0.08} />
      </g>

      {/* ===== HORIZON GLOW AND RADIATING LINES ===== */}
      <g>
        {/* Horizon glow */}
        <ellipse cx="670" cy="88" rx="50" ry="25" fill={COLORS.neonGreen} opacity={0.04} />
        <ellipse cx="670" cy="88" rx="30" ry="15" fill={COLORS.neonGreen} opacity={0.06} />
        <ellipse cx="670" cy="88" rx="15" ry="8" fill={COLORS.neonGreen} opacity={0.1} />
        {/* Radiating lines */}
        <g opacity={0.1}>
          <line x1="670" y1="88" x2="700" y2="60" stroke={COLORS.neonGreen} strokeWidth="0.4" />
          <line x1="670" y1="88" x2="700" y2="75" stroke={COLORS.brightGreen} strokeWidth="0.4" />
          <line x1="670" y1="88" x2="700" y2="90" stroke={COLORS.neonGreen} strokeWidth="0.4" />
          <line x1="670" y1="88" x2="700" y2="105" stroke={COLORS.brightGreen} strokeWidth="0.4" />
          <line x1="670" y1="88" x2="700" y2="120" stroke={COLORS.neonGreen} strokeWidth="0.4" />
          <line x1="670" y1="88" x2="700" y2="45" stroke={COLORS.teal} strokeWidth="0.3" />
          <line x1="670" y1="88" x2="700" y2="135" stroke={COLORS.teal} strokeWidth="0.3" />
          <line x1="670" y1="88" x2="695" y2="30" stroke={COLORS.outline} strokeWidth="0.2" />
          <line x1="670" y1="88" x2="695" y2="150" stroke={COLORS.outline} strokeWidth="0.2" />
        </g>
      </g>

      {/* ===== FLOATING PARTICLES (increasing density toward right) ===== */}
      <g>
        {[
          { x: 50, y: 40, r: 0.8, o: 0.15 }, { x: 120, y: 55, r: 0.8, o: 0.15 },
          { x: 200, y: 35, r: 1, o: 0.18 }, { x: 270, y: 50, r: 0.8, o: 0.18 },
          { x: 320, y: 30, r: 1, o: 0.2 }, { x: 380, y: 45, r: 0.8, o: 0.2 },
          { x: 420, y: 25, r: 1, o: 0.22 }, { x: 460, y: 40, r: 1, o: 0.22 },
          { x: 490, y: 55, r: 0.8, o: 0.25 }, { x: 520, y: 30, r: 1, o: 0.25 },
          { x: 540, y: 50, r: 1, o: 0.25 }, { x: 560, y: 35, r: 1.2, o: 0.28 },
          { x: 580, y: 20, r: 1, o: 0.28 }, { x: 600, y: 42, r: 1, o: 0.3 },
          { x: 610, y: 58, r: 1.2, o: 0.3 }, { x: 625, y: 30, r: 1, o: 0.32 },
          { x: 640, y: 50, r: 1.2, o: 0.32 }, { x: 650, y: 35, r: 1, o: 0.35 },
          { x: 660, y: 60, r: 1, o: 0.35 }, { x: 670, y: 45, r: 1.2, o: 0.35 },
          { x: 680, y: 25, r: 1, o: 0.3 }, { x: 690, y: 55, r: 1, o: 0.3 },
        ].map((p, i) => (
          <circle key={`cp-${i}`} cx={p.x} cy={p.y} r={p.r} fill={COLORS.neonGreen} opacity={p.o} />
        ))}
      </g>

      {/* ===== FLOATING HEXAGONS ===== */}
      <g opacity={0.15}>
        {[
          { x: 80, y: 25, s: 8 }, { x: 250, y: 18, s: 10 }, { x: 430, y: 15, s: 9 },
          { x: 600, y: 22, s: 11 }, { x: 160, y: 50, s: 7 }, { x: 550, y: 12, s: 8 },
        ].map((h, i) => (
          <polygon
            key={`hx-${i}`}
            points={[0, 1, 2, 3, 4, 5].map((j) => {
              const angle = (Math.PI / 3) * j - Math.PI / 6;
              return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={COLORS.brightGreen}
            strokeWidth="0.4"
          />
        ))}
      </g>

      {/* ===== THIN CONNECTING LINES ===== */}
      <g opacity={0.08}>
        <line x1="75" y1="130" x2="620" y2="85" stroke={COLORS.teal} strokeWidth="0.3" />
        <path d="M50 70 Q200 50 350 55 Q500 40 650 50" stroke={COLORS.outline} strokeWidth="0.3" fill="none" />
        <path d="M100 145 Q300 120 500 105 Q600 95 670 88" stroke={COLORS.brightGreen} strokeWidth="0.2" fill="none" strokeDasharray="4 6" />
      </g>
    </svg>
  );
}
