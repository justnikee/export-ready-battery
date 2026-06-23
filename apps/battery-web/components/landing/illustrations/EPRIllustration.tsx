const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function EPRIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Isometric ground plane */}
      <polygon points="200,210 395,185 200,160 5,185" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.5} />
      <g opacity={0.08}>
        {[0,1,2,3,4,5,6,7].map(i => (
          <line key={`gg-${i}`} x1={30+i*25} y1={185+i*0.5} x2={200+(i-4)*25} y2={210-i*1} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        ))}
      </g>

      {/* Large recycling triangle loop - center */}
      <g>
        {/* Outer glow ring */}
        <circle cx={200} cy={100} r={62} stroke={COLORS.neonGreen} strokeWidth={0.4} opacity={0.15} />
        {/* Arrow 1: top → right */}
        <path d="M200 48 C240 48 268 72 268 100" stroke={COLORS.neonGreen} strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <polygon points="268,93 275,102 261,102" fill={COLORS.neonGreen} opacity={0.5} />
        {/* Arrow 2: right → bottom-left */}
        <path d="M262 110 C256 145 232 162 200 158" stroke={COLORS.brightGreen} strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <polygon points="207,158 200,166 198,152" fill={COLORS.brightGreen} opacity={0.5} />
        {/* Arrow 3: bottom-left → top */}
        <path d="M192 153 C160 148 138 122 140 92" stroke={COLORS.teal} strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <polygon points="140,99 133,89 147,89" fill={COLORS.teal} opacity={0.5} />
        {/* Inner dashed ring */}
        <circle cx={200} cy={100} r={32} stroke={COLORS.outline} strokeWidth={0.5} strokeDasharray="2 3" opacity={0.3} />

        {/* Lifecycle icons along the loop */}
        {/* Manufacture icon (top) */}
        <rect x={192} y={38} width={16} height={10} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}12`} />
        <path d="M195 43 L198 40 L201 43 L204 40" stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" />
        {/* Use icon (right) */}
        <circle cx={272} cy={100} r={7} stroke={COLORS.brightGreen} strokeWidth={0.5} fill={`${COLORS.brightGreen}10`} />
        <path d="M270 98 L275 100 L270 102" fill={COLORS.brightGreen} opacity={0.5} />
        {/* Collection icon (bottom) */}
        <path d="M193 162 L190 172 L210 172 L207 162" stroke={COLORS.teal} strokeWidth={0.5} fill={`${COLORS.teal}10`} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={188} y1={162} x2={212} y2={162} stroke={COLORS.teal} strokeWidth={0.5} strokeLinecap="round" />
        {/* Recycle icon (left) */}
        <path d="M128 95 L132 90 L136 95 M132 90 L132 100" stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Center battery icon */}
        <rect x={192} y={89} width={16} height={24} rx={3} stroke={COLORS.neonGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}80`} />
        <rect x={197} y={86} width={6} height={4} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.5} />
        <rect x={195} y={101} width={10} height={3} rx={0.5} fill={COLORS.brightGreen} opacity={0.3} />
        <rect x={195} y={105} width={10} height={3} rx={0.5} fill={COLORS.neonGreen} opacity={0.35} />
      </g>

      {/* Collection bin / drop-off point - left */}
      <g>
        {/* Isometric platform */}
        <polygon points="40,170 90,164 90,160 40,166" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Bin body */}
        <path d="M50 160 L47 142 L83 138 L80 156" stroke={COLORS.brightGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={45} y1={142} x2={85} y2={138} stroke={COLORS.brightGreen} strokeWidth={0.7} strokeLinecap="round" />
        {/* Recycle symbol on bin */}
        <path d="M60 146 L63 143 L66 146" stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M66 146 L68 150 L65 152" stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M65 152 L61 150 L60 146" stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" />
        {/* Batteries in bin */}
        <rect x={55} y={148} width={4} height={7} rx={1} stroke={COLORS.teal} strokeWidth={0.3} opacity={0.5} />
        <rect x={62} y={147} width={4} height={7} rx={1} stroke={COLORS.teal} strokeWidth={0.3} opacity={0.4} />
      </g>

      {/* Monitoring dashboard - right */}
      <g>
        {/* Monitor stand */}
        <line x1={330} y1={145} x2={330} y2={155} stroke={COLORS.outline} strokeWidth={0.6} strokeLinecap="round" />
        <line x1={320} y1={155} x2={340} y2={155} stroke={COLORS.outline} strokeWidth={0.6} strokeLinecap="round" />
        {/* Monitor frame */}
        <rect x={298} y={100} width={64} height={45} rx={3} stroke={COLORS.neonGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}90`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={302} y={104} width={56} height={37} rx={2} stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.darkGreen1}80`} />
        {/* Bar chart */}
        <rect x={308} y={128} width={6} height={10} rx={0.5} fill={COLORS.brightGreen} opacity={0.4} />
        <rect x={317} y={122} width={6} height={16} rx={0.5} fill={COLORS.neonGreen} opacity={0.4} />
        <rect x={326} y={125} width={6} height={13} rx={0.5} fill={COLORS.teal} opacity={0.4} />
        <rect x={335} y={118} width={6} height={20} rx={0.5} fill={COLORS.brightGreen} opacity={0.5} />
        <rect x={344} y={130} width={6} height={8} rx={0.5} fill={COLORS.neonGreen} opacity={0.35} />
        {/* Chart axis */}
        <line x1={305} y1={138} x2={355} y2={138} stroke={COLORS.outline} strokeWidth={0.3} strokeLinecap="round" />
        <line x1={305} y1={110} x2={305} y2={138} stroke={COLORS.outline} strokeWidth={0.3} strokeLinecap="round" />
        {/* Line chart on top */}
        <polyline points="308,112 317,108 326,114 335,107 344,110" stroke={COLORS.neonGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {[308,317,326,335,344].map((x,i) => (
          <circle key={`cd-${i}`} cx={x} cy={[112,108,114,107,110][i]} r={1} fill={COLORS.neonGreen} opacity={0.6} />
        ))}
      </g>

      {/* Calendar/clock - top right */}
      <g>
        <rect x={340} y={50} width={40} height={38} rx={3} stroke={COLORS.outline} strokeWidth={0.6} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={340} y={50} width={40} height={10} rx={3} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.midGreen}60`} />
        <line x1={352} y1={47} x2={352} y2={53} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={368} y1={47} x2={368} y2={53} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        {/* Calendar grid dots */}
        {[0,1,2,3].map(c => [0,1,2].map(r => (
          <circle key={`cg-${c}-${r}`} cx={348+c*8} cy={66+r*7} r={1.2} fill={c===2 && r===1 ? COLORS.neonGreen : COLORS.outline} opacity={c===2 && r===1 ? 0.7 : 0.3} />
        )))}
      </g>

      {/* Figure 1: at collection point */}
      <g>
        <circle cx={38} cy={120} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={35.5} y={124} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={36.5} y1={133} x2={35} y2={142} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={39.5} y1={133} x2={41} y2={142} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Arm holding battery */}
        <line x1={40.5} y1={126} x2={48} y2={130} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
        <rect x={47} y={128} width={4} height={6} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.3} fill={`${COLORS.neonGreen}15`} />
      </g>

      {/* Figure 2: at monitoring station */}
      <g>
        <circle cx={288} cy={120} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={285.5} y={124} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={286.5} y1={133} x2={285} y2={142} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={289.5} y1={133} x2={291} y2={142} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={290.5} y1={126} x2={298} y2={120} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Nature elements - trees/leaves */}
      <g>
        {/* Tree 1 - growing from recycled area */}
        <line x1={110} y1={175} x2={110} y2={150} stroke={COLORS.lightGreen} strokeWidth={0.6} strokeLinecap="round" />
        <ellipse cx={110} cy={145} rx={8} ry={10} fill={COLORS.lightGreen} opacity={0.2} />
        <ellipse cx={105} cy={150} rx={5} ry={7} fill={COLORS.lightGreen} opacity={0.15} />
        {/* Leaf 1 */}
        <path d="M15 40 Q10 28 20 22" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={22} cy={20} rx={4} ry={2.5} fill={COLORS.lightGreen} opacity={0.3} transform="rotate(-30 22 20)" />
        {/* Leaf 2 */}
        <path d="M380 175 Q378 162 384 155" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={386} cy={153} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(-15 386 153)" />
        {/* Leaf 3 */}
        <path d="M15 190 Q20 180 25 175" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={27} cy={173} rx={3} ry={2} fill={COLORS.lightGreen} opacity={0.2} transform="rotate(10 27 173)" />
      </g>

      {/* Floating hexagons */}
      {[
        { x: 30, y: 55, s: 9 }, { x: 380, y: 35, s: 8 }, { x: 150, y: 12, s: 7 },
        { x: 260, y: 18, s: 10 }, { x: 90, y: 200, s: 6 },
      ].map((h, i) => {
        const pts = Array.from({ length: 6 }).map((_, j) => {
          const angle = (Math.PI / 3) * j - Math.PI / 6;
          return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={`hex-${i}`} points={pts} stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.15 + (i % 2) * 0.05} />;
      })}

      {/* Scattered particles */}
      {[
        { x: 10, y: 15 }, { x: 80, y: 8 }, { x: 170, y: 5 }, { x: 250, y: 10 },
        { x: 330, y: 8 }, { x: 395, y: 50 }, { x: 5, y: 110 }, { x: 395, y: 120 },
        { x: 50, y: 210 }, { x: 200, y: 215 }, { x: 350, y: 205 }, { x: 280, y: 210 },
      ].map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 1.5 : 1} fill={COLORS.neonGreen} opacity={0.2 + (i % 4) * 0.05} />
      ))}

      {/* Connecting lines */}
      <g opacity={0.1}>
        <line x1={88} y1={150} x2={140} y2={100} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={260} y1={100} x2={298} y2={110} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <path d="M200 158 Q200 165 200 175" stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}
