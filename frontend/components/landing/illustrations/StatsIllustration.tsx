const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function StatsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1320 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* ===== ISOMETRIC GROUND PLANE GRID ===== */}
      <g opacity={0.06}>
        {Array.from({ length: 28 }).map((_, i) => (
          <line key={`vg-${i}`} x1={i * 50} y1="400" x2={i * 50 + 150} y2="280" stroke={COLORS.outline} strokeWidth="0.4" />
        ))}
        {Array.from({ length: 28 }).map((_, i) => (
          <line key={`vg2-${i}`} x1={i * 50 + 150} y1="400" x2={i * 50} y2="280" stroke={COLORS.outline} strokeWidth="0.4" />
        ))}
        {[280, 300, 320, 340, 360, 380, 400].map((y, i) => (
          <line key={`hg-${i}`} x1="0" y1={y} x2="1320" y2={y} stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
      </g>

      {/* ===== FLOWING CURVE PATHS (data landscape hills) ===== */}
      <g opacity={0.08}>
        <path d="M0 320 Q150 280 330 290 Q500 300 660 270 Q830 240 990 260 Q1150 280 1320 250" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
        <path d="M0 340 Q180 310 400 320 Q600 330 800 295 Q1000 260 1150 280 Q1250 290 1320 275" stroke={COLORS.teal} strokeWidth="0.6" fill="none" />
        <path d="M0 360 Q200 335 420 345 Q660 355 880 320 Q1060 290 1200 305 Q1280 315 1320 300" stroke={COLORS.outline} strokeWidth="0.5" fill="none" />
        <path d="M0 300 Q120 270 280 275 Q440 280 600 255 Q780 230 960 250 Q1120 260 1320 235" stroke={COLORS.neonGreen} strokeWidth="0.5" fill="none" />
      </g>

      {/* ===== DATA POINT CIRCLES ON CURVES ===== */}
      <g opacity={0.1}>
        {[
          { x: 80, y: 310 }, { x: 200, y: 290 }, { x: 330, y: 290 }, { x: 480, y: 298 },
          { x: 600, y: 280 }, { x: 730, y: 260 }, { x: 860, y: 255 }, { x: 990, y: 260 },
          { x: 1100, y: 270 }, { x: 1230, y: 258 },
          { x: 150, y: 330 }, { x: 350, y: 320 }, { x: 550, y: 325 }, { x: 750, y: 300 },
          { x: 950, y: 275 }, { x: 1120, y: 282 }, { x: 1270, y: 280 },
          { x: 100, y: 355 }, { x: 300, y: 340 }, { x: 520, y: 348 }, { x: 700, y: 340 },
          { x: 900, y: 315 }, { x: 1080, y: 295 }, { x: 1250, y: 305 },
        ].map((pt, i) => (
          <circle key={`dp-${i}`} cx={pt.x} cy={pt.y} r={1.5 + (i % 3) * 0.5} fill="none" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        ))}
      </g>

      {/* ===== BUILDING SILHOUETTES ALONG HORIZON ===== */}
      <g opacity={0.06}>
        {/* Building cluster left */}
        <rect x="50" y="260" width="18" height="35" fill={COLORS.outline} />
        <rect x="72" y="250" width="14" height="45" fill={COLORS.outline} />
        <rect x="90" y="265" width="20" height="30" fill={COLORS.outline} />
        <rect x="115" y="255" width="12" height="40" fill={COLORS.outline} />
        {/* Building cluster center-left */}
        <rect x="350" y="260" width="16" height="30" fill={COLORS.outline} />
        <rect x="370" y="248" width="22" height="42" fill={COLORS.outline} />
        <rect x="396" y="258" width="14" height="32" fill={COLORS.outline} />
        {/* Building cluster center */}
        <rect x="630" y="245" width="20" height="35" fill={COLORS.outline} />
        <rect x="654" y="238" width="16" height="42" fill={COLORS.outline} />
        <rect x="674" y="252" width="18" height="28" fill={COLORS.outline} />
        {/* Building cluster center-right */}
        <rect x="900" y="250" width="14" height="30" fill={COLORS.outline} />
        <rect x="918" y="240" width="20" height="40" fill={COLORS.outline} />
        <rect x="942" y="255" width="12" height="25" fill={COLORS.outline} />
        {/* Building cluster right */}
        <rect x="1180" y="248" width="18" height="32" fill={COLORS.outline} />
        <rect x="1202" y="238" width="14" height="42" fill={COLORS.outline} />
        <rect x="1220" y="252" width="20" height="28" fill={COLORS.outline} />
      </g>

      {/* ===== NODE-AND-LINE CONSTELLATION ===== */}
      <g opacity={0.1}>
        {/* Nodes */}
        {[
          { x: 120, y: 100 }, { x: 240, y: 80 }, { x: 380, y: 120 }, { x: 500, y: 70 },
          { x: 640, y: 90 }, { x: 780, y: 60 }, { x: 900, y: 100 }, { x: 1020, y: 75 },
          { x: 1140, y: 110 }, { x: 1260, y: 85 },
          { x: 180, y: 150 }, { x: 320, y: 170 }, { x: 440, y: 140 }, { x: 580, y: 160 },
          { x: 720, y: 130 }, { x: 860, y: 155 }, { x: 980, y: 140 }, { x: 1100, y: 165 },
          { x: 1200, y: 145 },
          { x: 60, y: 60 }, { x: 660, y: 40 }, { x: 1300, y: 50 },
        ].map((n, i) => (
          <circle key={`cn-${i}`} cx={n.x} cy={n.y} r={1.5 + (i % 4) * 0.5} fill="none" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        ))}
        {/* Connecting lines */}
        <line x1="120" y1="100" x2="240" y2="80" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="240" y1="80" x2="380" y2="120" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="380" y1="120" x2="500" y2="70" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="500" y1="70" x2="640" y2="90" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="640" y1="90" x2="780" y2="60" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="780" y1="60" x2="900" y2="100" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="900" y1="100" x2="1020" y2="75" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="1020" y1="75" x2="1140" y2="110" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="1140" y1="110" x2="1260" y2="85" stroke={COLORS.outline} strokeWidth="0.3" />
        {/* Cross links */}
        <line x1="120" y1="100" x2="180" y2="150" stroke={COLORS.teal} strokeWidth="0.2" />
        <line x1="240" y1="80" x2="320" y2="170" stroke={COLORS.teal} strokeWidth="0.2" />
        <line x1="500" y1="70" x2="580" y2="160" stroke={COLORS.teal} strokeWidth="0.2" />
        <line x1="640" y1="90" x2="720" y2="130" stroke={COLORS.teal} strokeWidth="0.2" />
        <line x1="900" y1="100" x2="980" y2="140" stroke={COLORS.teal} strokeWidth="0.2" />
        <line x1="1020" y1="75" x2="1100" y2="165" stroke={COLORS.teal} strokeWidth="0.2" />
        <line x1="1140" y1="110" x2="1200" y2="145" stroke={COLORS.teal} strokeWidth="0.2" />
        {/* Secondary chain */}
        <line x1="180" y1="150" x2="320" y2="170" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="320" y1="170" x2="440" y2="140" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="440" y1="140" x2="580" y2="160" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="580" y1="160" x2="720" y2="130" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="720" y1="130" x2="860" y2="155" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="860" y1="155" x2="980" y2="140" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="980" y1="140" x2="1100" y2="165" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="1100" y1="165" x2="1200" y2="145" stroke={COLORS.outline} strokeWidth="0.2" />
        {/* Outer links */}
        <line x1="60" y1="60" x2="120" y2="100" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="660" y1="40" x2="640" y2="90" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="660" y1="40" x2="780" y2="60" stroke={COLORS.outline} strokeWidth="0.2" />
        <line x1="1300" y1="50" x2="1260" y2="85" stroke={COLORS.outline} strokeWidth="0.2" />
      </g>

      {/* ===== SPARSE HUMAN FIGURES ===== */}
      <g opacity={0.08}>
        {/* Figure 1 */}
        <circle cx="200" cy="322" r="2.5" fill={COLORS.figureLight} />
        <rect x="198" y="325" width="4" height="8" rx="1" fill={COLORS.figureLight} />
        <line x1="199" y1="333" x2="197" y2="340" stroke={COLORS.figureLight} strokeWidth="0.8" />
        <line x1="203" y1="333" x2="205" y2="340" stroke={COLORS.figureLight} strokeWidth="0.8" />
        {/* Figure 2 */}
        <circle cx="660" cy="300" r="2.5" fill={COLORS.figureLight} />
        <rect x="658" y="303" width="4" height="8" rx="1" fill={COLORS.figureLight} />
        <line x1="659" y1="311" x2="657" y2="318" stroke={COLORS.figureLight} strokeWidth="0.8" />
        <line x1="663" y1="311" x2="665" y2="318" stroke={COLORS.figureLight} strokeWidth="0.8" />
        {/* Figure 3 */}
        <circle cx="1080" cy="310" r="2.5" fill={COLORS.figureLight} />
        <rect x="1078" y="313" width="4" height="8" rx="1" fill={COLORS.figureLight} />
        <line x1="1079" y1="321" x2="1077" y2="328" stroke={COLORS.figureLight} strokeWidth="0.8" />
        <line x1="1083" y1="321" x2="1085" y2="328" stroke={COLORS.figureLight} strokeWidth="0.8" />
      </g>

      {/* ===== FLOATING HEXAGONS ===== */}
      <g opacity={0.07}>
        {[
          { x: 100, y: 200, s: 20 }, { x: 330, y: 220, s: 16 }, { x: 550, y: 210, s: 22 },
          { x: 770, y: 195, s: 18 }, { x: 990, y: 215, s: 20 }, { x: 1220, y: 200, s: 16 },
          { x: 200, y: 50, s: 14 }, { x: 500, y: 30, s: 18 }, { x: 820, y: 20, s: 16 },
          { x: 1100, y: 40, s: 14 },
        ].map((h, i) => (
          <polygon
            key={`shx-${i}`}
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

      {/* ===== SCATTERED PARTICLES ===== */}
      <g>
        {[
          { x: 30, y: 40, r: 1, o: 0.08 }, { x: 90, y: 130, r: 0.8, o: 0.06 },
          { x: 170, y: 60, r: 1, o: 0.08 }, { x: 260, y: 180, r: 0.8, o: 0.06 },
          { x: 350, y: 50, r: 1, o: 0.1 }, { x: 450, y: 190, r: 0.8, o: 0.06 },
          { x: 540, y: 100, r: 1, o: 0.08 }, { x: 630, y: 180, r: 0.8, o: 0.06 },
          { x: 720, y: 50, r: 1, o: 0.08 }, { x: 810, y: 160, r: 0.8, o: 0.06 },
          { x: 900, y: 80, r: 1, o: 0.1 }, { x: 990, y: 190, r: 0.8, o: 0.06 },
          { x: 1080, y: 60, r: 1, o: 0.08 }, { x: 1170, y: 150, r: 0.8, o: 0.06 },
          { x: 1260, y: 90, r: 1, o: 0.08 },
          { x: 60, y: 380, r: 0.8, o: 0.05 }, { x: 250, y: 370, r: 0.8, o: 0.05 },
          { x: 480, y: 380, r: 0.8, o: 0.05 }, { x: 700, y: 370, r: 0.8, o: 0.05 },
          { x: 920, y: 380, r: 0.8, o: 0.05 }, { x: 1150, y: 375, r: 0.8, o: 0.05 },
        ].map((p, i) => (
          <circle key={`sp-${i}`} cx={p.x} cy={p.y} r={p.r} fill={COLORS.neonGreen} opacity={p.o} />
        ))}
      </g>

      {/* ===== VERY FAINT DASHED REFERENCE LINES ===== */}
      <g opacity={0.04}>
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`vrl-${i}`} x1={50 + i * 95} y1="0" x2={50 + i * 95} y2="400" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="2 8" />
        ))}
        {[60, 120, 180, 240].map((y, i) => (
          <line key={`hrl-${i}`} x1="0" y1={y} x2="1320" y2={y} stroke={COLORS.outline} strokeWidth="0.3" strokeDasharray="2 8" />
        ))}
      </g>

      {/* ===== SUBTLE ISOMETRIC PLATFORM OUTLINES ===== */}
      <g opacity={0.05}>
        <polygon points="200,320 350,280 500,320 350,360" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
        <polygon points="550,310 700,270 850,310 700,350" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
        <polygon points="900,315 1050,275 1200,315 1050,355" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
      </g>
    </svg>
  );
}
