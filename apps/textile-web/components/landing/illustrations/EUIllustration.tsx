const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function EUIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Isometric ground plane */}
      <polygon points="200,170 390,150 200,130 10,150" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.5} />
      <g opacity={0.08}>
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`gl-${i}`} x1={40+i*26} y1={150-i*1} x2={200+(i-3)*26} y2={170-i*1.5} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        ))}
      </g>

      {/* EU circle of stars - left */}
      <g>
        <circle cx={80} cy={78} r={32} stroke={COLORS.neonGreen} strokeWidth={0.6} strokeDasharray="2 3" opacity={0.3} />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (Math.PI / 6) * i - Math.PI / 2;
          const sx = 80 + 26 * Math.cos(angle);
          const sy = 78 + 26 * Math.sin(angle);
          return (
            <g key={`star-${i}`}>
              <circle cx={sx} cy={sy} r={2.5} fill={COLORS.neonGreen} opacity={0.5} />
              <circle cx={sx} cy={sy} r={1} fill={COLORS.neonGreen} opacity={0.8} />
            </g>
          );
        })}
        <circle cx={80} cy={78} r={18} stroke={COLORS.outline} strokeWidth={0.4} opacity={0.2} />
        <circle cx={80} cy={78} r={8} stroke={COLORS.neonGreen} strokeWidth={0.3} opacity={0.2} />
      </g>

      {/* Digital passport card - center, hovering */}
      <g>
        {/* Shadow */}
        <ellipse cx={210} cy={128} rx={50} ry={6} fill={COLORS.darkGreen1} opacity={0.3} />
        {/* Card body */}
        <rect x={155} y={42} width={110} height={70} rx={6} stroke={COLORS.neonGreen} strokeWidth={0.8} fill={`${COLORS.darkGreen2}90`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={160} y={47} width={100} height={60} rx={4} stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.darkGreen1}60`} />
        {/* Chip pattern */}
        <rect x={168} y={55} width={16} height={12} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}10`} />
        <line x1={172} y1={55} x2={172} y2={67} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        <line x1={178} y1={55} x2={178} y2={67} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        <line x1={168} y1={61} x2={184} y2={61} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        {/* QR code grid */}
        <g opacity={0.45}>
          {[0,1,2,3,4,5].map(r => [0,1,2,3,4,5].map(c => {
            const filled = (r < 2 && c < 2) || (r < 2 && c > 3) || (r > 3 && c < 2) || (r + c) % 3 === 0;
            return filled ? (
              <rect key={`qr-${r}-${c}`} x={228 + c * 5} y={53 + r * 5} width={4} height={4} rx={0.5} fill={COLORS.teal} opacity={0.5} />
            ) : null;
          }))}
        </g>
        {/* Data lines on card */}
        <line x1={168} y1={76} x2={218} y2={76} stroke={COLORS.brightGreen} strokeWidth={0.4} strokeLinecap="round" opacity={0.4} />
        <line x1={168} y1={81} x2={208} y2={81} stroke={COLORS.brightGreen} strokeWidth={0.35} strokeLinecap="round" opacity={0.3} />
        <line x1={168} y1={86} x2={215} y2={86} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.3} />
        <line x1={168} y1={91} x2={200} y2={91} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.25} />
        <line x1={168} y1={96} x2={210} y2={96} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.2} />
        {/* Holographic shimmer lines */}
        <line x1={155} y1={50} x2={265} y2={50} stroke={COLORS.neonGreen} strokeWidth={0.2} opacity={0.15} />
        <line x1={155} y1={105} x2={265} y2={105} stroke={COLORS.neonGreen} strokeWidth={0.2} opacity={0.15} />
      </g>

      {/* European building silhouette - left bottom */}
      <g opacity={0.35}>
        {/* Building base */}
        <rect x={40} y={122} width={35} height={25} rx={1} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}60`} />
        {/* Columns */}
        <line x1={46} y1={122} x2={46} y2={147} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={53} y1={122} x2={53} y2={147} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={60} y1={122} x2={60} y2={147} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={67} y1={122} x2={67} y2={147} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        {/* Triangular roof */}
        <path d="M38 122 L57 108 L77 122" stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}40`} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Globe - right */}
      <g>
        <circle cx={340} cy={72} r={30} stroke={COLORS.neonGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}40`} />
        <ellipse cx={340} cy={72} rx={30} ry={10} stroke={COLORS.outline} strokeWidth={0.4} strokeDasharray="3 3" opacity={0.3} />
        <ellipse cx={340} cy={72} rx={10} ry={30} stroke={COLORS.outline} strokeWidth={0.4} strokeDasharray="3 3" opacity={0.3} />
        <ellipse cx={340} cy={60} rx={24} ry={4} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.2} />
        <ellipse cx={340} cy={84} rx={24} ry={4} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.2} />
        <ellipse cx={340} cy={72} rx={20} ry={30} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 4" opacity={0.2} />
        {/* Europe highlight */}
        <circle cx={348} cy={65} r={3} fill={COLORS.neonGreen} opacity={0.3} />
        <circle cx={342} cy={70} r={2} fill={COLORS.teal} opacity={0.3} />
        <circle cx={352} cy={72} r={1.5} fill={COLORS.brightGreen} opacity={0.25} />
      </g>

      {/* Floating data nodes connected to passport */}
      <g opacity={0.35}>
        {[
          { x: 140, y: 30 }, { x: 275, y: 28 }, { x: 285, y: 95 }, { x: 145, y: 100 },
        ].map((n, i) => (
          <g key={`dn-${i}`}>
            <circle cx={n.x} cy={n.y} r={3} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}15`} />
            <line x1={n.x} y1={n.y} x2={210} y2={70} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeDasharray="2 2" strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* Figure 1: interacting with passport hologram */}
      <g>
        <circle cx={145} cy={110} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={142.5} y={114} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={143.5} y1={123} x2={142} y2={132} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={146.5} y1={123} x2={148} y2={132} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={147.5} y1={116} x2={155} y2={108} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Figure 2: viewing globe data */}
      <g>
        <circle cx={310} cy={112} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={307.5} y={116} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={308.5} y1={125} x2={307} y2={134} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={311.5} y1={125} x2={313} y2={134} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={312.5} y1={118} x2={320} y2={112} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Plant elements */}
      <g>
        <path d="M15 155 Q12 140 18 130" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={20} cy={128} rx={4} ry={2.5} fill={COLORS.lightGreen} opacity={0.3} transform="rotate(-25 20 128)" />
        <path d="M15 155 Q20 145 27 140" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={29} cy={138} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(15 29 138)" />
      </g>
      <g>
        <path d="M385 152 Q383 140 388 132" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={390} cy={130} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(-10 390 130)" />
      </g>

      {/* Floating hexagons */}
      {[
        { x: 20, y: 20, s: 9 }, { x: 380, y: 15, s: 8 }, { x: 200, y: 8, s: 7 },
        { x: 120, y: 155, s: 6 }, { x: 290, y: 160, s: 7 },
      ].map((h, i) => {
        const pts = Array.from({ length: 6 }).map((_, j) => {
          const angle = (Math.PI / 3) * j - Math.PI / 6;
          return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={`hex-${i}`} points={pts} stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.15 + (i % 2) * 0.05} />;
      })}

      {/* Scattered particles */}
      {[
        { x: 8, y: 12 }, { x: 100, y: 5 }, { x: 180, y: 3 }, { x: 260, y: 8 },
        { x: 350, y: 5 }, { x: 395, y: 38 }, { x: 5, y: 95 }, { x: 395, y: 100 },
        { x: 90, y: 172 }, { x: 250, y: 175 }, { x: 370, y: 168 }, { x: 30, y: 170 },
      ].map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 1.5 : 1} fill={COLORS.neonGreen} opacity={0.2 + (i % 3) * 0.05} />
      ))}

      {/* Connecting lines */}
      <g opacity={0.1}>
        <line x1={110} y1={78} x2={155} y2={70} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={265} y1={72} x2={310} y2={72} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <path d="M210 112 Q210 125 210 135" stroke={COLORS.teal} strokeWidth={0.3} strokeLinecap="round" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}
