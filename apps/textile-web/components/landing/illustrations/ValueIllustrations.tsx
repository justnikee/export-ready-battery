const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

/* ──────────────────────────────────────────────────────────────
   IndiaComplianceIllustration – India regulatory scene
   ────────────────────────────────────────────────────────────── */
export function IndiaComplianceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric ground platform === */}
      <polygon points="25,132 160,152 295,132 160,112" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <line x1={60} y1={122} x2={195} y2={142} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={118} x2={230} y2={138} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={128} y1={114} x2={263} y2={134} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={142} x2={230} y2={122} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />

      {/* === Large shield / badge === */}
      <path d="M160 18 L210 38 L210 82 C210 108 186 126 160 134 C134 126 110 108 110 82 L110 38 Z"
        stroke={COLORS.brightGreen} strokeWidth={0.8} fill={`${COLORS.brightGreen}08`} strokeLinejoin="round" />
      <path d="M160 28 L200 44 L200 80 C200 100 182 114 160 120 C138 114 120 100 120 80 L120 44 Z"
        stroke={COLORS.brightGreen} strokeWidth={0.4} fill="none" opacity={0.25} strokeLinejoin="round" />

      {/* === Ashoka Chakra-inspired design (8-spoke wheel) === */}
      <circle cx={160} cy={72} r={18} stroke={COLORS.neonGreen} strokeWidth={0.6} fill="none" opacity={0.4} />
      <circle cx={160} cy={72} r={14} stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.25} />
      <circle cx={160} cy={72} r={3} fill={COLORS.neonGreen} opacity={0.3} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return <line key={`spoke-${i}`} x1={160 + 3 * Math.cos(rad)} y1={72 + 3 * Math.sin(rad)} x2={160 + 17 * Math.cos(rad)} y2={72 + 17 * Math.sin(rad)} stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" opacity={0.35} />;
      })}

      {/* === India flag-inspired stripe (subtle brandGreen + saffron hint) === */}
      <line x1={115} y1={48} x2={205} y2={48} stroke={COLORS.brandGreen} strokeWidth={1.5} opacity={0.2} strokeLinecap="round" />
      <line x1={115} y1={98} x2={205} y2={98} stroke={COLORS.neonGreen} strokeWidth={1.5} opacity={0.15} strokeLinecap="round" />

      {/* === Official stamp / seal === */}
      <circle cx={195} cy={108} r={10} stroke={COLORS.brightGreen} strokeWidth={0.6} fill={`${COLORS.brightGreen}10`} />
      <circle cx={195} cy={108} r={7} stroke={COLORS.brightGreen} strokeWidth={0.35} fill="none" opacity={0.4} />
      <path d="M191 108 L194 111 L200 105" stroke={COLORS.neonGreen} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* === Stack of compliance documents === */}
      <g>
        <rect x={230} y={58} width={38} height={48} rx={2} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.darkGreen2} />
        <rect x={233} y={55} width={38} height={48} rx={2} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.darkGreen2} />
        <rect x={236} y={52} width={38} height={48} rx={2} stroke={COLORS.outline} strokeWidth={0.6} fill={`${COLORS.midGreen}CC`} />
        {/* Document lines */}
        <line x1={242} y1={60} x2={268} y2={60} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.4} />
        <line x1={242} y1={65} x2={264} y2={65} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.35} />
        <line x1={242} y1={70} x2={266} y2={70} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.3} />
        <line x1={242} y1={75} x2={262} y2={75} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.25} />
        <line x1={242} y1={80} x2={265} y2={80} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.25} />
        <line x1={242} y1={85} x2={260} y2={85} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.2} />
        {/* Small seal on doc */}
        <circle cx={263} cy={93} r={4} stroke={COLORS.neonGreen} strokeWidth={0.35} fill={`${COLORS.neonGreen}10`} />
      </g>

      {/* === Government building silhouette (dome + pillars) === */}
      <g opacity={0.3}>
        {/* Dome */}
        <path d="M50 85 C50 65 80 50 80 50 C80 50 110 65 110 85" stroke={COLORS.outline} strokeWidth={0.5} fill="none" strokeLinecap="round" />
        <line x1={80} y1={50} x2={80} y2={44} stroke={COLORS.outline} strokeWidth={0.4} strokeLinecap="round" />
        <circle cx={80} cy={42} r={2} stroke={COLORS.outline} strokeWidth={0.3} fill="none" />
        {/* Base */}
        <line x1={45} y1={85} x2={115} y2={85} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        {/* Pillars */}
        <line x1={55} y1={85} x2={55} y2={72} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={68} y1={85} x2={68} y2={65} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={80} y1={85} x2={80} y2={62} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={92} y1={85} x2={92} y2={65} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={105} y1={85} x2={105} y2={72} stroke={COLORS.outline} strokeWidth={0.5} strokeLinecap="round" />
        {/* Steps */}
        <line x1={42} y1={88} x2={118} y2={88} stroke={COLORS.outline} strokeWidth={0.4} />
        <line x1={40} y1={91} x2={120} y2={91} stroke={COLORS.outline} strokeWidth={0.35} />
      </g>

      {/* === Filing cabinet === */}
      <g opacity={0.5}>
        <rect x={38} y={100} width={18} height={24} rx={1} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.darkGreen2} />
        <line x1={40} y1={108} x2={54} y2={108} stroke={COLORS.outline} strokeWidth={0.3} />
        <line x1={40} y1={116} x2={54} y2={116} stroke={COLORS.outline} strokeWidth={0.3} />
        <circle cx={47} cy={104} r={1} stroke={COLORS.brightGreen} strokeWidth={0.3} fill="none" />
        <circle cx={47} cy={112} r={1} stroke={COLORS.brightGreen} strokeWidth={0.3} fill="none" />
        <circle cx={47} cy={120} r={1} stroke={COLORS.brightGreen} strokeWidth={0.3} fill="none" />
      </g>

      {/* === Figure 1 – with document === */}
      <g>
        <circle cx={135} cy={105} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={132.5} y={108} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={133.5} y1={117} x2={132} y2={124} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={136.5} y1={117} x2={138} y2={124} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Holding document */}
        <rect x={139} y={109} width={5} height={7} rx={0.5} stroke={COLORS.brightGreen} strokeWidth={0.3} fill={`${COLORS.brightGreen}15`} />
      </g>

      {/* === Figure 2 – near documents === */}
      <g>
        <circle cx={225} cy={108} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={222.5} y={111} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={223.5} y1={120} x2={222} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={226.5} y1={120} x2={228} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Plant elements === */}
      <path d="M290 125 C290 117 286 113 283 116" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={282} cy={115} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 282 115)" />
      <path d="M290 125 C290 118 294 114 297 117" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={298} cy={116} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 298 116)" />
      <path d="M30 125 C30 119 26 116 23 119" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={22} cy={118} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-25 22 118)" />

      {/* === Floating hexagons === */}
      <polygon points="18,25 14.5,19 7.5,19 4,25 7.5,31 14.5,31" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="308,20 304.5,14.8 298.5,14.8 295,20 298.5,25.2 304.5,25.2" stroke={COLORS.neonGreen} strokeWidth={0.35} fill="none" opacity={0.15} />
      <polygon points="305,95 302.5,90.7 297.5,90.7 295,95 297.5,99.3 302.5,99.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={10} cy={14} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={312} cy={10} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={6} cy={148} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={314} cy={150} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={160} cy={3} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={80} cy={8} r={0.9} fill={COLORS.teal} opacity={0.3} />
      <circle cx={250} cy={35} r={1.1} fill={COLORS.teal} opacity={0.25} />

      {/* === Thin connecting lines === */}
      <line x1={12} y1={28} x2={50} y2={60} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={210} y1={82} x2={235} y2={60} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={300} y1={22} x2={275} y2={55} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   AuditReadyIllustration – Security / audit scene
   ────────────────────────────────────────────────────────────── */
export function AuditReadyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric ground platform === */}
      <polygon points="25,130 160,150 295,130 160,110" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <line x1={60} y1={120} x2={195} y2={140} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={116} x2={230} y2={136} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={128} y1={112} x2={263} y2={132} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={140} x2={230} y2={120} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />

      {/* === Large magnifying glass over document === */}
      {/* Document */}
      <rect x={120} y={35} width={60} height={78} rx={3} stroke={COLORS.outline} strokeWidth={0.6} fill={COLORS.darkGreen2} />
      {/* Document lines */}
      <line x1={130} y1={48} x2={170} y2={48} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.4} />
      <line x1={130} y1={55} x2={165} y2={55} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.35} />
      <line x1={130} y1={62} x2={168} y2={62} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.3} />
      <line x1={130} y1={69} x2={163} y2={69} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.28} />
      <line x1={130} y1={76} x2={166} y2={76} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.25} />
      <line x1={130} y1={83} x2={160} y2={83} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.22} />
      <line x1={130} y1={90} x2={164} y2={90} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.2} />
      <line x1={130} y1={97} x2={158} y2={97} stroke={COLORS.brightGreen} strokeWidth={0.3} opacity={0.18} />
      {/* Magnifying glass */}
      <circle cx={162} cy={58} r={22} stroke={COLORS.neonGreen} strokeWidth={0.8} fill={`${COLORS.neonGreen}06`} />
      <circle cx={162} cy={58} r={19} stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.3} />
      {/* Handle */}
      <line x1={177} y1={73} x2={198} y2={94} stroke={COLORS.neonGreen} strokeWidth={1.2} strokeLinecap="round" />
      {/* Magnified text inside lens */}
      <line x1={148} y1={50} x2={175} y2={50} stroke={COLORS.neonGreen} strokeWidth={0.5} opacity={0.35} />
      <line x1={148} y1={57} x2={172} y2={57} stroke={COLORS.neonGreen} strokeWidth={0.5} opacity={0.3} />
      <line x1={148} y1={64} x2={174} y2={64} stroke={COLORS.neonGreen} strokeWidth={0.5} opacity={0.28} />

      {/* === Lock icon with shield === */}
      <g>
        <path d="M258 40 L280 48 L280 68 C280 80 270 88 258 92 C246 88 236 80 236 68 L236 48 Z"
          stroke={COLORS.outline} strokeWidth={0.5} fill={`${COLORS.midGreen}40`} strokeLinejoin="round" />
        {/* Lock body */}
        <rect x={250} y={62} width={16} height={13} rx={2} stroke={COLORS.brightGreen} strokeWidth={0.5} fill={COLORS.darkGreen2} />
        {/* Lock shackle */}
        <path d="M253 62 L253 56 C253 50 263 50 263 56 L263 62" stroke={COLORS.brightGreen} strokeWidth={0.6} strokeLinecap="round" fill="none" />
        {/* Keyhole */}
        <circle cx={258} cy={69} r={2} fill={COLORS.neonGreen} opacity={0.4} />
        <line x1={258} y1={71} x2={258} y2={74} stroke={COLORS.neonGreen} strokeWidth={0.5} strokeLinecap="round" />
      </g>

      {/* === Timeline / history trail === */}
      <g>
        <line x1={52} y1={25} x2={52} y2={120} stroke={COLORS.outline} strokeWidth={0.5} />
        {[32, 50, 68, 86, 104].map((y, i) => (
          <g key={`tl-${i}`}>
            <circle cx={52} cy={y} r={3.5} stroke={COLORS.brightGreen} strokeWidth={0.5} fill={COLORS.darkGreen2} />
            <circle cx={52} cy={y} r={1.5} fill={COLORS.neonGreen} opacity={0.4} />
            <line x1={57} y1={y} x2={78} y2={y} stroke={COLORS.brightGreen} strokeWidth={0.35} strokeDasharray="2 2" opacity={0.3} />
          </g>
        ))}
        {/* Branch node */}
        <line x1={52} y1={68} x2={38} y2={58} stroke={COLORS.outline} strokeWidth={0.35} />
        <circle cx={38} cy={58} r={2.5} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={COLORS.darkGreen2} />
        <line x1={52} y1={86} x2={38} y2={95} stroke={COLORS.outline} strokeWidth={0.35} />
        <circle cx={38} cy={95} r={2.5} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={COLORS.darkGreen2} />
      </g>

      {/* === Verified checkmark badges === */}
      <g>
        <circle cx={90} cy={42} r={6} stroke={COLORS.neonGreen} strokeWidth={0.5} fill={`${COLORS.neonGreen}10`} />
        <path d="M87 42 L89 44 L94 39" stroke={COLORS.neonGreen} strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <g>
        <circle cx={96} cy={78} r={5} stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}08`} />
        <path d="M93 78 L95 80 L100 75" stroke={COLORS.brightGreen} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* === Stack of organized files === */}
      <g opacity={0.5}>
        <rect x={205} y={100} width={30} height={6} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />
        <rect x={205} y={106} width={30} height={6} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.midGreen} />
        <rect x={205} y={112} width={30} height={6} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />
        <rect x={205} y={118} width={30} height={6} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.midGreen} />
        {/* Tab labels */}
        <rect x={232} y={101} width={8} height={4} rx={0.5} stroke={COLORS.neonGreen} strokeWidth={0.25} fill={`${COLORS.neonGreen}10`} />
        <rect x={232} y={107} width={8} height={4} rx={0.5} stroke={COLORS.brightGreen} strokeWidth={0.25} fill={`${COLORS.brightGreen}08`} />
        <rect x={232} y={113} width={8} height={4} rx={0.5} stroke={COLORS.neonGreen} strokeWidth={0.25} fill={`${COLORS.neonGreen}10`} />
      </g>

      {/* === Security eye icon === */}
      <g opacity={0.4}>
        <path d="M270 108 C275 100 285 100 290 108 C285 116 275 116 270 108 Z" stroke={COLORS.brightGreen} strokeWidth={0.5} fill="none" />
        <circle cx={280} cy={108} r={3} stroke={COLORS.brightGreen} strokeWidth={0.4} fill="none" />
        <circle cx={280} cy={108} r={1.2} fill={COLORS.neonGreen} opacity={0.5} />
      </g>

      {/* === Figure 1 – auditor examining === */}
      <g>
        <circle cx={108} cy={100} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={105.5} y={103} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={106.5} y1={112} x2={105} y2={119} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={109.5} y1={112} x2={111} y2={119} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Pointing arm */}
        <line x1={110} y1={106} x2={120} y2={70} stroke={COLORS.figureLight} strokeWidth={0.5} strokeLinecap="round" />
      </g>

      {/* === Figure 2 – at terminal === */}
      <g>
        {/* Terminal desk */}
        <rect x={245} y={118} width={20} height={10} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />
        <rect x={248} y={110} width={14} height={8} rx={1} stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brightGreen}10`} />
        {/* Figure */}
        <circle cx={240} cy={108} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={237.5} y={111} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={238.5} y1={120} x2={237} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={241.5} y1={120} x2={243} y2={127} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* === Plant elements === */}
      <path d="M295 122 C295 114 291 110 288 113" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={287} cy={112} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 287 112)" />
      <path d="M295 122 C295 115 299 111 302 114" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={303} cy={113} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 303 113)" />
      <path d="M28 122 C28 116 24 113 21 116" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={20} cy={115} rx={2.5} ry={1.2} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-20 20 115)" />

      {/* === Floating hexagons === */}
      <polygon points="15,18 11.5,12 4.5,12 1,18 4.5,24 11.5,24" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="312,28 308.5,22.8 302.5,22.8 299,28 302.5,33.2 308.5,33.2" stroke={COLORS.neonGreen} strokeWidth={0.35} fill="none" opacity={0.15} />
      <polygon points="24,85 21.5,80.7 16.5,80.7 14,85 16.5,89.3 21.5,89.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={10} cy={8} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={310} cy={12} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={8} cy={148} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={312} cy={150} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={160} cy={3} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={200} cy={8} r={0.9} fill={COLORS.teal} opacity={0.3} />
      <circle cx={82} cy={12} r={1.1} fill={COLORS.teal} opacity={0.25} />

      {/* === Thin connecting lines === */}
      <line x1={8} y1={20} x2={38} y2={50} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={280} y1={92} x2={300} y2={98} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={306} y1={30} x2={280} y2={42} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   ZeroInfraIllustration – Cloud computing scene
   ────────────────────────────────────────────────────────────── */
export function ZeroInfraIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Isometric ground platform === */}
      <polygon points="25,132 160,152 295,132 160,112" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth={0.6} strokeLinejoin="round" />
      <line x1={60} y1={122} x2={195} y2={142} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={118} x2={230} y2={138} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={128} y1={114} x2={263} y2={134} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />
      <line x1={95} y1={142} x2={230} y2={122} stroke={COLORS.outline} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.1} />

      {/* === Large cloud shape === */}
      <path d="M95 58 C95 38 115 22 140 28 C145 10 180 8 188 28 C208 20 225 35 218 52 C232 56 226 78 212 78 L105 78 C90 78 82 68 95 58 Z"
        stroke={COLORS.brandGreen} strokeWidth={0.9} fill={`${COLORS.brandGreen}0A`} strokeLinecap="round" strokeLinejoin="round" />
      {/* Inner cloud highlight */}
      <path d="M110 62 C110 48 126 38 142 44 C145 32 170 30 174 44 C184 38 195 48 190 58"
        stroke={COLORS.brightGreen} strokeWidth={0.35} fill="none" opacity={0.2} />

      {/* === Lightning bolt for instant power === */}
      <path d="M158 78 L152 92 L160 92 L154 108" stroke={COLORS.neonGreen} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M160 78 L154 92 L162 92 L156 108" stroke={COLORS.neonGreen} strokeWidth={0.4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />

      {/* === Rocket / launch icon emerging from cloud === */}
      <g>
        {/* Rocket body */}
        <path d="M165 22 C165 14 172 8 172 8 C172 8 179 14 179 22 L179 38 L165 38 Z"
          stroke={COLORS.brightGreen} strokeWidth={0.6} fill={`${COLORS.brightGreen}15`} strokeLinejoin="round" />
        {/* Window */}
        <circle cx={172} cy={24} r={3} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}15`} />
        {/* Fins */}
        <path d="M165 34 L160 42 L165 38" stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} strokeLinejoin="round" />
        <path d="M179 34 L184 42 L179 38" stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} strokeLinejoin="round" />
        {/* Exhaust flames */}
        <path d="M168 38 L170 48 L172 42 L174 48 L176 38" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.4} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* === Small server rack below (faded / crossed out) === */}
      <g opacity={0.25}>
        <rect x={55} y={98} width={22} height={28} rx={1.5} stroke={COLORS.outline} strokeWidth={0.5} fill={COLORS.darkGreen2} />
        {/* Server slots */}
        <line x1={58} y1={104} x2={74} y2={104} stroke={COLORS.outline} strokeWidth={0.3} />
        <line x1={58} y1={110} x2={74} y2={110} stroke={COLORS.outline} strokeWidth={0.3} />
        <line x1={58} y1={116} x2={74} y2={116} stroke={COLORS.outline} strokeWidth={0.3} />
        {/* LEDs */}
        <circle cx={60} cy={107} r={0.8} fill={COLORS.teal} opacity={0.5} />
        <circle cx={60} cy={113} r={0.8} fill={COLORS.teal} opacity={0.5} />
        <circle cx={60} cy={119} r={0.8} fill={COLORS.teal} opacity={0.5} />
        {/* Cross out */}
        <line x1={53} y1={96} x2={79} y2={128} stroke={COLORS.teal} strokeWidth={0.6} strokeLinecap="round" />
        <line x1={79} y1={96} x2={53} y2={128} stroke={COLORS.teal} strokeWidth={0.6} strokeLinecap="round" />
      </g>

      {/* === Floating geometric cubes dissolving into cloud === */}
      {/* Cube 1 – lower, more opaque */}
      <g opacity={0.3}>
        <polygon points="96,90 96,82 104,78 104,86" stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brightGreen}10`} strokeLinejoin="round" />
        <polygon points="96,82 104,78 112,82 104,86" stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.midGreen}40`} strokeLinejoin="round" />
        <polygon points="104,86 112,82 112,90 104,94" stroke={COLORS.brightGreen} strokeWidth={0.4} fill={`${COLORS.brandGreen}40`} strokeLinejoin="round" />
      </g>
      {/* Cube 2 – higher, fading */}
      <g opacity={0.18}>
        <polygon points="108,72 108,64 116,60 116,68" stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brightGreen}08`} strokeLinejoin="round" />
        <polygon points="108,64 116,60 124,64 116,68" stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.midGreen}30`} strokeLinejoin="round" />
        <polygon points="116,68 124,64 124,72 116,76" stroke={COLORS.brightGreen} strokeWidth={0.35} fill={`${COLORS.brandGreen}30`} strokeLinejoin="round" />
      </g>
      {/* Cube 3 – dissolved dots */}
      <circle cx={118} cy={52} r={1} fill={COLORS.brightGreen} opacity={0.15} />
      <circle cx={122} cy={48} r={0.8} fill={COLORS.brightGreen} opacity={0.1} />
      <circle cx={115} cy={48} r={0.6} fill={COLORS.neonGreen} opacity={0.1} />

      {/* === Figure 1 – pressing launch button === */}
      <g>
        <circle cx={200} cy={100} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={197.5} y={103} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={198.5} y1={112} x2={197} y2={119} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={201.5} y1={112} x2={203} y2={119} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Arm reaching to button */}
        <line x1={202} y1={106} x2={212} y2={103} stroke={COLORS.figureLight} strokeWidth={0.5} strokeLinecap="round" />
        {/* Button / console */}
        <rect x={212} y={100} width={14} height={8} rx={1} stroke={COLORS.outline} strokeWidth={0.4} fill={COLORS.darkGreen2} />
        <circle cx={219} cy={104} r={2.5} stroke={COLORS.neonGreen} strokeWidth={0.4} fill={`${COLORS.neonGreen}25`} />
      </g>

      {/* === Figure 2 – celebrating === */}
      <g>
        <circle cx={248} cy={95} r={3} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <rect x={245.5} y={98} width={5} height={9} rx={1.5} stroke={COLORS.figureLight} strokeWidth={0.8} fill="none" />
        <line x1={246.5} y1={107} x2={245} y2={114} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={249.5} y1={107} x2={251} y2={114} stroke={COLORS.figureLight} strokeWidth={1.2} strokeLinecap="round" />
        {/* Raised arms */}
        <line x1={246} y1={100} x2={240} y2={90} stroke={COLORS.figureLight} strokeWidth={0.5} strokeLinecap="round" />
        <line x1={250} y1={100} x2={256} y2={90} stroke={COLORS.figureLight} strokeWidth={0.5} strokeLinecap="round" />
        {/* Celebration sparkle */}
        <line x1={238} y1={87} x2={236} y2={84} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.4} />
        <line x1={258} y1={87} x2={260} y2={84} stroke={COLORS.neonGreen} strokeWidth={0.3} strokeLinecap="round" opacity={0.4} />
        <circle cx={237} cy={83} r={0.8} fill={COLORS.neonGreen} opacity={0.35} />
        <circle cx={259} cy={83} r={0.8} fill={COLORS.neonGreen} opacity={0.35} />
      </g>

      {/* === Plant growing from where server was === */}
      <g>
        <path d="M66 96 C66 88 62 84 59 87" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={58} cy={86} rx={3.5} ry={1.8} fill={COLORS.lightGreen} opacity={0.5} transform="rotate(-30 58 86)" />
        <path d="M66 96 C66 89 70 85 73 88" stroke={COLORS.lightGreen} strokeWidth={0.6} fill="none" strokeLinecap="round" />
        <ellipse cx={74} cy={87} rx={3.5} ry={1.8} fill={COLORS.lightGreen} opacity={0.5} transform="rotate(30 74 87)" />
        <path d="M66 96 C66 92 63 90 61 92" stroke={COLORS.lightGreen} strokeWidth={0.4} fill="none" strokeLinecap="round" />
        <ellipse cx={60} cy={91.5} rx={2} ry={1} fill={COLORS.lightGreen} opacity={0.35} transform="rotate(-20 60 91.5)" />
      </g>

      {/* === Additional plant === */}
      <path d="M286 122 C286 114 282 110 279 113" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={278} cy={112} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(-30 278 112)" />
      <path d="M286 122 C286 115 290 111 293 114" stroke={COLORS.lightGreen} strokeWidth={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={294} cy={113} rx={3} ry={1.5} fill={COLORS.lightGreen} opacity={0.4} transform="rotate(30 294 113)" />

      {/* === Floating hexagons === */}
      <polygon points="18,22 14.5,16 7.5,16 4,22 7.5,28 14.5,28" stroke={COLORS.neonGreen} strokeWidth={0.4} fill="none" opacity={0.18} />
      <polygon points="310,30 306.5,24.8 300.5,24.8 297,30 300.5,35.2 306.5,35.2" stroke={COLORS.neonGreen} strokeWidth={0.35} fill="none" opacity={0.15} />
      <polygon points="302,105 299.5,100.7 294.5,100.7 292,105 294.5,109.3 299.5,109.3" stroke={COLORS.neonGreen} strokeWidth={0.3} fill="none" opacity={0.2} />

      {/* === Scattered dots === */}
      <circle cx={10} cy={10} r={1} fill={COLORS.neonGreen} opacity={0.25} />
      <circle cx={312} cy={14} r={1.2} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={6} cy={148} r={0.8} fill={COLORS.brightGreen} opacity={0.3} />
      <circle cx={314} cy={150} r={1} fill={COLORS.brightGreen} opacity={0.25} />
      <circle cx={140} cy={3} r={1.5} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={250} cy={8} r={0.9} fill={COLORS.teal} opacity={0.3} />
      <circle cx={50} cy={15} r={1.1} fill={COLORS.teal} opacity={0.25} />
      <circle cx={190} cy={6} r={0.8} fill={COLORS.neonGreen} opacity={0.35} />

      {/* === Thin connecting lines === */}
      <line x1={12} y1={24} x2={55} y2={60} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={218} y1={78} x2={250} y2={95} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
      <line x1={304} y1={32} x2={286} y2={62} stroke={COLORS.outline} strokeWidth={0.3} opacity={0.1} />
    </svg>
  );
}
