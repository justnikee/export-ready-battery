const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function CPCBIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Isometric ground plane */}
      <polygon points="200,170 390,150 200,130 10,150" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.5} />
      <g opacity={0.08}>
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`gl-${i}`} x1={40+i*26} y1={150-i*1} x2={200+(i-3)*26} y2={170-i*1.5} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        ))}
      </g>

      {/* Large spreadsheet/form document - center, isometric angled */}
      <g>
        {/* Document shadow */}
        <ellipse cx={195} cy={130} rx={52} ry={6} fill={COLORS.darkGreen1} opacity={0.3} />
        {/* Document body - slight isometric tilt */}
        <rect x={140} y={22} width={110} height={100} rx={4} stroke={COLORS.neonGreen} strokeWidth={0.8} fill={`${COLORS.darkGreen2}90`} strokeLinecap="round" strokeLinejoin="round" />
        {/* Header row */}
        <rect x={140} y={22} width={110} height={14} rx={4} stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.midGreen}50`} />
        {/* Column headers */}
        <line x1={168} y1={22} x2={168} y2={122} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.3} />
        <line x1={196} y1={22} x2={196} y2={122} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.3} />
        <line x1={224} y1={22} x2={224} y2={122} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.3} />
        {/* Horizontal grid lines */}
        {[40, 52, 64, 76, 88, 100, 112].map((y, i) => (
          <line key={`sh-${i}`} x1={144} y1={y} x2={246} y2={y} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.25} />
        ))}
        {/* Data cell content */}
        <g opacity={0.35}>
          {[44, 56, 68, 80, 92, 104].map((y, ri) => (
            <g key={`row-${ri}`}>
              <line x1={146} y1={y} x2={163} y2={y} stroke={COLORS.brightGreen} strokeWidth={0.4} strokeLinecap="round" />
              <line x1={172} y1={y} x2={192} y2={y} stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" />
              <line x1={200} y1={y} x2={220} y2={y} stroke={COLORS.brightGreen} strokeWidth={0.4} strokeLinecap="round" />
              <line x1={228} y1={y} x2={244} y2={y} stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" />
            </g>
          ))}
        </g>
        {/* Highlighted row */}
        <rect x={141} y={66} width={108} height={12} rx={0} fill={COLORS.neonGreen} opacity={0.06} />
      </g>

      {/* Cloud with upload arrow - top right */}
      <g>
        <path d="M310 48 C310 34 324 25 337 30 C341 16 365 16 369 30 C382 26 392 35 388 48 C396 52 392 65 384 65 L315 65 C306 65 302 56 310 48 Z" stroke={COLORS.neonGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}60`} strokeLinecap="round" strokeLinejoin="round" />
        {/* Upload arrow */}
        <line x1={350} y1={58} x2={350} y2={40} stroke={COLORS.neonGreen} strokeWidth={0.8} strokeLinecap="round" />
        <path d="M344 46 L350 38 L356 46" stroke={COLORS.neonGreen} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Export arrow from document to cloud */}
      <g opacity={0.4}>
        <path d="M250 45 C270 40 290 38 310 42" stroke={COLORS.neonGreen} strokeWidth={0.6} strokeLinecap="round" strokeDasharray="4 3" />
        <polygon points="307,39 313,42 307,45" fill={COLORS.neonGreen} opacity={0.5} />
      </g>

      {/* Filing cabinet - left */}
      <g>
        {/* Cabinet body */}
        <rect x={30} y={55} width={50} height={72} rx={3} stroke={COLORS.outline} strokeWidth={0.6} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        {/* Drawer divisions */}
        <line x1={30} y1={79} x2={80} y2={79} stroke={COLORS.outline} strokeWidth={0.4} />
        <line x1={30} y1={103} x2={80} y2={103} stroke={COLORS.outline} strokeWidth={0.4} />
        {/* Drawer handles */}
        <line x1={50} y1={67} x2={60} y2={67} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={50} y1={91} x2={60} y2={91} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={50} y1={115} x2={60} y2={115} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        {/* Folder tabs sticking up */}
        <rect x={38} y={48} width={16} height={8} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} />
        <rect x={56} y={45} width={14} height={11} rx={1} stroke={COLORS.teal} strokeWidth={0.4} fill={`${COLORS.teal}08`} />
        {/* Folder labels */}
        <line x1={40} y1={51} x2={50} y2={51} stroke={COLORS.brightGreen} strokeWidth={0.2} strokeLinecap="round" />
        <line x1={58} y1={49} x2={66} y2={49} stroke={COLORS.teal} strokeWidth={0.2} strokeLinecap="round" />
      </g>

      {/* Automated workflow pipeline - bottom */}
      <g>
        {/* Pipeline track */}
        <line x1={80} y1={148} x2={330} y2={148} stroke={COLORS.outline} strokeWidth={0.4} opacity={0.3} />
        {/* Node 1: Document */}
        <circle cx={100} cy={148} r={8} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}80`} />
        <rect x={96} y={144} width={8} height={8} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.3} />
        <line x1={98} y1={147} x2={102} y2={147} stroke={COLORS.brightGreen} strokeWidth={0.2} strokeLinecap="round" />
        {/* Arrow */}
        <line x1={108} y1={148} x2={140} y2={148} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <polygon points="138,146 142,148 138,150" fill={COLORS.neonGreen} opacity={0.4} />
        {/* Node 2: Process */}
        <circle cx={155} cy={148} r={8} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}80`} />
        <path d="M151 146 L155 150 L159 146" stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
        {/* Arrow */}
        <line x1={163} y1={148} x2={195} y2={148} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <polygon points="193,146 197,148 193,150" fill={COLORS.neonGreen} opacity={0.4} />
        {/* Node 3: Upload */}
        <circle cx={210} cy={148} r={8} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}80`} />
        <line x1={210} y1={152} x2={210} y2={144} stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" />
        <path d="M207 147 L210 144 L213 147" stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" strokeLinejoin="round" />
        {/* Arrow */}
        <line x1={218} y1={148} x2={250} y2={148} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <polygon points="248,146 252,148 248,150" fill={COLORS.neonGreen} opacity={0.4} />
        {/* Node 4: Verify */}
        <circle cx={265} cy={148} r={8} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.darkGreen2}80`} />
        <path d="M262 148 L264 150 L269 145" stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
        {/* Arrow */}
        <line x1={273} y1={148} x2={305} y2={148} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <polygon points="303,146 307,148 303,150" fill={COLORS.neonGreen} opacity={0.4} />
        {/* Node 5: Complete (checkmark) */}
        <circle cx={320} cy={148} r={8} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}12`} />
        <path d="M316 148 L319 151 L325 144" stroke={COLORS.neonGreen} strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Terminal/export button - right */}
      <g>
        {/* Terminal body */}
        <rect x={330} y={80} width={55} height={42} rx={3} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={330} y={80} width={55} height={10} rx={3} stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.midGreen}40`} />
        {/* Window dots */}
        <circle cx={337} cy={85} r={1.5} fill={COLORS.brightGreen} opacity={0.4} />
        <circle cx={343} cy={85} r={1.5} fill={COLORS.neonGreen} opacity={0.3} />
        <circle cx={349} cy={85} r={1.5} fill={COLORS.outline} opacity={0.3} />
        {/* Terminal content */}
        <line x1={336} y1={96} x2={348} y2={96} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.5} />
        <line x1={336} y1={100} x2={355} y2={100} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.4} />
        <line x1={336} y1={104} x2={350} y2={104} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.35} />
        {/* Export button */}
        <rect x={340} y={110} width={35} height={8} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}15`} />
        <line x1={348} y1={114} x2={366} y2={114} stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" />
      </g>

      {/* Figure 1: reviewing documents (left) */}
      <g>
        <circle cx={100} cy={70} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={97.5} y={74} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={98.5} y1={83} x2={97} y2={92} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={101.5} y1={83} x2={103} y2={92} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={102.5} y1={76} x2={110} y2={72} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Figure 2: pressing export button (right) */}
      <g>
        <circle cx={370} cy={105} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={367.5} y={109} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={368.5} y1={118} x2={367} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={371.5} y1={118} x2={373} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Arm pressing button */}
        <line x1={367.5} y1={111} x2={360} y2={114} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Plant - left */}
      <g>
        <path d="M15 155 Q12 140 18 130" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={20} cy={128} rx={4} ry={2.5} fill={COLORS.lightGreen} opacity={0.3} transform="rotate(-25 20 128)" />
        <path d="M15 155 Q20 145 27 140" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={29} cy={138} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(15 29 138)" />
      </g>

      {/* Floating hexagons */}
      {[
        { x: 22, y: 20, s: 9 }, { x: 390, y: 18, s: 8 }, { x: 200, y: 8, s: 7 },
        { x: 110, y: 160, s: 6 }, { x: 355, y: 158, s: 7 },
      ].map((h, i) => {
        const pts = Array.from({ length: 6 }).map((_, j) => {
          const angle = (Math.PI / 3) * j - Math.PI / 6;
          return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={`hex-${i}`} points={pts} stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.15 + (i % 2) * 0.05} />;
      })}

      {/* Scattered particles */}
      {[
        { x: 8, y: 12 }, { x: 120, y: 5 }, { x: 270, y: 8 }, { x: 395, y: 35 },
        { x: 5, y: 90 }, { x: 395, y: 95 }, { x: 50, y: 172 }, { x: 170, y: 175 },
        { x: 280, y: 172 }, { x: 360, y: 170 }, { x: 200, y: 178 }, { x: 80, y: 175 },
      ].map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 1.5 : 1} fill={COLORS.neonGreen} opacity={0.2 + (i % 3) * 0.05} />
      ))}

      {/* Connecting lines */}
      <g opacity={0.1}>
        <line x1={80} y1={90} x2={140} y2={70} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={250} y1={70} x2={330} y2={85} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <path d="M195 122 Q195 135 195 145" stroke={COLORS.teal} strokeWidth={0.3} strokeLinecap="round" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}
