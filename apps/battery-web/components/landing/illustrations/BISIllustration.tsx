const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function BISIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Isometric ground plane */}
      <polygon points="200,165 380,145 200,125 20,145" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.5} />
      <line x1={200} y1={125} x2={200} y2={165} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.3} />

      {/* Grid lines on ground */}
      <g opacity={0.1}>
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`gl-${i}`} x1={56+i*24} y1={145-i*1.5} x2={200+(i-3)*24} y2={165-i*1.5} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        ))}
      </g>

      {/* Isometric platform left - lab bench */}
      <g>
        <polygon points="50,130 130,122 130,112 50,120" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="130,122 180,128 180,118 130,112" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="50,120 130,112 180,118 100,126" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Bench legs */}
        <line x1={55} y1={120} x2={55} y2={138} stroke={COLORS.outline} strokeWidth={0.6} strokeLinecap="round" />
        <line x1={125} y1={112} x2={125} y2={130} stroke={COLORS.outline} strokeWidth={0.6} strokeLinecap="round" />
        <line x1={175} y1={118} x2={175} y2={136} stroke={COLORS.outline} strokeWidth={0.6} strokeLinecap="round" />
      </g>

      {/* Test tubes on bench */}
      <g>
        <rect x={70} y={97} width={5} height={20} rx={2} stroke={COLORS.brightGreen} strokeWidth={0.6} fill={`${COLORS.brightGreen}15`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={78} y={100} width={5} height={17} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}10`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={86} y={95} width={5} height={22} rx={2} stroke={COLORS.teal} strokeWidth={0.6} fill={`${COLORS.teal}12`} strokeLinecap="round" strokeLinejoin="round" />
        {/* Liquid levels */}
        <rect x={71} y={107} width={3} height={8} rx={1} fill={COLORS.brightGreen} opacity={0.25} />
        <rect x={79} y={109} width={3} height={6} rx={1} fill={COLORS.neonGreen} opacity={0.2} />
        <rect x={87} y={106} width={3} height={9} rx={1} fill={COLORS.teal} opacity={0.2} />
        {/* Bubbles */}
        <circle cx={72} cy={104} r={1} fill={COLORS.neonGreen} opacity={0.4} />
        <circle cx={89} cy={102} r={0.8} fill={COLORS.teal} opacity={0.35} />
      </g>

      {/* Beaker on bench */}
      <g>
        <path d="M100 117 L97 100 Q97 96 101 96 L109 96 Q113 96 113 100 L110 117" stroke={COLORS.brightGreen} strokeWidth={0.6} fill={`${COLORS.brightGreen}08`} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M99 110 Q105 107 111 110 L110 117 L100 117 Z" fill={COLORS.brightGreen} opacity={0.15} />
      </g>

      {/* Microscope on bench */}
      <g>
        <line x1={140} y1={115} x2={140} y2={95} stroke={COLORS.outline} strokeWidth={0.8} strokeLinecap="round" />
        <line x1={140} y1={95} x2={150} y2={90} stroke={COLORS.outline} strokeWidth={0.8} strokeLinecap="round" />
        <ellipse cx={153} cy={89} rx={4} ry={2.5} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}15`} />
        <line x1={135} y1={115} x2={148} y2={115} stroke={COLORS.outline} strokeWidth={0.7} strokeLinecap="round" />
        <circle cx={140} cy={103} r={2} stroke={COLORS.teal} strokeWidth={0.4} fill={`${COLORS.teal}15`} />
      </g>

      {/* Central BIS Seal / Badge */}
      <g>
        {/* Outer ring */}
        <circle cx={200} cy={72} r={38} stroke={COLORS.neonGreen} strokeWidth={1} fill={`${COLORS.darkGreen2}80`} />
        <circle cx={200} cy={72} r={34} stroke={COLORS.brightGreen} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.4} />
        <circle cx={200} cy={72} r={30} stroke={COLORS.neonGreen} strokeWidth={0.8} fill={`${COLORS.midGreen}40`} />
        {/* Crown / star on top */}
        <path d="M200 30 L203 37 L210 37 L204 42 L207 49 L200 45 L193 49 L196 42 L190 37 L197 37 Z" stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}20`} strokeLinejoin="round" />
        {/* BIS text lines inside */}
        <line x1={186} y1={65} x2={214} y2={65} stroke={COLORS.neonGreen} strokeWidth={0.8} strokeLinecap="round" />
        <line x1={189} y1={70} x2={211} y2={70} stroke={COLORS.brightGreen} strokeWidth={0.6} strokeLinecap="round" />
        <line x1={192} y1={75} x2={208} y2={75} stroke={COLORS.brightGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={188} y1={80} x2={212} y2={80} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        {/* Inner decorative ring */}
        <circle cx={200} cy={72} r={24} stroke={COLORS.outline} strokeWidth={0.4} strokeDasharray="1.5 2" opacity={0.3} />
        {/* Seal ribbon bottom */}
        <path d="M188 104 L192 112 L196 105" stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}10`} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M204 104 L208 112 L212 105" stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}10`} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Conveyor belt with batteries - right side */}
      <g>
        {/* Belt base */}
        <polygon points="250,130 340,122 340,118 250,126" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="340,122 370,128 370,124 340,118" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Rollers */}
        <ellipse cx={260} cy={128} rx={4} ry={2} stroke={COLORS.outline} strokeWidth={0.4} />
        <ellipse cx={290} cy={125} rx={4} ry={2} stroke={COLORS.outline} strokeWidth={0.4} />
        <ellipse cx={320} cy={122} rx={4} ry={2} stroke={COLORS.outline} strokeWidth={0.4} />
        <ellipse cx={350} cy={125} rx={4} ry={2} stroke={COLORS.outline} strokeWidth={0.4} />
        {/* Battery 1 on conveyor */}
        <rect x={265} y={111} width={10} height={14} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}10`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={268} y={109} width={4} height={3} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} />
        {/* Battery 2 */}
        <rect x={295} y={108} width={10} height={14} rx={2} stroke={COLORS.brightGreen} strokeWidth={0.6} fill={`${COLORS.brightGreen}10`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={298} y={106} width={4} height={3} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} />
        {/* Battery 3 with checkmark */}
        <rect x={325} y={106} width={10} height={14} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}10`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={328} y={104} width={4} height={3} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} />
        <path d="M327 115 L330 118 L335 111" stroke={COLORS.lightGreen} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Stack of certification documents - right */}
      <g>
        <rect x={345} y={85} width={35} height={28} rx={2} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={348} y={82} width={35} height={28} rx={2} stroke={COLORS.brightGreen} strokeWidth={0.5} fill={`${COLORS.darkGreen1}90`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={351} y={79} width={35} height={28} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.darkGreen2}90`} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={356} y1={86} x2={380} y2={86} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" />
        <line x1={356} y1={90} x2={375} y2={90} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" />
        <line x1={356} y1={94} x2={378} y2={94} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" />
        <path d="M374 98 L377 101 L383 95" stroke={COLORS.neonGreen} strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Figure 1: Lab technician (left) */}
      <g>
        <circle cx={60} cy={88} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={57.5} y={92} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={58.5} y1={101} x2={57} y2={110} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={61.5} y1={101} x2={63} y2={110} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Arm reaching to bench */}
        <line x1={62.5} y1={94} x2={70} y2={100} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Figure 2: Inspector with clipboard (right) */}
      <g>
        <circle cx={355} cy={60} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={352.5} y={64} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={353.5} y1={73} x2={352} y2={82} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={356.5} y1={73} x2={358} y2={82} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Clipboard */}
        <rect x={359} y={65} width={7} height={10} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}10`} />
        <line x1={361} y1={68} x2={364} y2={68} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" />
        <line x1={361} y1={70} x2={365} y2={70} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" />
        <line x1={361} y1={72} x2={363} y2={72} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" />
      </g>

      {/* Plant 1 - left side */}
      <g>
        <path d="M30 145 Q28 130 35 120" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={36} cy={117} rx={4} ry={2.5} fill={COLORS.lightGreen} opacity={0.3} transform="rotate(-20 36 117)" />
        <path d="M30 145 Q35 133 42 128" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={44} cy={126} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(15 44 126)" />
      </g>

      {/* Plant 2 - right side */}
      <g>
        <path d="M385 148 Q383 135 388 125" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={389} cy={122} rx={4} ry={2.5} fill={COLORS.lightGreen} opacity={0.3} transform="rotate(-10 389 122)" />
        <path d="M385 148 Q390 138 395 132" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={397} cy={130} rx={3} ry={2} fill={COLORS.lightGreen} opacity={0.2} transform="rotate(20 397 130)" />
      </g>

      {/* Floating hexagons */}
      {[
        { x: 25, y: 25, s: 10 }, { x: 375, y: 20, s: 8 }, { x: 170, y: 15, s: 7 },
        { x: 320, y: 50, s: 6 }, { x: 45, y: 55, s: 9 },
      ].map((h, i) => {
        const pts = Array.from({ length: 6 }).map((_, j) => {
          const angle = (Math.PI / 3) * j - Math.PI / 6;
          return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={`hex-${i}`} points={pts} stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={i % 2 === 0 ? 0.15 : 0.2} />;
      })}

      {/* Scattered particles */}
      {[
        { x: 15, y: 18 }, { x: 95, y: 12 }, { x: 155, y: 8 }, { x: 245, y: 14 },
        { x: 310, y: 10 }, { x: 390, y: 40 }, { x: 12, y: 100 }, { x: 395, y: 95 },
        { x: 120, y: 170 }, { x: 280, y: 168 }, { x: 50, y: 165 }, { x: 350, y: 160 },
      ].map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 1.5 : 1} fill={COLORS.neonGreen} opacity={0.2 + (i % 3) * 0.05} />
      ))}

      {/* Connecting lines */}
      <g opacity={0.1}>
        <line x1={90} y1={90} x2={165} y2={72} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={235} y1={72} x2={260} y2={115} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <path d="M180 115 Q200 105 220 110" stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeDasharray="3 3" />
      </g>
    </svg>
  );
}
