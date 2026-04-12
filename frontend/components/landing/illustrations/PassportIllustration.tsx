const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function PassportIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Isometric ground plane */}
      <polygon points="200,170 390,150 200,130 10,150" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.5} />
      <g opacity={0.08}>
        {[0,1,2,3,4,5,6].map(i => (
          <line key={`gl-${i}`} x1={40+i*26} y1={150-i*1} x2={200+(i-3)*26} y2={170-i*1.5} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        ))}
      </g>

      {/* Central passport/ID card */}
      <g>
        {/* Shadow */}
        <ellipse cx={200} cy={132} rx={55} ry={6} fill={COLORS.darkGreen1} opacity={0.3} />
        {/* Card body */}
        <rect x={145} y={30} width={110} height={85} rx={6} stroke={COLORS.neonGreen} strokeWidth={0.9} fill={`${COLORS.darkGreen2}90`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={150} y={35} width={100} height={75} rx={4} stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.darkGreen1}60`} />
        {/* Photo placeholder */}
        <rect x={158} y={43} width={18} height={22} rx={2} stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.midGreen}40`} />
        <circle cx={167} cy={50} r={4} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.4} />
        <path d="M160 63 Q167 58 174 63" stroke={COLORS.outline} strokeWidth={0.3} opacity={0.3} />
        {/* Chip pattern */}
        <rect x={158} y={72} width={14} height={10} rx={2} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}10`} />
        <line x1={162} y1={72} x2={162} y2={82} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        <line x1={167} y1={72} x2={167} y2={82} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        <line x1={158} y1={77} x2={172} y2={77} stroke={COLORS.neonGreen} strokeWidth={0.3} />
        {/* Data lines */}
        <line x1={182} y1={46} x2={242} y2={46} stroke={COLORS.brightGreen} strokeWidth={0.4} strokeLinecap="round" opacity={0.4} />
        <line x1={182} y1={51} x2={235} y2={51} stroke={COLORS.brightGreen} strokeWidth={0.35} strokeLinecap="round" opacity={0.35} />
        <line x1={182} y1={56} x2={240} y2={56} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.3} />
        <line x1={182} y1={61} x2={225} y2={61} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.25} />
        {/* QR code grid on card */}
        <g opacity={0.5}>
          {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
            const filled = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2) || (r + c) % 3 === 0;
            return filled ? (
              <rect key={`qr-${r}-${c}`} x={210 + c * 4.5} y={68 + r * 4.5} width={3.5} height={3.5} rx={0.3} fill={COLORS.teal} opacity={0.45} />
            ) : null;
          }))}
        </g>
        {/* Bottom data line */}
        <line x1={158} y1={90} x2={242} y2={90} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.2} />
        <line x1={158} y1={95} x2={230} y2={95} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.15} />
        <line x1={158} y1={100} x2={238} y2={100} stroke={COLORS.brightGreen} strokeWidth={0.25} strokeLinecap="round" opacity={0.15} />
      </g>

      {/* Battery icon linked to passport - left */}
      <g>
        <rect x={55} y={55} width={22} height={35} rx={4} stroke={COLORS.neonGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={61} y={51} width={10} height={5} rx={1.5} stroke={COLORS.neonGreen} strokeWidth={0.5} />
        {/* Charge bars */}
        <rect x={59} y={76} width={14} height={4} rx={0.5} fill={COLORS.brightGreen} opacity={0.35} />
        <rect x={59} y={70} width={14} height={4} rx={0.5} fill={COLORS.neonGreen} opacity={0.3} />
        <rect x={59} y={64} width={14} height={4} rx={0.5} fill={COLORS.teal} opacity={0.2} />
        {/* Glowing connection line to passport */}
        <line x1={77} y1={72} x2={145} y2={72} stroke={COLORS.neonGreen} strokeWidth={0.6} strokeLinecap="round" opacity={0.5} />
        <line x1={77} y1={72} x2={145} y2={72} stroke={COLORS.neonGreen} strokeWidth={2} strokeLinecap="round" opacity={0.08} />
        {/* Data dots along connection */}
        <circle cx={95} cy={72} r={1.5} fill={COLORS.neonGreen} opacity={0.5} />
        <circle cx={110} cy={72} r={1.2} fill={COLORS.neonGreen} opacity={0.4} />
        <circle cx={125} cy={72} r={1} fill={COLORS.neonGreen} opacity={0.3} />
      </g>

      {/* Phone/scanner device - right */}
      <g>
        {/* Phone body */}
        <rect x={310} y={35} width={40} height={70} rx={5} stroke={COLORS.neonGreen} strokeWidth={0.7} fill={`${COLORS.darkGreen2}80`} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={314} y={43} width={32} height={52} rx={2} stroke={COLORS.outline} strokeWidth={0.4} fill={`${COLORS.darkGreen1}60`} />
        {/* Notch */}
        <line x1={324} y1={39} x2={336} y2={39} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" opacity={0.4} />
        {/* Home indicator */}
        <line x1={325} y1={100} x2={335} y2={100} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" opacity={0.3} />
        {/* Scan lines emanating */}
        <line x1={310} y1={55} x2={280} y2={50} stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeDasharray="3 2" opacity={0.4} />
        <line x1={310} y1={65} x2={275} y2={65} stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeDasharray="3 2" opacity={0.35} />
        <line x1={310} y1={75} x2={280} y2={80} stroke={COLORS.teal} strokeWidth={0.4} strokeLinecap="round" strokeDasharray="3 2" opacity={0.3} />
        {/* Mini QR on screen */}
        <rect x={320} y={50} width={20} height={20} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} opacity={0.5} />
        <rect x={322} y={52} width={6} height={6} rx={0.5} fill={COLORS.neonGreen} opacity={0.25} />
        <rect x={332} y={52} width={6} height={6} rx={0.5} fill={COLORS.neonGreen} opacity={0.25} />
        <rect x={322} y={62} width={6} height={6} rx={0.5} fill={COLORS.neonGreen} opacity={0.25} />
        {/* Scan status */}
        <line x1={318} y1={78} x2={342} y2={78} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.4} />
        <line x1={318} y1={82} x2={336} y2={82} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.3} />
        <line x1={318} y1={86} x2={340} y2={86} stroke={COLORS.brightGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.25} />
      </g>

      {/* Data stream flowing from passport */}
      <g opacity={0.35}>
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={`ds-${i}`} x={255 + i * 7} y={48 + (i % 3) * 3} width={4} height={2} rx={0.5} fill={COLORS.neonGreen} opacity={0.3 + (i % 3) * 0.1} />
        ))}
        {[0,1,2,3,4,5].map(i => (
          <rect key={`ds2-${i}`} x={260 + i * 8} y={88 - (i % 2) * 3} width={4} height={2} rx={0.5} fill={COLORS.teal} opacity={0.25 + (i % 3) * 0.08} />
        ))}
      </g>

      {/* Verification badge (shield + check) */}
      <g>
        <path d="M370 30 L380 25 L390 30 L390 42 Q380 50 370 42 Z" stroke={COLORS.neonGreen} strokeWidth={0.6} fill={`${COLORS.neonGreen}12`} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M376 36 L379 39 L385 33" stroke={COLORS.neonGreen} strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Figure 1: scanning with phone */}
      <g>
        <circle cx={335} cy={115} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={332.5} y={119} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={333.5} y1={128} x2={332} y2={137} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={336.5} y1={128} x2={338} y2={137} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={337.5} y1={121} x2={345} y2={115} stroke={COLORS.figureLight} strokeWidth={0.8} strokeLinecap="round" />
      </g>

      {/* Figure 2: viewing data on tablet */}
      <g>
        <circle cx={85} cy={105} r={3} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <rect x={82.5} y={109} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={1.2} fill="none" />
        <line x1={83.5} y1={118} x2={82} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={86.5} y1={118} x2={88} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Tablet in hand */}
        <rect x={90} y={109} width={12} height={8} rx={1} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}10`} />
        <line x1={92} y1={112} x2={100} y2={112} stroke={COLORS.neonGreen} strokeWidth={0.2} strokeLinecap="round" />
        <line x1={92} y1={114} x2={98} y2={114} stroke={COLORS.neonGreen} strokeWidth={0.2} strokeLinecap="round" />
      </g>

      {/* Plant elements */}
      <g>
        <path d="M20 152 Q17 138 24 128" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={26} cy={126} rx={4} ry={2.5} fill={COLORS.lightGreen} opacity={0.3} transform="rotate(-25 26 126)" />
        <path d="M20 152 Q25 142 32 137" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={34} cy={135} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(15 34 135)" />
      </g>
      <g>
        <path d="M390 155 Q387 142 393 135" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <ellipse cx={395} cy={133} rx={3.5} ry={2} fill={COLORS.lightGreen} opacity={0.25} transform="rotate(-10 395 133)" />
      </g>

      {/* Floating hexagons */}
      {[
        { x: 30, y: 22, s: 9 }, { x: 175, y: 10, s: 7 }, { x: 370, y: 55, s: 6 },
        { x: 120, y: 160, s: 8 }, { x: 290, y: 165, s: 7 },
      ].map((h, i) => {
        const pts = Array.from({ length: 6 }).map((_, j) => {
          const angle = (Math.PI / 3) * j - Math.PI / 6;
          return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={`hex-${i}`} points={pts} stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.15 + (i % 2) * 0.05} />;
      })}

      {/* Scattered particles */}
      {[
        { x: 12, y: 15 }, { x: 110, y: 8 }, { x: 230, y: 5 }, { x: 300, y: 12 },
        { x: 395, y: 22 }, { x: 5, y: 85 }, { x: 395, y: 90 }, { x: 45, y: 170 },
        { x: 160, y: 175 }, { x: 270, y: 170 }, { x: 350, y: 168 }, { x: 200, y: 175 },
      ].map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 1.5 : 1} fill={COLORS.neonGreen} opacity={0.2 + (i % 3) * 0.05} />
      ))}

      {/* Connecting lines */}
      <g opacity={0.1}>
        <line x1={77} y1={60} x2={145} y2={50} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={255} y1={72} x2={310} y2={70} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
      </g>
    </svg>
  );
}
