const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

/* ──────────────────────────────────────────────────────────────
   ManufacturerIllustration – Factory scene
   ────────────────────────────────────────────────────────────── */
export function ManufacturerIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric ground platform === */}
      <polygon points="25,130 160,152 295,130 160,108" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <line x1={60} y1={119} x2={195} y2={141} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={115} x2={230} y2={137} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={128} y1={111} x2={263} y2={133} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={141} x2={230} y2={119} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={128} y1={145} x2={263} y2={123} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />

      {/* === Factory building – isometric multi-level === */}
      {/* Front face */}
      <polygon points="85,58 85,122 175,132 175,68" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.7} strokeLinejoin="round" />
      {/* Top face */}
      <polygon points="85,58 175,68 245,48 155,38" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.7} strokeLinejoin="round" />
      {/* Right face */}
      <polygon points="175,68 245,48 245,108 175,132" fill={`${COLORS.brandGreen}80`} stroke={COLORS.outline} strokeWidth={0.7} strokeLinejoin="round" />

      {/* Second storey block */}
      <polygon points="100,32 100,58 160,65 160,39" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.5} strokeLinejoin="round" />
      <polygon points="100,32 160,39 215,24 155,17" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.5} strokeLinejoin="round" />
      <polygon points="160,39 215,24 215,48 160,65" fill={`${COLORS.brandGreen}80`} stroke={COLORS.outline} strokeWidth={0.5} strokeLinejoin="round" />

      {/* Front face windows */}
      <rect x={95} y={74} width={11} height={9} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}15`} />
      <rect x={112} y={77} width={11} height={9} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}15`} />
      <rect x={129} y={80} width={11} height={9} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}15`} />
      <rect x={146} y={83} width={11} height={9} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}15`} />
      {/* Second storey windows */}
      <rect x={110} y={40} width={9} height={7} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.3} fill={`${COLORS.brightGreen}10`} />
      <rect x={127} y={43} width={9} height={7} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.3} fill={`${COLORS.brightGreen}10`} />
      {/* Right face windows */}
      <rect x={190} y={62} width={10} height={8} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brightGreen}10`} />
      <rect x={210} y={58} width={10} height={8} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brightGreen}10`} />

      {/* Chimney stack */}
      <rect x={222} y={12} width={14} height={36} rx={1} stroke={COLORS.outline} strokeWidth={0.6} fill={COLORS.darkGreen2} />
      <rect x={220} y={9} width={18} height={5} rx={1} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.midGreen} />
      {/* Smoke wisps */}
      <path d="M229 9 C229 2 235 0 233 -6" stroke={COLORS.neonGreen} strokeWidth={0.4} opacity={0.15} strokeLinecap="round" fill="none" />
      <path d="M225 7 C223 1 229 -2 227 -8" stroke={COLORS.neonGreen} strokeWidth={0.35} opacity={0.12} strokeLinecap="round" fill="none" />
      <path d="M233 8 C235 2 240 0 238 -5" stroke={COLORS.neonGreen} strokeWidth={0.3} opacity={0.1} strokeLinecap="round" fill="none" />

      {/* === Conveyor belt === */}
      <line x1={35} y1={124} x2={175} y2={138} stroke={COLORS.outline} strokeWidth={0.8} strokeLinecap="round" />
      <line x1={35} y1={128} x2={175} y2={142} stroke={COLORS.outline} strokeWidth={0.8} strokeLinecap="round" />
      {/* Batteries on conveyor */}
      {[{x:50,y:123},{x:78,y:126},{x:106,y:129},{x:134,y:132}].map((b, i) => (
        <g key={`cb-${i}`}>
          <rect x={b.x} y={b.y} width={12} height={7} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}15`} />
          <rect x={b.x + 4} y={b.y - 2} width={4} height={2.5} rx={0.5} stroke={COLORS.neonGreen} strokeWidth={0.3} fill={`${COLORS.neonGreen}10`} />
        </g>
      ))}
      {/* Rollers */}
      {[42, 64, 86, 108, 130, 152, 170].map((x, i) => (
        <circle key={`rl-${i}`} cx={x} cy={126 + (x - 42) * 0.11} r={1.8} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />
      ))}

      {/* === Robotic arm === */}
      <circle cx={260} cy={80} r={3.5} stroke={COLORS.brightGreen} strokeWidth={0.6} fill={COLORS.darkGreen2} />
      <line x1={260} y1={80} x2={278} y2={64} stroke={COLORS.brightGreen} strokeWidth={0.8} strokeLinecap="round" />
      <circle cx={278} cy={64} r={2} stroke={COLORS.brightGreen} strokeWidth={0.5} fill={COLORS.darkGreen2} />
      <line x1={278} y1={64} x2={290} y2={80} stroke={COLORS.brightGreen} strokeWidth={0.8} strokeLinecap="round" />
      <circle cx={290} cy={80} r={1.5} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={COLORS.darkGreen2} />
      <line x1={288} y1={80} x2={285} y2={88} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
      <line x1={292} y1={80} x2={295} y2={88} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
      {/* Arm base */}
      <rect x={255} y={82} width={10} height={4} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />

      {/* === Gear symbols === */}
      <circle cx={268} cy={105} r={7} stroke={COLORS.outline} strokeWidth={0.5} fill="none" />
      <circle cx={268} cy={105} r={3.5} stroke={COLORS.outline} strokeWidth={0.4} fill="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const r1 = (a * Math.PI) / 180;
        return <line key={`gt-${i}`} x1={268 + 6.5 * Math.cos(r1)} y1={105 + 6.5 * Math.sin(r1)} x2={268 + 8.5 * Math.cos(r1)} y2={105 + 8.5 * Math.sin(r1)} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />;
      })}
      <circle cx={279} cy={112} r={4.5} stroke={COLORS.outline} strokeWidth={0.4} fill="none" />
      <circle cx={279} cy={112} r={2} stroke={COLORS.outline} strokeWidth={0.3} fill="none" />

      {/* === Worker figure 1 (near conveyor) === */}
      <g>
        <circle cx={55} cy={107} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <path d="M52,105 L58,105 L55,102 Z" fill={COLORS.neonGreen} opacity={0.7} />
        <rect x={52.5} y={110} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={53.5} y1={119} x2={52} y2={126} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={56.5} y1={119} x2={58} y2={126} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Worker figure 2 (at factory door) === */}
      <g>
        <circle cx={160} cy={102} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <path d="M157,100 L163,100 L160,97 Z" fill={COLORS.neonGreen} opacity={0.7} />
        <rect x={157.5} y={105} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={158.5} y1={114} x2={157} y2={121} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={161.5} y1={114} x2={163} y2={121} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Plants at building base === */}
      <path d="M80 122 C80 113 76 108 73 111" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={72} cy={110} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 72 110)" />
      <path d="M80 122 C80 114 84 109 87 112" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={88} cy={111} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 88 111)" />
      <path d="M248 108 C248 100 244 96 241 99" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={240} cy={98} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-25 240 98)" />
      <path d="M248 108 C248 101 252 97 255 100" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={256} cy={99} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(25 256 99)" />

      {/* === Floating hexagons === */}
      <polygon points="32,22 28.5,16 21.5,16 18,22 21.5,28 28.5,28" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="291,14 288,8.8 282,8.8 279,14 282,19.2 288,19.2" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.15} />
      <polygon points="303,88 300.5,83.7 295.5,83.7 293,88 295.5,92.3 300.5,92.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={12} cy={15} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={308} cy={10} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={8} cy={147} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={312} cy={150} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={160} cy={3} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={40} cy={50} r={0.9} fill={COLORS.teal} opacity={0.3} />
      <circle cx={275} cy={35} r={1.1} fill={COLORS.teal} opacity={0.25} />
      <circle cx={200} cy={8} r={0.8} fill={COLORS.neonGreen} opacity={0.35} />

      {/* === Thin connecting lines === */}
      <line x1={25} y1={25} x2={85} y2={55} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={245} y1={48} x2={284} y2={17} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={275} y1={90} x2={296} y2={90} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   ExporterIllustration – Global shipping scene
   ────────────────────────────────────────────────────────────── */
export function ExporterIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric ground platform === */}
      <polygon points="25,132 160,152 295,132 160,112" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <line x1={60} y1={122} x2={195} y2={142} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={118} x2={230} y2={138} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={128} y1={114} x2={263} y2={134} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={142} x2={230} y2={122} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />

      {/* === Globe wireframe === */}
      <circle cx={68} cy={62} r={32} stroke={COLORS.brightGreen} strokeWidth={0.7} fill="none" />
      <ellipse cx={68} cy={62} rx={32} ry={11} stroke={COLORS.brightGreen} strokeWidth={0.4} strokeDasharray="3 3" fill="none" opacity={0.5} />
      <ellipse cx={68} cy={62} rx={11} ry={32} stroke={COLORS.brightGreen} strokeWidth={0.4} strokeDasharray="3 3" fill="none" opacity={0.5} />
      <ellipse cx={68} cy={48} rx={25} ry={5} stroke={COLORS.brightGreen} strokeWidth={0.25} strokeDasharray="2 3" fill="none" opacity={0.3} />
      <ellipse cx={68} cy={76} rx={25} ry={5} stroke={COLORS.brightGreen} strokeWidth={0.25} strokeDasharray="2 3" fill="none" opacity={0.3} />
      {/* Continent dots */}
      <circle cx={55} cy={55} r={2.5} fill={COLORS.neonGreen} opacity={0.35} />
      <circle cx={78} cy={50} r={2} fill={COLORS.teal} opacity={0.3} />
      <circle cx={62} cy={72} r={1.8} fill={COLORS.neonGreen} opacity={0.25} />

      {/* === Shipping route arc === */}
      <path d="M100 58 C130 20 180 18 220 55" stroke={COLORS.neonGreen} strokeWidth={0.7} strokeDasharray="4 3" fill="none" opacity={0.5} />
      <polygon points="218,52 224,55 218,58" fill={COLORS.neonGreen} opacity={0.4} />

      {/* === Cargo ship silhouette (isometric) === */}
      <path d="M150 85 L155 72 L235 72 L240 85 Z" stroke={COLORS.outline} strokeWidth={0.7} fill={COLORS.darkGreen2} strokeLinejoin="round" />
      <path d="M145 85 L155 95 L240 95 L245 85 Z" stroke={COLORS.outline} strokeWidth={0.6} fill={COLORS.midGreen} strokeLinejoin="round" />
      {/* Hull waterline */}
      <line x1={150} y1={88} x2={240} y2={88} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.3} />
      {/* Deck structures */}
      <rect x={170} y={64} width={20} height={8} rx={1} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.darkGreen2} />
      <rect x={175} y={58} width={10} height={6} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.midGreen} />
      {/* Mast */}
      <line x1={180} y1={58} x2={180} y2={48} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
      {/* Container stacks on deck */}
      <rect x={198} y={63} width={10} height={9} rx={0.5} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}12`} />
      <rect x={210} y={63} width={10} height={9} rx={0.5} stroke={COLORS.teal} strokeWidth={0.4} fill={`${COLORS.teal}12`} />
      <rect x={198} y={54} width={10} height={9} rx={0.5} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} />

      {/* === Isometric container boxes on platform === */}
      <polygon points="260,100 260,115 275,120 275,105" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.5} strokeLinejoin="round" />
      <polygon points="260,100 275,105 290,100 275,95" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.5} strokeLinejoin="round" />
      <polygon points="275,105 290,100 290,115 275,120" fill={`${COLORS.brandGreen}80`} stroke={COLORS.outline} strokeWidth={0.5} strokeLinejoin="round" />
      {/* Second container */}
      <polygon points="256,90 256,100 268,104 268,94" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.4} strokeLinejoin="round" />
      <polygon points="256,90 268,94 280,90 268,86" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.4} strokeLinejoin="round" />
      <polygon points="268,94 280,90 280,100 268,104" fill={`${COLORS.brandGreen}80`} stroke={COLORS.outline} strokeWidth={0.4} strokeLinejoin="round" />

      {/* === Map pins === */}
      <g>
        <path d="M48 90 C48 84 56 84 56 90 C56 96 52 102 52 102 C52 102 48 96 48 90 Z" stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}20`} />
        <circle cx={52} cy={90} r={1.5} fill={COLORS.neonGreen} opacity={0.6} />
      </g>
      <g>
        <path d="M118 38 C118 32 126 32 126 38 C126 44 122 50 122 50 C122 50 118 44 118 38 Z" stroke={COLORS.teal} strokeWidth={0.5} fill={`${COLORS.teal}20`} />
        <circle cx={122} cy={38} r={1.5} fill={COLORS.teal} opacity={0.6} />
      </g>

      {/* === Figure 1 – at ship === */}
      <g>
        <circle cx={148} cy={104} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={145.5} y={107} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={146.5} y1={116} x2={145} y2={123} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={149.5} y1={116} x2={151} y2={123} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Figure 2 – at desk with monitor === */}
      <g>
        {/* Desk */}
        <rect x={100} y={118} width={22} height={12} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />
        {/* Monitor */}
        <rect x={104} y={108} width={14} height={10} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}12`} />
        <line x1={111} y1={118} x2={111} y2={120} stroke={COLORS.outline} strokeWidth={0.3} />
        {/* Figure */}
        <circle cx={128} cy={107} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={125.5} y={110} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={126.5} y1={119} x2={125} y2={126} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={129.5} y1={119} x2={131} y2={126} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Plant elements === */}
      <path d="M290 125 C290 117 286 113 283 116" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={282} cy={115} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 282 115)" />
      <path d="M290 125 C290 118 294 114 297 117" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={298} cy={116} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 298 116)" />
      <path d="M35 118 C35 110 31 107 28 110" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={27} cy={109} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-25 27 109)" />

      {/* === Floating hexagons === */}
      <polygon points="18,28 14.5,22 7.5,22 4,28 7.5,34 14.5,34" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="305,42 301.5,36.8 295.5,36.8 292,42 295.5,47.2 301.5,47.2" stroke={COLORS.neonGreen} strokeWidth={0.35} fill="none" opacity={0.15} />
      <polygon points="158,8 155.5,3.7 150.5,3.7 148,8 150.5,12.3 155.5,12.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={10} cy={12} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={310} cy={8} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={6} cy={148} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={314} cy={150} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={200} cy={4} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={88} cy={15} r={0.9} fill={COLORS.teal} opacity={0.3} />
      <circle cx={250} cy={30} r={1.1} fill={COLORS.teal} opacity={0.25} />

      {/* === Thin connecting lines === */}
      <line x1={12} y1={30} x2={40} y2={55} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={245} y1={85} x2={260} y2={97} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={300} y1={45} x2={290} y2={85} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   OEMIllustration – EV assembly scene
   ────────────────────────────────────────────────────────────── */
export function OEMIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric platform with circuit pattern === */}
      <polygon points="20,128 160,150 300,128 160,106" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      {/* Circuit-board grid lines */}
      <line x1={60} y1={117} x2={195} y2={139} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="1 4" opacity={0.1} />
      <line x1={100} y1={113} x2={235} y2={135} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="1 4" opacity={0.1} />
      <line x1={140} y1={109} x2={275} y2={131} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="1 4" opacity={0.1} />
      <line x1={80} y1={140} x2={215} y2={118} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="1 4" opacity={0.1} />
      <line x1={120} y1={144} x2={255} y2={122} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="1 4" opacity={0.1} />
      {/* Circuit trace accents */}
      <path d="M70 132 L90 125 L90 120 L110 120" stroke={COLORS.neonGreen} strokeWidth={0.25} opacity={0.15} strokeLinecap="round" />
      <circle cx={110} cy={120} r={1} fill={COLORS.neonGreen} opacity={0.2} />
      <path d="M230 122 L240 125 L250 118" stroke={COLORS.neonGreen} strokeWidth={0.25} opacity={0.15} strokeLinecap="round" />
      <circle cx={250} cy={118} r={1} fill={COLORS.neonGreen} opacity={0.2} />

      {/* === Electric vehicle silhouette === */}
      <path d="M75 98 L95 72 L115 62 L210 62 L235 72 L248 98" stroke={COLORS.brightGreen} strokeWidth={0.8} fill={`${COLORS.brightGreen}08`} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={68} y1={98} x2={255} y2={98} stroke={COLORS.brightGreen} strokeWidth={0.8} strokeLinecap="round" />
      {/* Windshield */}
      <path d="M100 70 L115 64 L160 64 L160 93 L93 93 Z" stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.brightGreen}06`} strokeLinejoin="round" />
      {/* Side window */}
      <path d="M165 64 L205 64 L215 72 L215 93 L165 93 Z" stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.brightGreen}06`} strokeLinejoin="round" />
      {/* Wheels */}
      <circle cx={108} cy={102} r={10} stroke={COLORS.outline} strokeWidth={0.7} fill={COLORS.darkGreen2} />
      <circle cx={108} cy={102} r={5} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} />
      <circle cx={215} cy={102} r={10} stroke={COLORS.outline} strokeWidth={0.7} fill={COLORS.darkGreen2} />
      <circle cx={215} cy={102} r={5} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} />
      {/* Headlight */}
      <ellipse cx={245} cy={92} rx={4} ry={3} fill={COLORS.neonGreen} opacity={0.2} />
      {/* Tail light */}
      <ellipse cx={78} cy={92} rx={3} ry={2} fill={COLORS.teal} opacity={0.2} />

      {/* === Battery pack module being integrated === */}
      <rect x={120} y={112} width={80} height={16} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}10`} />
      {/* Cells inside battery pack */}
      {[126, 140, 154, 168, 182].map((x, i) => (
        <rect key={`cell-${i}`} x={x} y={115} width={10} height={10} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.35} fill={`${COLORS.neonGreen}08`} />
      ))}
      {/* Integration arrow (moving up into vehicle) */}
      <line x1={160} y1={112} x2={160} y2={102} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
      <polygon points="157,103 160,98 163,103" fill={COLORS.neonGreen} opacity={0.3} />

      {/* === Assembly arm / crane === */}
      <line x1={40} y1={30} x2={40} y2={105} stroke={COLORS.outline} strokeWidth={0.7} strokeLinecap="round" />
      <line x1={40} y1={30} x2={120} y2={30} stroke={COLORS.outline} strokeWidth={0.7} strokeLinecap="round" />
      <line x1={120} y1={30} x2={120} y2={55} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
      {/* Crane hook */}
      <circle cx={120} cy={55} r={2.5} stroke={COLORS.brightGreen} strokeWidth={0.5} fill="none" />
      <path d="M118 57 C118 61 122 61 122 57" stroke={COLORS.brightGreen} strokeWidth={0.4} fill="none" strokeLinecap="round" />
      {/* Crane base */}
      <rect x={34} y={103} width={12} height={6} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />

      {/* === Dashboard display === */}
      <rect x={262} y={42} width={40} height={28} rx={2} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.darkGreen2} />
      <rect x={266} y={46} width={32} height={18} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brightGreen}10`} />
      {/* Spec lines */}
      <line x1={270} y1={50} x2={290} y2={50} stroke={COLORS.neonGreen} strokeWidth={0.3} opacity={0.5} />
      <line x1={270} y1={54} x2={285} y2={54} stroke={COLORS.neonGreen} strokeWidth={0.3} opacity={0.4} />
      <line x1={270} y1={58} x2={292} y2={58} stroke={COLORS.neonGreen} strokeWidth={0.3} opacity={0.35} />
      {/* Dashboard stand */}
      <line x1={282} y1={70} x2={282} y2={80} stroke={COLORS.outline} strokeWidth={0.4} />
      <line x1={275} y1={80} x2={289} y2={80} stroke={COLORS.outline} strokeWidth={0.4} strokeLinecap="round" />

      {/* === Charging bolt symbol === */}
      <path d="M55 55 L50 65 L56 65 L52 76" stroke={COLORS.neonGreen} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* === Figure 1 – engineer with tablet === */}
      <g>
        <circle cx={270} cy={90} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={267.5} y={93} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={268.5} y1={102} x2={267} y2={109} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={271.5} y1={102} x2={273} y2={109} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Tablet */}
        <rect x={274} y={95} width={6} height={8} rx={0.5} stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brightGreen}15`} />
      </g>

      {/* === Figure 2 – worker near vehicle === */}
      <g>
        <circle cx={70} cy={88} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={67.5} y={91} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={68.5} y1={100} x2={67} y2={107} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={71.5} y1={100} x2={73} y2={107} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Plant elements === */}
      <path d="M295 118 C295 110 291 106 288 109" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={287} cy={108} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 287 108)" />
      <path d="M295 118 C295 111 299 107 302 110" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={303} cy={109} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 303 109)" />
      <path d="M25 118 C25 111 21 108 18 111" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={17} cy={110} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-20 17 110)" />

      {/* === Floating hexagons === */}
      <polygon points="15,22 11.5,16 4.5,16 1,22 4.5,28 11.5,28" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="310,18 306.5,12.8 300.5,12.8 297,18 300.5,23.2 306.5,23.2" stroke={COLORS.neonGreen} strokeWidth={0.35} fill="none" opacity={0.15} />
      <polygon points="308,105 305.5,100.7 300.5,100.7 298,105 300.5,109.3 305.5,109.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={10} cy={10} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={312} cy={6} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={6} cy={148} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={315} cy={152} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={160} cy={3} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={180} cy={8} r={0.9} fill={COLORS.teal} opacity={0.35} />
      <circle cx={48} cy={18} r={1.1} fill={COLORS.teal} opacity={0.25} />

      {/* === Thin connecting lines === */}
      <line x1={8} y1={25} x2={35} y2={30} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={302} y1={42} x2={312} y2={20} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={248} y1={98} x2={265} y2={90} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   RecyclerIllustration – Circular economy scene
   ────────────────────────────────────────────────────────────── */
export function RecyclerIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric ground platform === */}
      <polygon points="20,130 160,152 300,130 160,108" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <line x1={55} y1={119} x2={195} y2={141} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={90} y1={115} x2={230} y2={137} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={125} y1={111} x2={265} y2={133} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={90} y1={142} x2={230} y2={120} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />

      {/* === Recycling arrows loop (3 curved arrows) === */}
      <circle cx={160} cy={68} r={38} stroke={COLORS.outline} strokeWidth={0.3} fill="none" opacity={0.08} />
      {/* Arrow 1 – top-right */}
      <path d="M160 32 C185 32 208 48 208 68" stroke={COLORS.neonGreen} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <polygon points="208,62 214,70 202,70" fill={COLORS.neonGreen} opacity={0.5} />
      {/* Arrow 2 – bottom */}
      <path d="M204 78 C198 102 178 115 158 110" stroke={COLORS.neonGreen} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <polygon points="164,110 157,116 155,104" fill={COLORS.neonGreen} opacity={0.5} />
      {/* Arrow 3 – left */}
      <path d="M150 106 C132 100 114 86 114 66" stroke={COLORS.neonGreen} strokeWidth={1.2} strokeLinecap="round" fill="none" />
      <polygon points="114,72 108,64 120,64" fill={COLORS.neonGreen} opacity={0.5} />

      {/* === Broken battery going in (left side) === */}
      <g opacity={0.6}>
        <rect x={86} y={55} width={16} height={22} rx={2} stroke={COLORS.outline} strokeWidth={0.6} fill={`${COLORS.outline}15`} />
        <rect x={91} y={52} width={6} height={4} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill="none" />
        {/* Crack line */}
        <path d="M90 60 L96 66 L92 72" stroke={COLORS.teal} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={0.6} />
        {/* X mark */}
        <line x1={88} y1={58} x2={100} y2={74} stroke={COLORS.teal} strokeWidth={0.3} opacity={0.3} />
        <line x1={100} y1={58} x2={88} y2={74} stroke={COLORS.teal} strokeWidth={0.3} opacity={0.3} />
      </g>

      {/* === New materials coming out (right side) === */}
      <g opacity={0.6}>
        <circle cx={222} cy={60} r={4} fill={COLORS.neonGreen} opacity={0.25} />
        <circle cx={230} cy={55} r={3} fill={COLORS.brightGreen} opacity={0.2} />
        <circle cx={226} cy={68} r={3.5} fill={COLORS.teal} opacity={0.2} />
        <rect x={218} y={72} width={8} height={5} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}15`} />
        <rect x={228} y={70} width={8} height={5} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}12`} />
      </g>

      {/* === Plant / tree growing from recycled materials === */}
      <g>
        <line x1={240} y1={80} x2={240} y2={50} stroke={COLORS.lightGreen} strokeWidth={0.7} strokeLinecap="round" />
        <path d="M240 50 C240 42 234 38 231 42" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={230} cy={41} rx={4} ry={2} fill={COLORS.lightGreen} opacity={0.5} transform="rotate(-30 230 41)" />
        <path d="M240 55 C240 48 246 44 249 47" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={250} cy={46} rx={4} ry={2} fill={COLORS.lightGreen} opacity={0.5} transform="rotate(30 250 46)" />
        <path d="M240 62 C240 56 235 53 232 56" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={231} cy={55} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-25 231 55)" />
        {/* Small root at base */}
        <path d="M240 80 C238 84 235 84 234 82" stroke={COLORS.lightGreen} strokeWidth={0.4} fill="none" strokeLinecap="round" opacity={0.4} />
      </g>

      {/* === Processing machine (isometric box with gears) === */}
      <polygon points="40,90 40,118 70,125 70,97" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <polygon points="40,90 70,97 90,88 60,81" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <polygon points="70,97 90,88 90,116 70,125" fill={`${COLORS.brandGreen}80`} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      {/* Machine intake */}
      <rect x={44} y={96} width={10} height={8} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} />
      {/* Machine output */}
      <rect x={74} y={100} width={10} height={8} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}10`} />
      {/* Gear on machine */}
      <circle cx={65} cy={85} r={5} stroke={COLORS.outline} strokeWidth={0.4} fill="none" />
      <circle cx={65} cy={85} r={2.5} stroke={COLORS.outline} strokeWidth={0.3} fill="none" />
      {[0, 60, 120, 180, 240, 300].map((a, i) => {
        const r1 = (a * Math.PI) / 180;
        return <line key={`mg-${i}`} x1={65 + 4.5 * Math.cos(r1)} y1={85 + 4.5 * Math.sin(r1)} x2={65 + 6.5 * Math.cos(r1)} y2={85 + 6.5 * Math.sin(r1)} stroke={COLORS.outline} strokeWidth={0.4} strokeLinecap="round" />;
      })}

      {/* === Figure 1 – feeding materials === */}
      <g>
        <circle cx={50} cy={75} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={47.5} y={78} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={48.5} y1={87} x2={47} y2={94} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={51.5} y1={87} x2={53} y2={94} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Arm extending toward machine */}
        <line x1={52} y1={81} x2={58} y2={84} stroke={COLORS.figureLight} strokeWidth={0.6} strokeLinecap="round" />
      </g>

      {/* === Figure 2 – collecting output === */}
      <g>
        <circle cx={260} cy={88} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={257.5} y={91} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={258.5} y1={100} x2={257} y2={107} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={261.5} y1={100} x2={263} y2={107} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Extra leaf elements === */}
      <path d="M280 120 C280 112 276 108 273 111" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={272} cy={110} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 272 110)" />
      <path d="M280 120 C280 113 284 109 287 112" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={288} cy={111} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 288 111)" />
      <path d="M30 120 C30 114 26 111 23 114" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={22} cy={113} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-20 22 113)" />

      {/* === Floating hexagons === */}
      <polygon points="18,20 14.5,14 7.5,14 4,20 7.5,26 14.5,26" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="305,15 301.5,9.8 295.5,9.8 292,15 295.5,20.2 301.5,20.2" stroke={COLORS.neonGreen} strokeWidth={0.35} fill="none" opacity={0.15} />
      <polygon points="290,102 287.5,97.7 282.5,97.7 280,102 282.5,106.3 287.5,106.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={10} cy={10} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={312} cy={8} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={6} cy={150} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={314} cy={152} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={160} cy={3} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={200} cy={10} r={0.9} fill={COLORS.teal} opacity={0.35} />
      <circle cx={120} cy={6} r={1.1} fill={COLORS.teal} opacity={0.25} />
      <circle cx={55} cy={40} r={0.8} fill={COLORS.neonGreen} opacity={0.3} />

      {/* === Thin connecting lines === */}
      <line x1={10} y1={22} x2={40} y2={55} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={300} y1={18} x2={270} y2={45} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={285} y1={104} x2={265} y2={90} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}
